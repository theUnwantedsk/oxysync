package com.oxysync.connected.data.repository

import android.util.Log
import com.oxysync.connected.data.api.Esp32ApiService
import com.oxysync.connected.data.model.*
import com.oxysync.connected.data.websocket.Esp32WebSocketManager
import com.squareup.moshi.Moshi
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
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

    val connectionState: StateFlow<ConnectionState> = wsManager.connectionState
    val telemetryFlow: SharedFlow<TelemetryPacket> = wsManager.telemetryFlow

    init {
        // Monitor connection: if WebSocket is not CONNECTED, run light HTTP polling fallback
        scope.launch {
            wsManager.connectionState.collect { state ->
                if (state != ConnectionState.CONNECTED) {
                    startFallbackPolling()
                } else {
                    stopFallbackPolling()
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
    }

    fun getActiveHost(): String = currentHost

    suspend fun switchSupply(target: String): Result<TelemetryPacket> = withContext(Dispatchers.IO) {
        try {
            wsManager.sendCommand("switch", mapOf("target" to target))
            val res = apiService.switchSupply(SwitchRequest(target))
            if (res.isSuccessful && res.body() != null) {
                Result.success(res.body()!!)
            } else {
                Result.failure(Exception("HTTP error: ${res.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun setFlowRate(rate: Float): Result<TelemetryPacket> = withContext(Dispatchers.IO) {
        try {
            wsManager.sendCommand("flow", mapOf("rate" to rate))
            val res = apiService.setFlowRate(FlowRequest(rate))
            if (res.isSuccessful && res.body() != null) {
                Result.success(res.body()!!)
            } else {
                Result.failure(Exception("HTTP error: ${res.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun refillCylinder(cylinder: String = "ALL"): Result<TelemetryPacket> = withContext(Dispatchers.IO) {
        try {
            wsManager.sendCommand("refill", mapOf("cylinder" to cylinder))
            val res = apiService.refillCylinder(RefillRequest(cylinder))
            if (res.isSuccessful && res.body() != null) {
                Result.success(res.body()!!)
            } else {
                Result.failure(Exception("HTTP error: ${res.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun applyScenario(scenarioId: Int): Result<TelemetryPacket> = withContext(Dispatchers.IO) {
        try {
            wsManager.sendCommand("scenario", mapOf("id" to scenarioId))
            val res = apiService.applyScenario(ScenarioRequest(scenarioId))
            if (res.isSuccessful && res.body() != null) {
                Result.success(res.body()!!)
            } else {
                Result.failure(Exception("HTTP error: ${res.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun resetSimulation(): Result<TelemetryPacket> = withContext(Dispatchers.IO) {
        try {
            wsManager.sendCommand("reset")
            val res = apiService.resetSimulation()
            if (res.isSuccessful && res.body() != null) {
                Result.success(res.body()!!)
            } else {
                Result.failure(Exception("HTTP error: ${res.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    private fun startFallbackPolling() {
        if (pollingJob?.isActive == true) return
        pollingJob = scope.launch(Dispatchers.IO) {
            while (isActive) {
                try {
                    val res = apiService.getStatus()
                    if (res.isSuccessful && res.body() != null) {
                        // Handled by repository
                    }
                } catch (_: Exception) {}
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
