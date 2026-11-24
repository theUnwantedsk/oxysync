/**
 * OXYSYNC 2.0 — Simulation Engine Implementation
 * 
 * Implements deterministic Boyle's law physics:
 * V = P * V_water, dV/dt = -Q
 * Auto-switching failover, 5-minute reserve buffer maintenance,
 * patient vitals generation, and 8 one-click exhibition scenarios.
 */

#include "SimulationEngine.h"

SimulationEngine::SimulationEngine()
    : m_activeSource(SOURCE_PRIMARY),
      m_mode(MODE_AUTO),
      m_flowRateLpm(DEFAULT_OXYGEN_FLOW_LPM),
      m_simSpeed(DEFAULT_SIM_SPEED),
      m_switchThresholdPct(AUTO_SWITCH_THRESHOLD_PCT),
      m_lastTickMs(0),
      m_activeScenarioId(1),
      m_currentSeverity(SEV_NORMAL),
      m_eventCount(0),
      m_eventHead(0)
{
    memset(m_scenarioExplanation, 0, sizeof(m_scenarioExplanation));
    memset(m_activeAlertMessage, 0, sizeof(m_activeAlertMessage));
}

void SimulationEngine::begin() {
    // Configure hardware solenoid relay and buzzer pins if defined
    #if defined(PIN_SOLENOID_PRIMARY) && (PIN_SOLENOID_PRIMARY >= 0)
    pinMode(PIN_SOLENOID_PRIMARY, OUTPUT);
    #endif
    #if defined(PIN_SOLENOID_BACKUP) && (PIN_SOLENOID_BACKUP >= 0)
    pinMode(PIN_SOLENOID_BACKUP, OUTPUT);
    #endif
    #if defined(PIN_SOLENOID_RESERVE) && (PIN_SOLENOID_RESERVE >= 0)
    pinMode(PIN_SOLENOID_RESERVE, OUTPUT);
    #endif
    #if defined(PIN_ALARM_BUZZER) && (PIN_ALARM_BUZZER >= 0)
    pinMode(PIN_ALARM_BUZZER, OUTPUT);
    #endif

    resetToDefault();
    m_lastTickMs = millis();
    logEvent("OXYSYNC System Initialized", SEV_INFO);
}

void SimulationEngine::resetToDefault() {
    m_mode = MODE_AUTO;
    m_activeSource = SOURCE_PRIMARY;
    m_flowRateLpm = DEFAULT_OXYGEN_FLOW_LPM;
    m_simSpeed = DEFAULT_SIM_SPEED;
    m_switchThresholdPct = AUTO_SWITCH_THRESHOLD_PCT;

    // Primary Cylinder: 100% full (150 Bar, 1500 Liters)
    m_primary.pressureBar = CYLINDER_MAX_PRESSURE_BAR;
    m_primary.remainingLiters = CYLINDER_MAX_CAPACITY_L;
    m_primary.percentage = 100.0f;
    m_primary.isConnected = true;
    m_primary.isActive = true;

    // Backup Cylinder: 100% full (150 Bar, 1500 Liters)
    m_backup.pressureBar = CYLINDER_MAX_PRESSURE_BAR;
    m_backup.remainingLiters = CYLINDER_MAX_CAPACITY_L;
    m_backup.percentage = 100.0f;
    m_backup.isConnected = true;
    m_backup.isActive = false;

    // 5-Minute Reserve Buffer: 100% full (25 Liters @ 5 L/min = 300 seconds)
    m_reserve.remainingLiters = RESERVE_BUFFER_CAPACITY_L;
    m_reserve.percentage = 100.0f;
    m_reserve.remainingSeconds = (RESERVE_BUFFER_CAPACITY_L / m_flowRateLpm) * 60.0f;
    m_reserve.isActive = false;
    m_reserve.isRecharging = false;

    // Patient Vitals: Healthy baseline
    m_vitals.spo2 = 98.2f;
    m_vitals.pulseRate = 74;
    m_vitals.respirationRate = 16;
    m_vitals.perfusionIndex = 4.5f;

    m_activeScenarioId = 1;
    strncpy(m_scenarioExplanation, "Normal Operation: Primary supply nominal, backup online.", sizeof(m_scenarioExplanation) - 1);
    strncpy(m_activeAlertMessage, "System Nominal", sizeof(m_activeAlertMessage) - 1);
    m_currentSeverity = SEV_NORMAL;

    updateHardwareOutputs();
}

