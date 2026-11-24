/**
 * OXYSYNC 2.0 — Network Server Implementation
 * 
 * Provides Dual-Mode Wi-Fi (STA + SoftAP fallback),
 * full REST JSON API (Port 80) and 2Hz WebSocket telemetry broadcast (Port 81).
 */

#include "NetworkServer.h"

// HTML Landing Page served at GET /
static const char INDEX_HTML[] PROGMEM = R"rawliteral(
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OXYSYNC 2.0 — Connected Controller</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0b0f19; color: #f3f4f6; margin: 0; padding: 20px; }
    .card { background: #151d30; border: 1px solid #1f2d4d; border-radius: 12px; padding: 20px; max-width: 600px; margin: 0 auto 20px auto; box-shadow: 0 4px 20px rgba(0,0,0,0.5); }
    h1 { color: #00e5ff; margin-top: 0; font-size: 22px; display: flex; align-items: center; justify-content: space-between; }
    .badge { background: #059669; color: white; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: bold; }
    .badge-sim { background: #d97706; }
    .stat-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #1e293b; }
    .label { color: #94a3b8; }
    .val { font-weight: bold; color: #38bdf8; }
    .val-warn { color: #f59e0b; }
    .val-crit { color: #ef4444; }
    .disclaimer { font-size: 11px; color: #64748b; text-align: center; margin-top: 15px; }
    .btn-group { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 15px; }
    button { background: #0284c7; color: white; border: none; padding: 10px; border-radius: 6px; font-weight: bold; cursor: pointer; transition: 0.2s; }
    button:hover { background: #0369a1; }
    button.btn-warn { background: #d97706; }
    button.btn-danger { background: #dc2626; }
  </style>
</head>
<body>
  <div class="card">
    <h1>OXYSYNC 2.0 <span class="badge badge-sim">PROTOTYPE SIMULATOR</span></h1>
    <p style="color:#94a3b8; font-size:13px; margin-top:-5px;">ESP32 Embedded Core & Telemetry Server</p>
    
    <div class="stat-row"><span class="label">Primary Supply:</span><span id="priVal" class="val">-- % (-- Bar)</span></div>
    <div class="stat-row"><span class="label">Backup Supply:</span><span id="bckVal" class="val">-- % (-- Bar)</span></div>
    <div class="stat-row"><span class="label">5-Min Reserve Buffer:</span><span id="resVal" class="val">-- % (-- s)</span></div>
    <div class="stat-row"><span class="label">Active Supply Line:</span><span id="actVal" class="val" style="color:#10b981;">--</span></div>
    <div class="stat-row"><span class="label">Estimated Remaining:</span><span id="estVal" class="val">-- mins</span></div>
    <div class="stat-row"><span class="label">Patient SpO2 / Pulse:</span><span id="vitVal" class="val">-- % / -- bpm</span></div>
    <div class="stat-row"><span class="label">System Alert:</span><span id="alrtVal" class="val val-warn">--</span></div>

    <div class="btn-group">
      <button onclick="triggerScenario(1)">Normal Operation</button>
      <button class="btn-warn" onclick="triggerScenario(3)">Auto-Switch Test</button>
      <button class="btn-danger" onclick="triggerScenario(7)">Reserve Buffer</button>
      <button onclick="refillAll()">Refill Cylinders</button>
    </div>

    <p class="disclaimer">
      OXYSYNC Medical Mechatronics Prototype &bull; Designed for Exhibition Demo.<br>
      For full controls and live plethysmograph waveform, connect the Native Kotlin Android App.
    </p>
  </div>

  <script>
    async function updateData() {
      try {
        const res = await fetch('/api/status');
        const d = await res.json();
        document.getElementById('priVal').innerText = `${d.primary.percentage.toFixed(0)}% (${d.primary.pressureBar.toFixed(0)} Bar)`;
        document.getElementById('bckVal').innerText = `${d.backup.percentage.toFixed(0)}% (${d.backup.pressureBar.toFixed(0)} Bar)`;
        document.getElementById('resVal').innerText = `${d.reserve.percentage.toFixed(0)}% (${d.reserve.remainingSeconds.toFixed(0)}s)`;
        document.getElementById('actVal').innerText = d.activeSource;
        document.getElementById('estVal').innerText = `${d.estRemainingMinutes.toFixed(1)} mins`;
        document.getElementById('vitVal').innerText = `${d.vitals.spo2.toFixed(1)}% / ${d.vitals.pulseRate} bpm`;
        document.getElementById('alrtVal').innerText = d.activeAlertMessage;
      } catch (e) {}
    }
    async function triggerScenario(id) {
      await fetch('/api/control/scenario', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({scenarioId: id})
      });
      updateData();
    }
    async function refillAll() {
      await fetch('/api/control/refill', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({cylinder: 'ALL'})
      });
      updateData();
    }
    setInterval(updateData, 1000);
    updateData();
  </script>
</body>
</html>
)rawliteral";

NetworkServer::NetworkServer(SimulationEngine& simEngine, DisplayManager& displayManager)
    : m_sim(simEngine),
      m_display(displayManager),
      m_httpServer(HTTP_SERVER_PORT),
      m_wsServer(WEBSOCKET_SERVER_PORT),
      m_isApMode(false),
      m_ipAddress("0.0.0.0"),
      m_connectedClients(0),
      m_lastBroadcastMs(0)
{
}

void NetworkServer::begin() {
    setupWiFi();
    setupRestRoutes();
    setupWebSocket();

    m_httpServer.begin();
    m_wsServer.begin();

    // Bind websocket callback
    m_wsServer.onEvent([this](uint8_t num, WStype_t type, uint8_t * payload, size_t length) {
        this->handleWebSocketEvent(num, type, payload, length);
    });

    m_display.setNetworkInfo(m_isApMode, m_ipAddress, m_connectedClients);
}

void NetworkServer::setupWiFi() {
    WiFi.disconnect(true);
    delay(100);

    Serial.print(F("[WiFi] Attempting connection to SSID: "));
    Serial.println(WIFI_STA_SSID);

    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_STA_SSID, WIFI_STA_PASS);

    unsigned long startMs = millis();
    bool connected = false;

    while (millis() - startMs < WIFI_STA_TIMEOUT_MS) {
        if (WiFi.status() == WL_CONNECTED) {
            connected = true;
            break;
        }
        delay(250);
        Serial.print('.');
    }
    Serial.println();

    if (connected) {
        m_isApMode = false;
        m_ipAddress = WiFi.localIP().toString();
        Serial.print(F("[WiFi] Connected to STA! IP: "));
        Serial.println(m_ipAddress);
    } else {
        // Fallback to standalone SoftAP mode for offline exhibition demo
        m_isApMode = true;
        WiFi.mode(WIFI_AP);
        WiFi.softAP(WIFI_AP_SSID, WIFI_AP_PASS, WIFI_AP_CHANNEL, 0, WIFI_AP_MAX_CONN);
        m_ipAddress = WiFi.softAPIP().toString();
        Serial.print(F("[WiFi] Launching SoftAP mode. SSID: "));
        Serial.print(WIFI_AP_SSID);
        Serial.print(F(" | IP: "));
        Serial.println(m_ipAddress);
    }
}

void NetworkServer::setCorsHeaders() {
    m_httpServer.sendHeader("Access-Control-Allow-Origin", "*");
    m_httpServer.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    m_httpServer.sendHeader("Access-Control-Allow-Headers", "Content-Type");
}

void NetworkServer::sendJsonResponse(int statusCode, const JsonDocument& doc) {
    setCorsHeaders();
    String output;
    serializeJson(doc, output);
    m_httpServer.send(statusCode, "application/json", output);
}

void NetworkServer::setupRestRoutes() {
    // OPTIONS preflight handler for CORS
    m_httpServer.onNotFound([this]() {
        if (this->m_httpServer.method() == HTTP_OPTIONS) {
            this->setCorsHeaders();
            this->m_httpServer.send(204);
        } else {
            this->handleNotFound();
        }
    });

    // Root HTML landing page
    m_httpServer.on("/", HTTP_GET, [this]() { this->handleRoot(); });

    // REST Telemetry Endpoints
    m_httpServer.on("/api/status", HTTP_GET, [this]() { this->handleApiStatus(); });
    m_httpServer.on("/api/vitals", HTTP_GET, [this]() { this->handleApiVitals(); });
    m_httpServer.on("/api/prediction", HTTP_GET, [this]() { this->handleApiPrediction(); });
    m_httpServer.on("/api/alerts", HTTP_GET, [this]() { this->handleApiAlerts(); });

    // Control Endpoints (POST)
    m_httpServer.on("/api/control/switch", HTTP_POST, [this]() { this->handleApiControlSwitch(); });
    m_httpServer.on("/api/control/flow", HTTP_POST, [this]() { this->handleApiControlFlow(); });
    m_httpServer.on("/api/control/refill", HTTP_POST, [this]() { this->handleApiControlRefill(); });
    m_httpServer.on("/api/control/scenario", HTTP_POST, [this]() { this->handleApiControlScenario(); });
    m_httpServer.on("/api/control/reset", HTTP_POST, [this]() { this->handleApiControlReset(); });
}

void NetworkServer::setupWebSocket() {
    // WebSocket initialized on Port 81
}

void NetworkServer::update(unsigned long currentMillis) {
    m_httpServer.handleClient();
    m_wsServer.loop();

    // Check client counts
    int count = m_isApMode ? WiFi.softAPgetStationNum() : m_wsServer.connectedClients();
    if (count != m_connectedClients) {
        m_connectedClients = count;
        m_display.setNetworkInfo(m_isApMode, m_ipAddress, m_connectedClients);
    }

    // Broadcast WebSocket telemetry at configured interval (e.g. 500ms = 2Hz)
    if (currentMillis - m_lastBroadcastMs >= TELEMETRY_BROADCAST_MS) {
        m_lastBroadcastMs = currentMillis;
        broadcastTelemetry();
    }
}

void NetworkServer::broadcastTelemetry() {
    if (m_wsServer.connectedClients() <= 0) return;

    StaticJsonDocument<1024> doc;
    JsonObject root = doc.to<JsonObject>();
    m_sim.serializeTelemetry(root);

    String output;
    serializeJson(doc, output);
    m_wsServer.broadcastTXT(output);
}

void NetworkServer::handleWebSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t length) {
    switch (type) {
        case WStype_DISCONNECTED:
            Serial.printf("[WS] Client #%u disconnected\n", num);
            break;
        case WStype_CONNECTED: {
            IPAddress ip = m_wsServer.remoteIP(num);
            Serial.printf("[WS] Client #%u connected from %s\n", num, ip.toString().c_str());
            // Immediately send current status on connect
            StaticJsonDocument<1024> doc;
            JsonObject root = doc.to<JsonObject>();
            m_sim.serializeTelemetry(root);
            String output;
            serializeJson(doc, output);
            m_wsServer.sendTXT(num, output);
            break;
        }
        case WStype_TEXT: {
            // Parse incoming JSON commands from Android or web clients
            StaticJsonDocument<256> cmdDoc;
            DeserializationError err = deserializeJson(cmdDoc, payload, length);
            if (!err) {
                if (cmdDoc.containsKey("action")) {
                    const char* action = cmdDoc["action"];
                    if (strcmp(action, "scenario") == 0 && cmdDoc.containsKey("id")) {
                        m_sim.applyScenario(cmdDoc["id"]);
                    } else if (strcmp(action, "switch") == 0 && cmdDoc.containsKey("target")) {
                        const char* target = cmdDoc["target"];
                        if (strcmp(target, "PRIMARY") == 0) m_sim.manualSwitchSupply(SOURCE_PRIMARY);
                        else if (strcmp(target, "BACKUP") == 0) m_sim.manualSwitchSupply(SOURCE_BACKUP);
                    } else if (strcmp(action, "flow") == 0 && cmdDoc.containsKey("rate")) {
                        m_sim.setFlowRate(cmdDoc["rate"]);
                    } else if (strcmp(action, "refill") == 0) {
                        m_sim.refillCylinder(SOURCE_NONE); // Refill all
                    } else if (strcmp(action, "reset") == 0) {
                        m_sim.resetToDefault();
                    }
                    broadcastTelemetry();
                }
            }
            break;
        }
        default:
            break;
    }
}

void NetworkServer::handleRoot() {
    m_httpServer.send(200, "text/html", INDEX_HTML);
}

void NetworkServer::handleApiStatus() {
    StaticJsonDocument<1024> doc;
    JsonObject root = doc.to<JsonObject>();
    m_sim.serializeTelemetry(root);
    sendJsonResponse(200, doc);
}

void NetworkServer::handleApiVitals() {
    StaticJsonDocument<256> doc;
    JsonObject root = doc.to<JsonObject>();
    m_sim.serializeVitals(root);
    sendJsonResponse(200, doc);
}

void NetworkServer::handleApiPrediction() {
    StaticJsonDocument<256> doc;
    JsonObject root = doc.to<JsonObject>();
    m_sim.serializePrediction(root);
    sendJsonResponse(200, doc);
}

void NetworkServer::handleApiAlerts() {
    StaticJsonDocument<1024> doc;
    JsonObject root = doc.to<JsonObject>();
    m_sim.serializeAlerts(root);
    sendJsonResponse(200, doc);
}

void NetworkServer::handleApiControlSwitch() {
    if (!m_httpServer.hasArg("plain")) {
        m_httpServer.send(400, "text/plain", "Missing body");
        return;
    }
    StaticJsonDocument<128> doc;
    deserializeJson(doc, m_httpServer.arg("plain"));
    const char* target = doc["target"] | "PRIMARY";
    if (strcmp(target, "BACKUP") == 0) {
        m_sim.manualSwitchSupply(SOURCE_BACKUP);
    } else {
        m_sim.manualSwitchSupply(SOURCE_PRIMARY);
    }
    handleApiStatus();
}

void NetworkServer::handleApiControlFlow() {
    if (!m_httpServer.hasArg("plain")) {
        m_httpServer.send(400, "text/plain", "Missing body");
        return;
    }
    StaticJsonDocument<128> doc;
    deserializeJson(doc, m_httpServer.arg("plain"));
    float rate = doc["rate"] | 5.0f;
    m_sim.setFlowRate(rate);
    handleApiStatus();
}

void NetworkServer::handleApiControlRefill() {
    if (m_httpServer.hasArg("plain")) {
        StaticJsonDocument<128> doc;
        deserializeJson(doc, m_httpServer.arg("plain"));
        const char* cyl = doc["cylinder"] | "ALL";
        if (strcmp(cyl, "PRIMARY") == 0) m_sim.refillCylinder(SOURCE_PRIMARY);
        else if (strcmp(cyl, "BACKUP") == 0) m_sim.refillCylinder(SOURCE_BACKUP);
        else m_sim.refillCylinder(SOURCE_NONE);
    } else {
        m_sim.refillCylinder(SOURCE_NONE);
    }
    handleApiStatus();
}

void NetworkServer::handleApiControlScenario() {
    if (!m_httpServer.hasArg("plain")) {
        m_httpServer.send(400, "text/plain", "Missing body");
        return;
    }
    StaticJsonDocument<128> doc;
    deserializeJson(doc, m_httpServer.arg("plain"));
    int scenarioId = doc["scenarioId"] | 1;
    m_sim.applyScenario(scenarioId);
    handleApiStatus();
}

void NetworkServer::handleApiControlReset() {
    m_sim.resetToDefault();
    handleApiStatus();
}

void NetworkServer::handleNotFound() {
    setCorsHeaders();
    m_httpServer.send(404, "application/json", "{\"error\":\"Endpoint not found\"}");
}
