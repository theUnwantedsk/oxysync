/**
 * OXYSYNC 2.0 — Simulation Engine Header
 * 
 * Implements deterministic Boyle's law physics, dual-cylinder tracking,
 * automatic failover logic, 5-minute reserve buffer maintenance,
 * patient vitals generation, and 8 one-click exhibition scenarios.
 */

#ifndef SIMULATION_ENGINE_H
#define SIMULATION_ENGINE_H

#include <Arduino.h>
#include <ArduinoJson.h>
#if __has_include("hardware_config.h")
#include "hardware_config.h"
#else
#include "../include/hardware_config.h"
#endif

enum SupplySource {
    SOURCE_PRIMARY = 0,
    SOURCE_BACKUP  = 1,
    SOURCE_RESERVE = 2,
    SOURCE_NONE    = 3
};

enum OperatingMode {
    MODE_AUTO             = 0,
    MODE_MANUAL_PRIMARY   = 1,
    MODE_MANUAL_BACKUP    = 2,
    MODE_EMERGENCY_BUFFER = 3
};

enum AlertSeverity {
    SEV_NORMAL   = 0,
    SEV_INFO     = 1,
    SEV_WARNING  = 2,
    SEV_CRITICAL = 3
};

struct CylinderData {
    float pressureBar;
    float remainingLiters;
    float percentage;
    bool isConnected;
    bool isActive;
};

struct ReserveBufferData {
    float remainingLiters;
    float percentage;
    float remainingSeconds;
    bool isActive;
    bool isRecharging;
};

struct PatientVitalsData {
    float spo2;
    int pulseRate;
    int respirationRate;
    float perfusionIndex;
};

struct EventLogItem {
    unsigned long timestampMs;
    char message[64];
    AlertSeverity severity;
};

class SimulationEngine {
public:
    SimulationEngine();
    void begin();
    void update(unsigned long currentMillis);

    // Controls & Overrides
    void setFlowRate(float lpm);
    void setSimulationSpeed(float speed);
    void setSwitchingThreshold(float thresholdPct);
    void setAutoMode();
    void manualSwitchSupply(SupplySource target);
    void refillCylinder(SupplySource target);
    void resetToDefault();
    void applyScenario(int scenarioId);
    bool executeJsonCommand(const JsonObjectConst& cmdDoc);

    // Getters for Telemetry & LCD
    SupplySource getActiveSource() const { return m_activeSource; }
    OperatingMode getOperatingMode() const { return m_mode; }
    const CylinderData& getPrimary() const { return m_primary; }
    const CylinderData& getBackup() const { return m_backup; }
    const ReserveBufferData& getReserve() const { return m_reserve; }
    const PatientVitalsData& getVitals() const { return m_vitals; }
    float getFlowRate() const { return m_flowRateLpm; }
    float getSimSpeed() const { return m_simSpeed; }
    float getSwitchThreshold() const { return m_switchThresholdPct; }
    float getEstimatedRemainingMinutes() const;
    const char* getActiveAlertMessage() const { return m_activeAlertMessage; }
    AlertSeverity getAlertSeverity() const { return m_currentSeverity; }
    int getActiveScenarioId() const { return m_activeScenarioId; }
    const char* getScenarioExplanation() const { return m_scenarioExplanation; }

    // Serialization for API and WebSocket
    void serializeTelemetry(JsonObject& root);
    void serializeVitals(JsonObject& root);
    void serializePrediction(JsonObject& root);
    void serializeAlerts(JsonObject& root);

    // Event Logging
    void logEvent(const char* msg, AlertSeverity sev);
    int getEventCount() const { return m_eventCount; }
    const EventLogItem& getEvent(int index) const { return m_events[index % MAX_EVENTS]; }

private:
    void calculatePhysics(float deltaSeconds);
    void evaluateSwitchingLogic();
    void updateVitalsSimulation(float deltaSeconds);
    void updateHardwareOutputs();

    SupplySource m_activeSource;
    OperatingMode m_mode;
    CylinderData m_primary;
    CylinderData m_backup;
    ReserveBufferData m_reserve;
    PatientVitalsData m_vitals;

    float m_flowRateLpm;
    float m_simSpeed;
    float m_switchThresholdPct;
    unsigned long m_lastTickMs;

    int m_activeScenarioId;
    char m_scenarioExplanation[128];
    char m_activeAlertMessage[64];
    AlertSeverity m_currentSeverity;

    static const int MAX_EVENTS = 10;
    EventLogItem m_events[MAX_EVENTS];
    int m_eventCount;
    int m_eventHead;
};

#endif // SIMULATION_ENGINE_H