void SimulationEngine::update(unsigned long currentMillis) {
    if (m_lastTickMs == 0) {
        m_lastTickMs = currentMillis;
        return;
    }

    float deltaSeconds = (currentMillis - m_lastTickMs) / 1000.0f;
    if (deltaSeconds <= 0.0f) return;
    m_lastTickMs = currentMillis;

    calculatePhysics(deltaSeconds);
    evaluateSwitchingLogic();
    updateVitalsSimulation(deltaSeconds);
    updateHardwareOutputs();
}

void SimulationEngine::calculatePhysics(float deltaSeconds) {
    float effectiveDelta = deltaSeconds * m_simSpeed;
    float litersConsumed = (m_flowRateLpm / 60.0f) * effectiveDelta;

    // Deduct gas from currently active oxygen source
    if (m_activeSource == SOURCE_PRIMARY && m_primary.remainingLiters > 0.0f) {
        m_primary.remainingLiters -= litersConsumed;
        if (m_primary.remainingLiters < 0.0f) m_primary.remainingLiters = 0.0f;
        m_primary.pressureBar = m_primary.remainingLiters / CYLINDER_WATER_VOL_L;
        m_primary.percentage = (m_primary.remainingLiters / CYLINDER_MAX_CAPACITY_L) * 100.0f;
    } 
    else if (m_activeSource == SOURCE_BACKUP && m_backup.remainingLiters > 0.0f) {
        m_backup.remainingLiters -= litersConsumed;
        if (m_backup.remainingLiters < 0.0f) m_backup.remainingLiters = 0.0f;
        m_backup.pressureBar = m_backup.remainingLiters / CYLINDER_WATER_VOL_L;
        m_backup.percentage = (m_backup.remainingLiters / CYLINDER_MAX_CAPACITY_L) * 100.0f;
    } 
    else if (m_activeSource == SOURCE_RESERVE && m_reserve.remainingLiters > 0.0f) {
        m_reserve.remainingLiters -= litersConsumed;
        if (m_reserve.remainingLiters < 0.0f) m_reserve.remainingLiters = 0.0f;
        m_reserve.percentage = (m_reserve.remainingLiters / RESERVE_BUFFER_CAPACITY_L) * 100.0f;
        m_reserve.remainingSeconds = (m_flowRateLpm > 0.0f) 
            ? (m_reserve.remainingLiters / m_flowRateLpm) * 60.0f 
            : 0.0f;
    }

    // Buffer recharge logic: If primary or backup is nominal and reserve is not full
    if (m_reserve.isRecharging) {
        float rechargeRateLpm = 2.0f; // Liters per minute charging rate
        float litersRecharged = (rechargeRateLpm / 60.0f) * effectiveDelta;
        m_reserve.remainingLiters += litersRecharged;
        if (m_reserve.remainingLiters >= RESERVE_BUFFER_CAPACITY_L) {
            m_reserve.remainingLiters = RESERVE_BUFFER_CAPACITY_L;
            m_reserve.isRecharging = false;
            logEvent("Reserve Buffer Recharged (100%)", SEV_INFO);
        }
        m_reserve.percentage = (m_reserve.remainingLiters / RESERVE_BUFFER_CAPACITY_L) * 100.0f;
        m_reserve.remainingSeconds = (m_flowRateLpm > 0.0f) 
            ? (m_reserve.remainingLiters / m_flowRateLpm) * 60.0f 
            : 300.0f;
    }
}

