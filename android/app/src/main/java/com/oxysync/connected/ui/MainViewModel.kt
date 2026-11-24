package com.oxysync.connected.ui

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.oxysync.connected.data.model.*
import com.oxysync.connected.data.repository.OxySyncRepository
import com.oxysync.connected.notification.OxySyncNotificationManager
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

data class MainUiState(
    val connectionState: ConnectionState = ConnectionState.DISCONNECTED,
    val hostAddress: String = "192.168.4.1",
    val telemetry: TelemetryPacket = TelemetryPacket(),
    val eventHistory: List<EventLogItem> = emptyList(),
    val isAutoSwitchEnabled: Boolean = true,
    val isExporting: Boolean = false,
    val statusFeedback: String? = null
)

class MainViewModel(application: Application) : AndroidViewModel(application) {

    private val repository = OxySyncRepository(viewModelScope)
    private val notificationManager = OxySyncNotificationManager(application)

    private val _uiState = MutableStateFlow(MainUiState())
    val uiState: StateFlow<MainUiState> = _uiState.asStateFlow()

    private var lastObservedSource: String = "PRIMARY"
    private var lastObservedScenarioId: Int = 1

    init {
        // Collect connection status
        viewModelScope.launch {
            repository.connectionState.collect { state ->
                _uiState.update { it.copy(connectionState = state) }
            }
        }

        // Collect incoming telemetry from ESP32
        viewModelScope.launch {
            repository.telemetryFlow.collect { packet ->
                handleTelemetryUpdates(packet)
            }
        }

        // Auto-connect to default ESP32 AP address on launch
        connectToHost("192.168.4.1")
    }

    fun connectToHost(host: String) {
        _uiState.update { it.copy(hostAddress = host) }
        repository.connect(host)
    }

    fun disconnect() {
        repository.disconnect()
    }

    private fun handleTelemetryUpdates(packet: TelemetryPacket) {
        // Check for failover events to trigger system notifications
        if (packet.activeSource != lastObservedSource) {
            if (packet.activeSource == "BACKUP") {
                notificationManager.showSwitchEvent(
                    "OXYSYNC Automatic Failover",
                    "Primary cylinder depleted (<15%). Solenoid switched seamlessly to Backup supply."
                )
            } else if (packet.activeSource == "RESERVE") {
                notificationManager.showCriticalAlert(
                    "EMERGENCY: 5-Minute Reserve Buffer Engaged!",
                    "Dual cylinders exhausted. Conceptual 5-minute safety bridge active. Replace cylinders now!"
                )
            }
            lastObservedSource = packet.activeSource
        }

        // Check for patient hypoxemia alert
        if (packet.vitals.spo2 < 89.0f) {
            notificationManager.showCriticalAlert(
                "CRITICAL: Low SpO2 Detected (${packet.vitals.spo2}%)",
                "Patient oxygen saturation critically depressed. Immediate clinical review required."
            )
        }

        // Append to local event history if scenario changed
        val updatedEvents = _uiState.value.eventHistory.toMutableList()
        if (packet.activeScenarioId != lastObservedScenarioId) {
            lastObservedScenarioId = packet.activeScenarioId
            updatedEvents.add(
                0,
                EventLogItem(
                    timestampMs = System.currentTimeMillis(),
                    message = "Scenario #${packet.activeScenarioId}: ${packet.scenarioExplanation}",
                    severity = packet.alertSeverity
                )
            )
        }

        _uiState.update {
            it.copy(
                telemetry = packet,
                eventHistory = updatedEvents.take(20)
            )
        }
    }

    fun switchSupply(target: String) {
        viewModelScope.launch {
            val res = repository.switchSupply(target)
            if (res.isSuccess) {
                _uiState.update { it.copy(statusFeedback = "Switched line to $target") }
            }
        }
    }

    fun setFlowRate(rate: Float) {
        viewModelScope.launch {
            val res = repository.setFlowRate(rate)
            if (res.isSuccess) {
                _uiState.update { it.copy(statusFeedback = "Flow rate set to ${rate} L/min") }
            }
        }
    }

    fun refillCylinders(cylinder: String = "ALL") {
        viewModelScope.launch {
            val res = repository.refillCylinder(cylinder)
            if (res.isSuccess) {
                _uiState.update { it.copy(statusFeedback = "Cylinders replenished (150 Bar)") }
            }
        }
    }

    fun applyScenario(scenarioId: Int) {
        viewModelScope.launch {
            val res = repository.applyScenario(scenarioId)
            if (res.isSuccess) {
                _uiState.update { it.copy(statusFeedback = "Applied Scenario #$scenarioId") }
            }
        }
    }

    fun resetSimulation() {
        viewModelScope.launch {
            val res = repository.resetSimulation()
            if (res.isSuccess) {
                _uiState.update { it.copy(statusFeedback = "Simulation reset to nominal baseline") }
            }
        }
    }

    fun generateCsvReport(): String {
        val sb = StringBuilder()
        sb.append("OXYSYNC 2.0 DEMONSTRATION AUDIT REPORT\n")
        sb.append("Export Timestamp,${SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.US).format(Date())}\n")
        sb.append("Operating Mode,${_uiState.value.telemetry.operatingMode}\n")
        sb.append("Active Source,${_uiState.value.telemetry.activeSource}\n")
        sb.append("Primary Cylinder P (Bar),${_uiState.value.telemetry.primary.pressureBar}\n")
        sb.append("Primary Cylinder (%),${_uiState.value.telemetry.primary.percentage}\n")
        sb.append("Backup Cylinder P (Bar),${_uiState.value.telemetry.backup.pressureBar}\n")
        sb.append("Backup Cylinder (%),${_uiState.value.telemetry.backup.percentage}\n")
        sb.append("5-Min Reserve Buffer (s),${_uiState.value.telemetry.reserve.remainingSeconds}\n")
        sb.append("Estimated Remaining Minutes,${_uiState.value.telemetry.estRemainingMinutes}\n")
        sb.append("Patient SpO2 (%),${_uiState.value.telemetry.vitals.spo2}\n")
        sb.append("Patient Pulse (BPM),${_uiState.value.telemetry.vitals.pulseRate}\n\n")

        sb.append("EVENT AUDIT TRAIL\n")
        sb.append("Timestamp,Severity,Message\n")
        _uiState.value.eventHistory.forEach { ev ->
            val timeStr = SimpleDateFormat("HH:mm:ss", Locale.US).format(Date(ev.timestampMs))
            sb.append("$timeStr,${ev.severity},\"${ev.message}\"\n")
        }
        return sb.toString()
    }
}
