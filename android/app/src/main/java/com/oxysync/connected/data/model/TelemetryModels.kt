package com.oxysync.connected.data.model

import com.squareup.moshi.Json

data class TelemetryPacket(
    @Json(name = "timestamp") val timestamp: Long = 0L,
    @Json(name = "operatingMode") val operatingMode: String = "AUTO",
    @Json(name = "activeSource") val activeSource: String = "PRIMARY",
    @Json(name = "flowRateLpm") val flowRateLpm: Float = 5.0f,
    @Json(name = "simSpeed") val simSpeed: Float = 1.0f,
    @Json(name = "switchThresholdPct") val switchThresholdPct: Float = 15.0f,
    @Json(name = "estRemainingMinutes") val estRemainingMinutes: Float = 300.0f,
    @Json(name = "alertSeverity") val alertSeverity: String = "NORMAL",
    @Json(name = "activeAlertMessage") val activeAlertMessage: String = "Nominal",
    @Json(name = "activeScenarioId") val activeScenarioId: Int = 1,
    @Json(name = "scenarioExplanation") val scenarioExplanation: String = "",
    @Json(name = "primary") val primary: CylinderData = CylinderData(),
    @Json(name = "backup") val backup: CylinderData = CylinderData(),
    @Json(name = "reserve") val reserve: ReserveBufferData = ReserveBufferData(),
    @Json(name = "vitals") val vitals: PatientVitalsData = PatientVitalsData()
)

data class CylinderData(
    @Json(name = "pressureBar") val pressureBar: Float = 150.0f,
    @Json(name = "remainingLiters") val remainingLiters: Float = 1500.0f,
    @Json(name = "percentage") val percentage: Float = 100.0f,
    @Json(name = "isConnected") val isConnected: Boolean = true,
    @Json(name = "isActive") val isActive: Boolean = false
)

data class ReserveBufferData(
    @Json(name = "remainingLiters") val remainingLiters: Float = 25.0f,
    @Json(name = "percentage") val percentage: Float = 100.0f,
    @Json(name = "remainingSeconds") val remainingSeconds: Float = 300.0f,
    @Json(name = "isActive") val isActive: Boolean = false,
    @Json(name = "isRecharging") val isRecharging: Boolean = false
)

data class PatientVitalsData(
    @Json(name = "spo2") val spo2: Float = 98.2f,
    @Json(name = "pulseRate") val pulseRate: Int = 74,
    @Json(name = "respirationRate") val respirationRate: Int = 16,
    @Json(name = "perfusionIndex") val perfusionIndex: Float = 4.5f
)

data class PredictionData(
    @Json(name = "estRemainingMinutes") val estRemainingMinutes: Float = 0.0f,
    @Json(name = "estRemainingHours") val estRemainingHours: Float = 0.0f,
    @Json(name = "flowRateLpm") val flowRateLpm: Float = 5.0f,
    @Json(name = "totalAvailableLiters") val totalAvailableLiters: Float = 0.0f,
    @Json(name = "formula") val formula: String = "",
    @Json(name = "cylinderWaterVolL") val cylinderWaterVolL: Float = 10.0f
)

data class EventLogItem(
    @Json(name = "timestampMs") val timestampMs: Long = 0L,
    @Json(name = "message") val message: String = "",
    @Json(name = "severity") val severity: String = "NORMAL"
)

data class AlertsData(
    @Json(name = "currentSeverity") val currentSeverity: String = "NORMAL",
    @Json(name = "activeMessage") val activeMessage: String = "",
    @Json(name = "recentEvents") val recentEvents: List<EventLogItem> = emptyList()
)

// Request DTOs
data class SwitchRequest(
    @Json(name = "target") val target: String
)

data class FlowRequest(
    @Json(name = "rate") val rate: Float
)

data class RefillRequest(
    @Json(name = "cylinder") val cylinder: String = "ALL"
)

data class ScenarioRequest(
    @Json(name = "scenarioId") val scenarioId: Int
)

enum class ConnectionState {
    DISCONNECTED,
    CONNECTING,
    CONNECTED,
    ERROR
}
