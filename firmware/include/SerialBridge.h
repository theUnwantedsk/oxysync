/**
 * OXYSYNC 2.0 — USB Serial Real-Time Data Bridge Header
 *
 * Streams newline-delimited JSON telemetry packets over USB UART
 * and parses incoming non-blocking JSON commands from PC / Web Serial clients.
 */

#ifndef SERIAL_BRIDGE_H
#define SERIAL_BRIDGE_H

#include <Arduino.h>
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

class SerialBridge {
public:
    SerialBridge(SimulationEngine& simEngine, DisplayManager& displayManager);

    void begin();
    void update(unsigned long currentMillis);
    void sendTelemetryNow();

    bool isStreamEnabled() const { return m_streamEnabled; }
    unsigned long getStreamIntervalMs() const { return m_streamIntervalMs; }

private:
    void readIncomingCommands();
    void processCommandLine(const char* line);
    void sendAck(const char* action, bool ok, const char* detail = nullptr);

    SimulationEngine& m_sim;
    DisplayManager& m_display;

    bool m_streamEnabled;
    unsigned long m_streamIntervalMs;
    unsigned long m_lastStreamMs;

    static const size_t RX_BUFFER_SIZE = 256;
    char m_rxBuffer[RX_BUFFER_SIZE];
    size_t m_rxIndex;
    bool m_rxOverflowed;
};

#endif // SERIAL_BRIDGE_H
