package com.oxysync.connected.ui

import android.app.Application
import android.content.Context
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.oxysync.connected.data.model.ConnectionState
import com.oxysync.connected.data.model.EventLogItem
import com.oxysync.connected.data.model.TelemetryPacket
import com.oxysync.connected.data.repository.OxySyncRepository
import com.oxysync.connected.notification.OxySyncNotificationManager
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

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

    private companion object {
        const val PREFS_NAME = "oxysync_prefs"
        const val KEY_HOST = "esp32_host"
        const val DEFAULT_HOST = "192.168.4.1"
    }

    private val prefs = application.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    private val repository = OxySyncRepository(viewModelScope)
    private val notificationManager = OxySyncNotificationManager(application)

    private val initialHost = prefs.getString(KEY_HOST, DEFAULT_HOST) ?: DEFAULT_HOST
    private val _uiState = MutableStateFlow(MainUiState(hostAddress = initialHost))
    val uiState: StateFlow<MainUiState> = _uiState.asStateFlow()

    private var lastObservedSource: String = "PRIMARY"
    private var lastObservedScenarioId: Int = 1
    private var wasHypoxemic: Boolean = false

    init {
        viewModelScope.launch {
            repository.connectionState.collect { state ->
                _uiState.update { it.copy(connectionState = state) }
            }
        }

        viewModelScope.launch {
            repository.telemetryFlow.collect { packet ->
                handleTelemetryUpdates(packet)
            }
        }

        connectToHost(initialHost)
    }

    fun connectToHost(host: String) {
        val cleanHost = host.trim().ifEmpty { DEFAULT_HOST }
        prefs.edit().putString(KEY_HOST, cleanHost).apply()
        _uiState.update { it.copy(hostAddress = cleanHost) }
        repository.connect(cleanHost)
    }

    fun disconnect() {
        repository.disconnect()
    }

    fun consumeStatusFeedback() {
        _uiState.update { it.copy(statusFeedback = null) }
    }

    private fun handleTelemetryUpdates(packet: TelemetryPacket) {
        // Edge-trigger failover notifications on supply transitions
        if (packet.activeSource != lastObservedSource) {
            when (packet.activeSource) {
                "BACKUP" -> notificationManager.showSwitchEvent(
                    "OXYSYNC Automatic Failover",
                    "Primary cylinder depleted. Solenoid switched seamlessly to Backup supply."
                )
                "RESERVE" -> notificationManager.showCriticalAlert(
                    "EMERGENCY: 5-Minute Reserve Buffer Engaged!",
                    "Dual cylinders exhausted. Conceptual 5-minute safety bridge active. Replace cylinders now!"
                )
                "NONE" -> notificationManager.showCriticalAlert(
                    "CRITICAL: All Oxygen Supplies Exhausted!",
                    "Zero supply across Primary, Backup, and Reserve Buffer. Immediate intervention required!"
                )
            }
            lastObservedSource = packet.activeSource
        }

        // Edge-trigger patient hypoxemia alert so 2 Hz telemetry does not spam notifications
        val isHypoxemic = packet.vitals.spo2 < 89.0f
        if (isHypoxemic && !wasHypoxemic) {
            notificationManager.showCriticalAlert(
                "CRITICAL: Low SpO2 Detected (${String.format(Locale.US, "%.1f", packet.vitals.spo2)}%)",
                "Patient oxygen saturation critically depressed. Immediate clinical review required."
            )
        }
        wasHypoxemic = isHypoxemic

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
            _uiState.update {
                it.copy(
                    statusFeedback = if (res.isSuccess) {
                        "Switched line to $target"
                    } else {
                        "Failed to switch line: ${res.exceptionOrNull()?.message ?: "Offline"}"
                    }
                )
            }
        }
    }

    fun setFlowRate(rate: Float) {
        viewModelScope.launch {
            val res = repository.setFlowRate(rate)
            _uiState.update {
                it.copy(
                    statusFeedback = if (res.isSuccess) {
                        "Flow rate set to ${String.format(Locale.US, "%.1f", rate)} L/min"
                    } else {
                        "Failed to update flow rate"
                    }
                )
            }
        }
    }

    fun refillCylinders(cylinder: String = "ALL") {
        viewModelScope.launch {
            val res = repository.refillCylinder(cylinder)
            _uiState.update {
                it.copy(
                    statusFeedback = if (res.isSuccess) {
                        "Cylinders replenished (150 Bar)"
                    } else {
                        "Refill command failed"
                    }
                )
            }
        }
    }

    fun applyScenario(scenarioId: Int) {
        viewModelScope.launch {
            val res = repository.applyScenario(scenarioId)
            _uiState.update {
                it.copy(
                    statusFeedback = if (res.isSuccess) {
                        "Applied Scenario #$scenarioId"
                    } else {
                        "Failed to trigger Scenario #$scenarioId"
                    }
                )
            }
        }
    }

    fun resetSimulation() {
        viewModelScope.launch {
            val res = repository.resetSimulation()
            _uiState.update {
                it.copy(
                    statusFeedback = if (res.isSuccess) {
                        "Simulation reset to nominal baseline"
                    } else {
                        "Reset command failed"
                    }
                )
            }
        }
    }

    fun generateCsvReport(): String {
        val sb = StringBuilder()
        sb.append("OXYSYNC 2.0 DEMONSTRATION AUDIT REPORT\n")
        sb.append("Export Timestamp,${SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.US).format(Date())}\n")
        sb.append("Operating Mode,${_uiState.value.telemetry.operatingMode}\n")
        sb.append("Active Source,${_uiState.value.telemetry.activeSource}\n")
        sb.append("Flow Rate (L/min),${_uiState.value.telemetry.flowRateLpm}\n")
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
            sb.append("$timeStr,${ev.severity},\"${ev.message.replace("\"", "\"\"")}\"\n")
        }
        return sb.toString()
    }
}
