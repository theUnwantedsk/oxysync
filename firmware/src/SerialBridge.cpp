/**
 * OXYSYNC 2.0 — USB Serial Real-Time Data Bridge Implementation
 *
 * Non-blocking USB UART JSON-lines protocol (115200 baud):
 * - Emits live telemetry frames at USB_TELEMETRY_INTERVAL_MS (default 250ms / 4Hz)
 * - Accepts JSON commands terminated by '\n' (e.g. {"action":"scenario","id":3})
 * - Responds immediately with ack + updated telemetry on every command
 */

#if __has_include("SerialBridge.h")
#include "SerialBridge.h"
#else
#include "../include/SerialBridge.h"
#endif

SerialBridge::SerialBridge(SimulationEngine& simEngine, DisplayManager& displayManager)
    : m_sim(simEngine),
      m_display(displayManager),
      m_streamEnabled(true),
      m_streamIntervalMs(USB_TELEMETRY_INTERVAL_MS),
      m_lastStreamMs(0),
      m_rxIndex(0),
      m_rxOverflowed(false)
{
    memset(m_rxBuffer, 0, sizeof(m_rxBuffer));
}

void SerialBridge::begin() {
    m_lastStreamMs = millis();
    m_rxIndex = 0;
    m_rxOverflowed = false;
    sendTelemetryNow();
}

void SerialBridge::update(unsigned long currentMillis) {
    readIncomingCommands();

    if (m_streamEnabled && (currentMillis - m_lastStreamMs >= m_streamIntervalMs)) {
        m_lastStreamMs = currentMillis;
        sendTelemetryNow();
    }
}

void SerialBridge::readIncomingCommands() {
    while (Serial.available() > 0) {
        int raw = Serial.read();
        if (raw < 0) break;
        char c = static_cast<char>(raw);

        if (c == '\r' || c == '\n') {
            if (m_rxOverflowed) {
                m_rxOverflowed = false;
                m_rxIndex = 0;
                sendAck("parse", false, "Command exceeded 255 byte buffer");
            } else if (m_rxIndex > 0) {
                m_rxBuffer[m_rxIndex] = '\0';
                processCommandLine(m_rxBuffer);
                m_rxIndex = 0;
            }
            continue;
        }

        if (m_rxOverflowed) {
            continue;
        }

        if (m_rxIndex < RX_BUFFER_SIZE - 1) {
            m_rxBuffer[m_rxIndex++] = c;
        } else {
            m_rxOverflowed = true;
        }
    }
}

void SerialBridge::processCommandLine(const char* line) {
    // Trim leading whitespace before checking if line is a JSON object
    while (*line == ' ' || *line == '\t') {
        line++;
    }
    if (*line != '{') {
        return;
    }

    StaticJsonDocument<256> cmdDoc;
    DeserializationError err = deserializeJson(cmdDoc, line);
    if (err) {
        sendAck("parse", false, "Invalid JSON command");
        return;
    }

    JsonObjectConst root = cmdDoc.as<JsonObjectConst>();
    const char* action = root["action"] | "";
    if (strlen(action) == 0) {
        sendAck("unknown", false, "Missing action field");
        return;
    }

    if (strcmp(action, "ping") == 0) {
        StaticJsonDocument<192> pong;
        pong["type"] = "pong";
        pong["protocol"] = "oxysync-usb-v1";
        pong["uptimeMs"] = millis();
        pong["streamEnabled"] = m_streamEnabled;
        pong["intervalMs"] = m_streamIntervalMs;
        serializeJson(pong, Serial);
        Serial.println();
        sendTelemetryNow();
        return;
    }

    if (strcmp(action, "stream") == 0) {
        if (root.containsKey("enabled")) {
            m_streamEnabled = root["enabled"].as<bool>();
        }
        if (root.containsKey("intervalMs")) {
            unsigned long requested = root["intervalMs"].as<unsigned long>();
            if (requested < 100) requested = 100;
            if (requested > 5000) requested = 5000;
            m_streamIntervalMs = requested;
        }
        sendAck("stream", true);
        if (m_streamEnabled) {
            sendTelemetryNow();
        }
        return;
    }

    if (m_sim.executeJsonCommand(root)) {
        sendAck(action, true);
        sendTelemetryNow();
        m_lastStreamMs = millis();
    } else {
        sendAck(action, false, "Unsupported or malformed command");
    }
}

void SerialBridge::sendAck(const char* action, bool ok, const char* detail) {
    StaticJsonDocument<192> ackDoc;
    ackDoc["type"] = "ack";
    ackDoc["action"] = action;
    ackDoc["ok"] = ok;
    if (detail != nullptr) {
        ackDoc["detail"] = detail;
    }
    serializeJson(ackDoc, Serial);
    Serial.println();
}

void SerialBridge::sendTelemetryNow() {
    StaticJsonDocument<1536> doc;
    JsonObject root = doc.to<JsonObject>();
    root["type"] = "telemetry";
    root["transport"] = "usb_serial";
    root["protocol"] = "oxysync-usb-v1";
    root["lcdReady"] = m_display.isLcdReady();

    char addrBuf[8];
    snprintf(addrBuf, sizeof(addrBuf), "0x%02X", m_display.getDetectedAddress());
    root["lcdAddress"] = addrBuf;

    m_sim.serializeTelemetry(root);

    serializeJson(doc, Serial);
    Serial.println();
}