void SimulationEngine::evaluateSwitchingLogic() {
    // Automatic Failover evaluation
    if (m_mode == MODE_AUTO) {
        // If on Primary and Primary drops below safety threshold
        if (m_activeSource == SOURCE_PRIMARY && m_primary.percentage <= m_switchThresholdPct) {
            if (m_backup.isConnected && m_backup.percentage > 5.0f) {
                // Auto switch to backup
                m_activeSource = SOURCE_BACKUP;
                m_primary.isActive = false;
                m_backup.isActive = true;
                m_currentSeverity = SEV_WARNING;
                strncpy(m_activeAlertMessage, "Auto-Switched to Backup Supply", sizeof(m_activeAlertMessage) - 1);
                logEvent("CRITICAL FAILOVER: Primary depleted, switched to Backup", SEV_WARNING);
            } else if (m_primary.remainingLiters <= 0.0f) {
                // Primary empty and Backup unavailable -> Engage Reserve Buffer!
                if (m_reserve.remainingLiters > 0.0f) {
                    m_activeSource = SOURCE_RESERVE;
                    m_primary.isActive = false;
                    m_backup.isActive = false;
                    m_reserve.isActive = true;
                    m_currentSeverity = SEV_CRITICAL;
                    strncpy(m_activeAlertMessage, "5-Min Reserve Buffer Engaged!", sizeof(m_activeAlertMessage) - 1);
                    logEvent("EMERGENCY: Dual supplies exhausted, Reserve Buffer active!", SEV_CRITICAL);
                } else {
                    m_activeSource = SOURCE_NONE;
                    m_primary.isActive = false;
                    m_backup.isActive = false;
                    m_reserve.isActive = false;
                    m_currentSeverity = SEV_CRITICAL;
                    strncpy(m_activeAlertMessage, "TOTAL SUPPLY EXHAUSTION!", sizeof(m_activeAlertMessage) - 1);
                    logEvent("ASPHYXIA WARNING: All oxygen sources exhausted!", SEV_CRITICAL);
                }
            }
        }
        // If on Backup and Backup is exhausted
        else if (m_activeSource == SOURCE_BACKUP && m_backup.remainingLiters <= 0.0f) {
            if (m_reserve.remainingLiters > 0.0f) {
                m_activeSource = SOURCE_RESERVE;
                m_backup.isActive = false;
                m_reserve.isActive = true;
                m_currentSeverity = SEV_CRITICAL;
                strncpy(m_activeAlertMessage, "5-Min Reserve Buffer Engaged!", sizeof(m_activeAlertMessage) - 1);
                logEvent("EMERGENCY: Backup exhausted, Reserve Buffer engaged", SEV_CRITICAL);
            } else {
                m_activeSource = SOURCE_NONE;
                m_backup.isActive = false;
                m_currentSeverity = SEV_CRITICAL;
                strncpy(m_activeAlertMessage, "TOTAL SUPPLY EXHAUSTION!", sizeof(m_activeAlertMessage) - 1);
                logEvent("FATAL: All oxygen sources completely exhausted", SEV_CRITICAL);
            }
        }
        // If on Reserve Buffer and Reserve Buffer is exhausted
        else if (m_activeSource == SOURCE_RESERVE && m_reserve.remainingLiters <= 0.0f) {
            m_activeSource = SOURCE_NONE;
            m_reserve.isActive = false;
            m_currentSeverity = SEV_CRITICAL;
            strncpy(m_activeAlertMessage, "RESERVE BUFFER DEPLETED!", sizeof(m_activeAlertMessage) - 1);
            logEvent("FATAL: Reserve buffer exhausted, immediate intervention required!", SEV_CRITICAL);
        }
    }
}

