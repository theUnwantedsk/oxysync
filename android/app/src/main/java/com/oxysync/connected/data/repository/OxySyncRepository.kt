package com.oxysync.connected.data.repository

import android.util.Log
import com.oxysync.connected.data.api.Esp32ApiService
import com.oxysync.connected.data.model.ConnectionState
import com.oxysync.connected.data.model.FlowRequest
import com.oxysync.connected.data.model.RefillRequest
import com.oxysync.connected.data.model.ScenarioRequest
import com.oxysync.connected.data.model.SwitchRequest
import com.oxysync.connected.data.model.TelemetryPacket
import com.oxysync.connected.data.websocket.Esp32WebSocketManager
import com.squareup.moshi.Moshi
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.channels.BufferOverflow
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Response
import retrofit2.Retrofit
import retrofit2.converter.moshi.MoshiConverterFactory
import java.util.concurrent.TimeUnit

class OxySyncRepository(
    private val scope: CoroutineScope
) {
    private val tag = "OxySyncRepository"
    private var currentHost = "192.168.4.1"
    private val wsManager = Esp32WebSocketManager(scope)

    private var apiService: Esp32ApiService = createApiService(currentHost)
    private var pollingJob: Job? = null

    private val _connectionState = MutableStateFlow(ConnectionState.DISCONNECTED)
    val connectionState: StateFlow<ConnectionState> = _connectionState.asStateFlow()

    private val _telemetryFlow = MutableSharedFlow<TelemetryPacket>(
        replay = 1,
        extraBufferCapacity = 16,
        onBufferOverflow = BufferOverflow.DROP_OLDEST
    )
    val telemetryFlow: SharedFlow<TelemetryPacket> = _telemetryFlow.asSharedFlow()

    init {
        scope.launch {
            wsManager.telemetryFlow.collect { packet ->
                _telemetryFlow.emit(packet)
            }
        }

        // Monitor WebSocket state: run HTTP fallback polling whenever WS is not connected
        scope.launch {
            wsManager.connectionState.collect { wsState ->
                if (wsState == ConnectionState.CONNECTED) {
                    stopFallbackPolling()
                    _connectionState.value = ConnectionState.CONNECTED
                } else {
                    _connectionState.value = wsState
                    startFallbackPolling()
                }
            }
        }
    }

    fun connect(host: String) {
        currentHost = host
        apiService = createApiService(host)
        wsManager.connect(host)
    }

    fun disconnect() {
        stopFallbackPolling()
        wsManager.disconnect()
        _connectionState.value = ConnectionState.DISCONNECTED
    }

    fun getActiveHost(): String = currentHost

    suspend fun switchSupply(target: String): Result<TelemetryPacket> =
        executeControlCommand(
            wsAction = "switch",
            wsParams = mapOf("target" to target)
        ) { apiService.switchSupply(SwitchRequest(target)) }

    suspend fun setFlowRate(rate: Float): Result<TelemetryPacket> =
        executeControlCommand(
            wsAction = "flow",
            wsParams = mapOf("rate" to rate)
        ) { apiService.setFlowRate(FlowRequest(rate)) }

    suspend fun refillCylinder(cylinder: String = "ALL"): Result<TelemetryPacket> =
        executeControlCommand(
            wsAction = "refill",
            wsParams = mapOf("cylinder" to cylinder)
        ) { apiService.refillCylinder(RefillRequest(cylinder)) }

    suspend fun applyScenario(scenarioId: Int): Result<TelemetryPacket> =
        executeControlCommand(
            wsAction = "scenario",
            wsParams = mapOf("id" to scenarioId)
        ) { apiService.applyScenario(ScenarioRequest(scenarioId)) }

    suspend fun resetSimulation(): Result<TelemetryPacket> =
        executeControlCommand(
            wsAction = "reset"
        ) { apiService.resetSimulation() }

    /**
     * Executes control actions over HTTP REST as the single authoritative transport
     * (emitting the returned packet immediately) and only falls back to WebSocket
     * when HTTP fails, preventing duplicate command execution on the ESP32.
     */
    private suspend fun executeControlCommand(
        wsAction: String,
        wsParams: Map<String, Any> = emptyMap(),
        httpCall: suspend () -> Response<TelemetryPacket>
    ): Result<TelemetryPacket> = withContext(Dispatchers.IO) {
        try {
            val res = httpCall()
            val body = res.body()
            if (res.isSuccessful && body != null) {
                _telemetryFlow.tryEmit(body)
                _connectionState.value = ConnectionState.CONNECTED
                Result.success(body)
            } else {
                if (wsManager.sendCommand(wsAction, wsParams)) {
                    Result.success(_telemetryFlow.replayCache.lastOrNull() ?: TelemetryPacket())
                } else {
                    Result.failure(Exception("HTTP error: ${res.code()}"))
                }
            }
        } catch (e: Exception) {
            Log.w(tag, "HTTP control failed for '$wsAction', attempting WS fallback: ${e.message}")
            if (wsManager.sendCommand(wsAction, wsParams)) {
                Result.success(_telemetryFlow.replayCache.lastOrNull() ?: TelemetryPacket())
            } else {
                Result.failure(e)
            }
        }
    }

    private fun startFallbackPolling() {
        if (pollingJob?.isActive == true) return
        pollingJob = scope.launch(Dispatchers.IO) {
            while (isActive) {
                try {
                    val res = apiService.getStatus()
                    val body = res.body()
                    if (res.isSuccessful && body != null) {
                        _telemetryFlow.emit(body)
                        if (wsManager.connectionState.value != ConnectionState.CONNECTED) {
                            _connectionState.value = ConnectionState.CONNECTED
                        }
                    }
                } catch (_: Exception) {
                    if (wsManager.connectionState.value != ConnectionState.CONNECTED) {
                        _connectionState.value = wsManager.connectionState.value
                    }
                }
                delay(2000)
            }
        }
    }

    private fun stopFallbackPolling() {
        pollingJob?.cancel()
        pollingJob = null
    }

    private fun createApiService(host: String): Esp32ApiService {
        val logging = HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BASIC
        }
        val okHttpClient = OkHttpClient.Builder()
            .addInterceptor(logging)
            .connectTimeout(5, TimeUnit.SECONDS)
            .readTimeout(5, TimeUnit.SECONDS)
            .build()

        val moshi = Moshi.Builder()
            .add(KotlinJsonAdapterFactory())
            .build()

        val retrofit = Retrofit.Builder()
            .baseUrl("http://$host:80/")
            .client(okHttpClient)
            .addConverterFactory(MoshiConverterFactory.create(moshi))
            .build()

        return retrofit.create(Esp32ApiService::class.java)
    }
}
