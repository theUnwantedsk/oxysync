/**
 * OXYSYNC 2.0 — Network Server Header
 * 
 * Manages Wi-Fi Dual Mode (Station + SoftAP Fallback),
 * HTTP REST API (Port 80), and WebSocket Telemetry Server (Port 81).
 */

#ifndef NETWORK_SERVER_H
#define NETWORK_SERVER_H

#include <Arduino.h>
#include <WiFi.h>
#include <WebServer.h>
#include <WebSocketsServer.h>
#include <ArduinoJson.h>
#if __has_include("hardware_config.h")
#include "hardware_config.h"
#include "SimulationEngine.h"
#include "DisplayManager.h"
#else
#include "../include/hardware_config.h"
#include "../include/SimulationEngine.h"
#include "../include/DisplayManager.h"
#endif

class NetworkServer {
public:
    NetworkServer(SimulationEngine& simEngine, DisplayManager& displayManager);
    void begin();
    void update(unsigned long currentMillis);

    bool isApMode() const { return m_isApMode; }
    String getIpAddress() const { return m_ipAddress; }
    int getConnectedClients() const { return m_connectedClients; }

private:
    void setupWiFi();
    void setupRestRoutes();
    void setupWebSocket();
    void broadcastTelemetry();
    void handleWebSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t length);

    // REST Route Handlers
    void handleRoot();
    void handleApiStatus();
    void handleApiVitals();
    void handleApiPrediction();
    void handleApiAlerts();
    void handleApiControlSwitch();
    void handleApiControlFlow();
    void handleApiControlRefill();
    void handleApiControlScenario();
    void handleApiControlReset();
    void handleNotFound();

    void sendJsonResponse(int statusCode, const JsonDocument& doc);
    void setCorsHeaders();

    SimulationEngine& m_sim;
    DisplayManager& m_display;

    WebServer m_httpServer;
    WebSocketsServer m_wsServer;

    bool m_isApMode;
    String m_ipAddress;
    int m_connectedClients;
    unsigned long m_lastBroadcastMs;
};

#endif // NETWORK_SERVER_H