void SimulationEngine::updateVitalsSimulation(float deltaSeconds) {
    // If oxygen is flowing nominally
    if (m_activeSource == SOURCE_PRIMARY || m_activeSource == SOURCE_BACKUP) {
        // Natural physiological drift around 98% SpO2 and 72-76 BPM
        float noise = ((rand() % 100) - 50) / 500.0f;
        m_vitals.spo2 = 98.2f + noise;
        if (m_vitals.spo2 > 99.8f) m_vitals.spo2 = 99.8f;
        if (m_vitals.spo2 < 97.0f) m_vitals.spo2 = 97.0f;
        
        m_vitals.pulseRate = 74 + (rand() % 5 - 2);
        m_vitals.respirationRate = 16 + (rand() % 3 - 1);
        m_vitals.perfusionIndex = 4.5f + noise;
    }
    // If on Reserve Buffer: Elevated anxiety/stress simulation
    else if (m_activeSource == SOURCE_RESERVE) {
        m_vitals.pulseRate = 95 + (rand() % 7 - 3); // Tachycardia
        m_vitals.respirationRate = 22 + (rand() % 3 - 1); // Tachypnea
        m_vitals.spo2 = 94.5f - ((100.0f - m_reserve.percentage) * 0.05f);
        if (m_vitals.spo2 < 89.0f) m_vitals.spo2 = 89.0f;
    }
    // If supply is NONE (Oxygen cut off): Rapid hypoxemia simulation
    else if (m_activeSource == SOURCE_NONE) {
        m_vitals.spo2 -= (0.8f * m_simSpeed * deltaSeconds);
        if (m_vitals.spo2 < 70.0f) m_vitals.spo2 = 70.0f;

        m_vitals.pulseRate += (int)(1.2f * m_simSpeed * deltaSeconds);
        if (m_vitals.pulseRate > 145) m_vitals.pulseRate = 145;

        m_vitals.respirationRate = 28 + (rand() % 4);
        m_vitals.perfusionIndex = 1.2f;
    }
}

void SimulationEngine::updateHardwareOutputs() {
    // Physical Relay Pins: Active HIGH
    #if defined(PIN_SOLENOID_PRIMARY) && (PIN_SOLENOID_PRIMARY >= 0)
    digitalWrite(PIN_SOLENOID_PRIMARY, (m_activeSource == SOURCE_PRIMARY) ? HIGH : LOW);
    #endif

    #if defined(PIN_SOLENOID_BACKUP) && (PIN_SOLENOID_BACKUP >= 0)
    digitalWrite(PIN_SOLENOID_BACKUP, (m_activeSource == SOURCE_BACKUP) ? HIGH : LOW);
    #endif

    #if defined(PIN_SOLENOID_RESERVE) && (PIN_SOLENOID_RESERVE >= 0)
    digitalWrite(PIN_SOLENOID_RESERVE, (m_activeSource == SOURCE_RESERVE) ? HIGH : LOW);
    #endif

    // Alarm Buzzer
    #if defined(PIN_ALARM_BUZZER) && (PIN_ALARM_BUZZER >= 0)
    if (m_currentSeverity == SEV_CRITICAL) {
        // Pulsing buzzer
        digitalWrite(PIN_ALARM_BUZZER, (millis() % 500 < 250) ? HIGH : LOW);
    } else if (m_currentSeverity == SEV_WARNING) {
        digitalWrite(PIN_ALARM_BUZZER, (millis() % 2000 < 150) ? HIGH : LOW);
    } else {
        digitalWrite(PIN_ALARM_BUZZER, LOW);
    }
    #endif
}

float SimulationEngine::getEstimatedRemainingMinutes() const {
    if (m_flowRateLpm <= 0.0f) return 9999.0f;

    float activeLiters = 0.0f;
    if (m_activeSource == SOURCE_PRIMARY) {
        activeLiters = m_primary.remainingLiters;
        if (m_backup.isConnected) activeLiters += m_backup.remainingLiters;
    } else if (m_activeSource == SOURCE_BACKUP) {
        activeLiters = m_backup.remainingLiters;
    } else if (m_activeSource == SOURCE_RESERVE) {
        activeLiters = m_reserve.remainingLiters;
    }

    return activeLiters / m_flowRateLpm;
}

void SimulationEngine::setFlowRate(float lpm) {
    if (lpm < 0.5f) lpm = 0.5f;
    if (lpm > 15.0f) lpm = 15.0f;
    m_flowRateLpm = lpm;
    char buf[48];
    snprintf(buf, sizeof(buf), "Flow rate updated to %.1f L/min", lpm);
    logEvent(buf, SEV_INFO);
}

void SimulationEngine::setSimulationSpeed(float speed) {
    if (speed < 0.1f) speed = 0.1f;
    if (speed > 50.0f) speed = 50.0f;
    m_simSpeed = speed;
}

void SimulationEngine::setSwitchingThreshold(float thresholdPct) {
    if (thresholdPct < 5.0f) thresholdPct = 5.0f;
    if (thresholdPct > 50.0f) thresholdPct = 50.0f;
    m_switchThresholdPct = thresholdPct;
}

void SimulationEngine::manualSwitchSupply(SupplySource target) {
    m_mode = (target == SOURCE_PRIMARY) ? MODE_MANUAL_PRIMARY : MODE_MANUAL_BACKUP;
    m_activeSource = target;
    m_primary.isActive = (target == SOURCE_PRIMARY);
    m_backup.isActive = (target == SOURCE_BACKUP);
    m_reserve.isActive = (target == SOURCE_RESERVE);

    const char* targetName = (target == SOURCE_PRIMARY) ? "Primary" : 
                            (target == SOURCE_BACKUP) ? "Backup" : "Reserve";
    char buf[48];
    snprintf(buf, sizeof(buf), "Manual switch to %s Cylinder", targetName);
    logEvent(buf, SEV_INFO);
}

void SimulationEngine::refillCylinder(SupplySource target) {
    if (target == SOURCE_PRIMARY || target == SOURCE_NONE) {
        m_primary.remainingLiters = CYLINDER_MAX_CAPACITY_L;
        m_primary.pressureBar = CYLINDER_MAX_PRESSURE_BAR;
        m_primary.percentage = 100.0f;
        m_primary.isConnected = true;
        logEvent("Primary Cylinder Refilled (150 Bar)", SEV_INFO);
    }
    if (target == SOURCE_BACKUP || target == SOURCE_NONE) {
        m_backup.remainingLiters = CYLINDER_MAX_CAPACITY_L;
        m_backup.pressureBar = CYLINDER_MAX_PRESSURE_BAR;
        m_backup.percentage = 100.0f;
        m_backup.isConnected = true;
        logEvent("Backup Cylinder Refilled (150 Bar)", SEV_INFO);
    }
    if (target == SOURCE_RESERVE || target == SOURCE_NONE) {
        m_reserve.remainingLiters = RESERVE_BUFFER_CAPACITY_L;
        m_reserve.percentage = 100.0f;
        m_reserve.remainingSeconds = 300.0f;
        m_reserve.isRecharging = false;
        logEvent("Reserve Buffer Reset to 100%", SEV_INFO);
    }

    // Restore to normal if in alert
    if (m_activeSource == SOURCE_NONE || m_activeSource == SOURCE_RESERVE) {
        m_activeSource = SOURCE_PRIMARY;
        m_primary.isActive = true;
        m_backup.isActive = false;
        m_reserve.isActive = false;
        m_currentSeverity = SEV_NORMAL;
        strncpy(m_activeAlertMessage, "System Nominal (Refilled)", sizeof(m_activeAlertMessage) - 1);
    }
}

void SimulationEngine::applyScenario(int scenarioId) {
    m_activeScenarioId = scenarioId;

    switch (scenarioId) {
        case 1: // Normal Operation
            resetToDefault();
            strncpy(m_scenarioExplanation, "Normal Operation: Primary nominal (100%), Backup standby (100%).", sizeof(m_scenarioExplanation) - 1);
            logEvent("SCENARIO 1: Normal Operation restored", SEV_INFO);
            break;

        case 2: // Primary Cylinder Becoming Empty
            m_mode = MODE_AUTO;
            m_activeSource = SOURCE_PRIMARY;
            m_primary.isActive = true;
            m_backup.isActive = false;
            m_reserve.isActive = false;
            m_primary.percentage = 18.0f; // Just above auto-switch threshold
            m_primary.remainingLiters = CYLINDER_MAX_CAPACITY_L * 0.18f;
            m_primary.pressureBar = m_primary.remainingLiters / CYLINDER_WATER_VOL_L;
            m_backup.percentage = 100.0f;
            m_backup.remainingLiters = CYLINDER_MAX_CAPACITY_L;
            m_currentSeverity = SEV_WARNING;
            strncpy(m_activeAlertMessage, "Primary Oxygen Supply Low (<20%)", sizeof(m_activeAlertMessage) - 1);
            strncpy(m_scenarioExplanation, "Primary Low: Cylinder near 15% threshold; auto-switch primed.", sizeof(m_scenarioExplanation) - 1);
            logEvent("SCENARIO 2: Primary Low triggered", SEV_WARNING);
            break;

        case 3: // Automatic Backup Switching
            m_mode = MODE_AUTO;
            m_primary.percentage = 12.0f; // Below threshold
            m_primary.remainingLiters = CYLINDER_MAX_CAPACITY_L * 0.12f;
            m_primary.pressureBar = m_primary.remainingLiters / CYLINDER_WATER_VOL_L;
            m_primary.isActive = false;
            m_activeSource = SOURCE_BACKUP;
            m_backup.isActive = true;
            m_reserve.isActive = false;
            m_currentSeverity = SEV_WARNING;
            strncpy(m_activeAlertMessage, "Automatic Failover: Backup Engaged", sizeof(m_activeAlertMessage) - 1);
            strncpy(m_scenarioExplanation, "Auto-Switch: Primary crossed threshold, solenoid switched to Backup.", sizeof(m_scenarioExplanation) - 1);
            logEvent("SCENARIO 3: Automatic Failover to Backup active", SEV_WARNING);
            break;

        case 4: // Low SpO2 Hypoxemia Alert
            m_vitals.spo2 = 86.5f;
            m_vitals.pulseRate = 112;
            m_currentSeverity = SEV_CRITICAL;
            strncpy(m_activeAlertMessage, "CRITICAL: Patient Hypoxemia (SpO2 < 88%)", sizeof(m_activeAlertMessage) - 1);
            strncpy(m_scenarioExplanation, "Hypoxemia Event: SpO2 dropped below 88%; flow rate increase suggested.", sizeof(m_scenarioExplanation) - 1);
            logEvent("SCENARIO 4: Critical Hypoxemia alert active", SEV_CRITICAL);
            break;

        case 5: // Backup Cylinder Becoming Empty
            m_mode = MODE_AUTO;
            m_activeSource = SOURCE_BACKUP;
            m_primary.percentage = 0.0f;
            m_primary.remainingLiters = 0.0f;
            m_primary.pressureBar = 0.0f;
            m_primary.isActive = false;
            m_backup.percentage = 14.0f;
            m_backup.remainingLiters = CYLINDER_MAX_CAPACITY_L * 0.14f;
            m_backup.pressureBar = m_backup.remainingLiters / CYLINDER_WATER_VOL_L;
            m_backup.isActive = true;
            m_currentSeverity = SEV_WARNING;
            strncpy(m_activeAlertMessage, "Backup Depleting: Reserve Buffer Primed", sizeof(m_activeAlertMessage) - 1);
            strncpy(m_scenarioExplanation, "Backup Low: Primary already empty; 5-min buffer will trigger next.", sizeof(m_scenarioExplanation) - 1);
            logEvent("SCENARIO 5: Backup Depleting triggered", SEV_WARNING);
            break;

        case 6: // Dual Supply Failure (Both Exhausted)
            m_mode = MODE_AUTO;
            m_primary.percentage = 0.0f;
            m_primary.remainingLiters = 0.0f;
            m_primary.pressureBar = 0.0f;
            m_primary.isActive = false;
            m_backup.percentage = 0.0f;
            m_backup.remainingLiters = 0.0f;
            m_backup.pressureBar = 0.0f;
            m_backup.isActive = false;
            m_activeSource = SOURCE_RESERVE;
            m_reserve.isActive = true;
            m_currentSeverity = SEV_CRITICAL;
            strncpy(m_activeAlertMessage, "DUAL EXHAUSTION: Reserve Buffer Engaged!", sizeof(m_activeAlertMessage) - 1);
            strncpy(m_scenarioExplanation, "Dual Exhaustion: Primary & Backup zeroed; 5-min buffer bridge active.", sizeof(m_scenarioExplanation) - 1);
            logEvent("SCENARIO 6: Dual supply failure, buffer running", SEV_CRITICAL);
            break;

        case 7: // 5-Minute Reserve Buffer Countdown
            m_mode = MODE_EMERGENCY_BUFFER;
            m_primary.percentage = 0.0f;
            m_primary.remainingLiters = 0.0f;
            m_backup.percentage = 0.0f;
            m_backup.remainingLiters = 0.0f;
            m_activeSource = SOURCE_RESERVE;
            m_reserve.isActive = true;
            m_reserve.remainingLiters = 15.0f; // ~3 minutes remaining
            m_reserve.percentage = (15.0f / RESERVE_BUFFER_CAPACITY_L) * 100.0f;
            m_reserve.remainingSeconds = (15.0f / m_flowRateLpm) * 60.0f;
            m_currentSeverity = SEV_CRITICAL;
            strncpy(m_activeAlertMessage, "EMERGENCY: Reserve Buffer in Countdown", sizeof(m_activeAlertMessage) - 1);
            strncpy(m_scenarioExplanation, "Buffer Countdown: Demonstrating temporary 5-minute safety bridge.", sizeof(m_scenarioExplanation) - 1);
            logEvent("SCENARIO 7: 5-Minute Buffer Countdown engaged", SEV_CRITICAL);
            break;

        case 8: // Supply Restored & Buffer Refill
            m_mode = MODE_AUTO;
            m_primary.percentage = 100.0f;
            m_primary.remainingLiters = CYLINDER_MAX_CAPACITY_L;
            m_primary.pressureBar = CYLINDER_MAX_PRESSURE_BAR;
            m_primary.isConnected = true;
            m_primary.isActive = true;
            m_activeSource = SOURCE_PRIMARY;
            m_backup.isActive = false;
            m_reserve.isActive = false;
            m_reserve.isRecharging = true; // Buffer recharging!
            m_currentSeverity = SEV_NORMAL;
            strncpy(m_activeAlertMessage, "Supply Restored: Reserve Recharging", sizeof(m_activeAlertMessage) - 1);
            strncpy(m_scenarioExplanation, "Supply Restored: Fresh cylinder online; reserve buffer recharging.", sizeof(m_scenarioExplanation) - 1);
            logEvent("SCENARIO 8: Supply restored, buffer recharge active", SEV_INFO);
            break;

        default:
            break;
    }

    updateHardwareOutputs();
}

void SimulationEngine::logEvent(const char* msg, AlertSeverity sev) {
    int idx = m_eventHead % MAX_EVENTS;
    m_events[idx].timestampMs = millis();
    strncpy(m_events[idx].message, msg, sizeof(m_events[idx].message) - 1);
    m_events[idx].message[sizeof(m_events[idx].message) - 1] = '\0';
    m_events[idx].severity = sev;
    m_eventHead++;
    if (m_eventCount < MAX_EVENTS) m_eventCount++;
}

void SimulationEngine::serializeTelemetry(JsonObject& root) {
    root["timestamp"] = millis();
    root["operatingMode"] = (m_mode == MODE_AUTO) ? "AUTO" : 
                            (m_mode == MODE_MANUAL_PRIMARY) ? "MANUAL_PRIMARY" : 
                            (m_mode == MODE_MANUAL_BACKUP) ? "MANUAL_BACKUP" : "EMERGENCY_BUFFER";
    root["activeSource"] = (m_activeSource == SOURCE_PRIMARY) ? "PRIMARY" :
                           (m_activeSource == SOURCE_BACKUP) ? "BACKUP" :
                           (m_activeSource == SOURCE_RESERVE) ? "RESERVE" : "NONE";
    root["flowRateLpm"] = m_flowRateLpm;
    root["simSpeed"] = m_simSpeed;
    root["switchThresholdPct"] = m_switchThresholdPct;
    root["estRemainingMinutes"] = getEstimatedRemainingMinutes();
    root["alertSeverity"] = (m_currentSeverity == SEV_NORMAL) ? "NORMAL" :
                            (m_currentSeverity == SEV_INFO) ? "INFO" :
                            (m_currentSeverity == SEV_WARNING) ? "WARNING" : "CRITICAL";
    root["activeAlertMessage"] = m_activeAlertMessage;
    root["activeScenarioId"] = m_activeScenarioId;
    root["scenarioExplanation"] = m_scenarioExplanation;

    // Primary
    JsonObject pObj = root.createNestedObject("primary");
    pObj["pressureBar"] = m_primary.pressureBar;
    pObj["remainingLiters"] = m_primary.remainingLiters;
    pObj["percentage"] = m_primary.percentage;
    pObj["isConnected"] = m_primary.isConnected;
    pObj["isActive"] = m_primary.isActive;

    // Backup
    JsonObject bObj = root.createNestedObject("backup");
    bObj["pressureBar"] = m_backup.pressureBar;
    bObj["remainingLiters"] = m_backup.remainingLiters;
    bObj["percentage"] = m_backup.percentage;
    bObj["isConnected"] = m_backup.isConnected;
    bObj["isActive"] = m_backup.isActive;

    // Reserve Buffer
    JsonObject rObj = root.createNestedObject("reserve");
    rObj["remainingLiters"] = m_reserve.remainingLiters;
    rObj["percentage"] = m_reserve.percentage;
    rObj["remainingSeconds"] = m_reserve.remainingSeconds;
    rObj["isActive"] = m_reserve.isActive;
    rObj["isRecharging"] = m_reserve.isRecharging;

    // Vitals
    JsonObject vObj = root.createNestedObject("vitals");
    vObj["spo2"] = m_vitals.spo2;
    vObj["pulseRate"] = m_vitals.pulseRate;
    vObj["respirationRate"] = m_vitals.respirationRate;
    vObj["perfusionIndex"] = m_vitals.perfusionIndex;
}

void SimulationEngine::serializeVitals(JsonObject& root) {
    root["spo2"] = m_vitals.spo2;
    root["pulseRate"] = m_vitals.pulseRate;
    root["respirationRate"] = m_vitals.respirationRate;
    root["perfusionIndex"] = m_vitals.perfusionIndex;
    root["activeSource"] = (m_activeSource == SOURCE_PRIMARY) ? "PRIMARY" :
                           (m_activeSource == SOURCE_BACKUP) ? "BACKUP" :
                           (m_activeSource == SOURCE_RESERVE) ? "RESERVE" : "NONE";
}

void SimulationEngine::serializePrediction(JsonObject& root) {
    float estMinutes = getEstimatedRemainingMinutes();
    root["estRemainingMinutes"] = estMinutes;
    root["estRemainingHours"] = estMinutes / 60.0f;
    root["flowRateLpm"] = m_flowRateLpm;
    root["totalAvailableLiters"] = ((m_activeSource == SOURCE_PRIMARY) ? m_primary.remainingLiters : 0.0f) +
                                   m_backup.remainingLiters + m_reserve.remainingLiters;
    root["formula"] = "T_remain = (Pressure * Water_Volume) / Flow_Rate";
    root["cylinderWaterVolL"] = CYLINDER_WATER_VOL_L;
}

void SimulationEngine::serializeAlerts(JsonObject& root) {
    root["currentSeverity"] = (m_currentSeverity == SEV_NORMAL) ? "NORMAL" :
                              (m_currentSeverity == SEV_INFO) ? "INFO" :
                              (m_currentSeverity == SEV_WARNING) ? "WARNING" : "CRITICAL";
    root["activeMessage"] = m_activeAlertMessage;
    
    JsonArray arr = root.createNestedArray("recentEvents");
    int count = m_eventCount;
    for (int i = 0; i < count; i++) {
        int idx = (m_eventHead - 1 - i + MAX_EVENTS) % MAX_EVENTS;
        JsonObject item = arr.createNestedObject();
        item["timestampMs"] = m_events[idx].timestampMs;
        item["message"] = m_events[idx].message;
        item["severity"] = (m_events[idx].severity == SEV_NORMAL) ? "NORMAL" :
                           (m_events[idx].severity == SEV_INFO) ? "INFO" :
                           (m_events[idx].severity == SEV_WARNING) ? "WARNING" : "CRITICAL";
    }
}
