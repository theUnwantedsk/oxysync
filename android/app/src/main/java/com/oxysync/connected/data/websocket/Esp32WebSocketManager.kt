package com.oxysync.connected.data.websocket

import android.util.Log
import com.oxysync.connected.data.model.ConnectionState
import com.oxysync.connected.data.model.TelemetryPacket
import com.squareup.moshi.Moshi
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import okhttp3.*
import java.util.concurrent.TimeUnit

class Esp32WebSocketManager(
    private val scope: CoroutineScope
) {
    private val tag = "Esp32WebSocket"
    private val client: OkHttpClient = OkHttpClient.Builder()
        .connectTimeout(5, TimeUnit.SECONDS)
        .readTimeout(10, TimeUnit.SECONDS)
        .build()

    private val moshi = Moshi.Builder()
        .add(KotlinJsonAdapterFactory())
        .build()
    private val adapter = moshi.adapter(TelemetryPacket::class.java)

    private var webSocket: WebSocket? = null
    private var currentHost: String = "192.168.4.1"
    private var isIntentionalDisconnect = false
    private var reconnectJob: Job? = null

    private val _connectionState = MutableStateFlow(ConnectionState.DISCONNECTED)
    val connectionState: StateFlow<ConnectionState> = _connectionState

    private val _telemetryFlow = MutableSharedFlow<TelemetryPacket>(replay = 1)
    val telemetryFlow: SharedFlow<TelemetryPacket> = _telemetryFlow

    fun connect(host: String) {
        currentHost = host
        isIntentionalDisconnect = false
        reconnectJob?.cancel()

        _connectionState.value = ConnectionState.CONNECTING
        val wsUrl = "ws://$host:81/"
        Log.d(tag, "Connecting to WebSocket at $wsUrl")

        val request = Request.Builder()
            .url(wsUrl)
            .build()

        webSocket?.cancel()
        webSocket = client.newWebSocket(request, object : WebSocketListener() {
            override fun onOpen(webSocket: WebSocket, response: Response) {
                Log.d(tag, "WebSocket connected successfully to $wsUrl")
                _connectionState.value = ConnectionState.CONNECTED
            }

            override fun onMessage(webSocket: WebSocket, text: String) {
                try {
                    val packet = adapter.fromJson(text)
                    if (packet != null) {
                        scope.launch {
                            _telemetryFlow.emit(packet)
                        }
                    }
                } catch (e: Exception) {
                    Log.e(tag, "Error parsing telemetry JSON: ${e.message}")
                }
            }

            override fun onClosing(webSocket: WebSocket, code: Int, reason: String) {
                webSocket.close(1000, null)
                _connectionState.value = ConnectionState.DISCONNECTED
            }

            override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
                Log.w(tag, "WebSocket failure: ${t.message}")
                _connectionState.value = ConnectionState.ERROR
                scheduleReconnect()
            }

            override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
                _connectionState.value = ConnectionState.DISCONNECTED
                if (!isIntentionalDisconnect) {
                    scheduleReconnect()
                }
            }
        })
    }

    fun disconnect() {
        isIntentionalDisconnect = true
        reconnectJob?.cancel()
        webSocket?.close(1000, "User disconnected")
        webSocket = null
        _connectionState.value = ConnectionState.DISCONNECTED
    }

    fun sendCommand(action: String, params: Map<String, Any> = emptyMap()) {
        val payloadMap = mutableMapOf<String, Any>("action" to action)
        payloadMap.putAll(params)
        val json = moshi.adapter(Map::class.java).toJson(payloadMap)
        webSocket?.send(json)
    }

    private fun scheduleReconnect() {
        if (isIntentionalDisconnect) return
        reconnectJob?.cancel()
        reconnectJob = scope.launch {
            delay(3000)
            if (!isIntentionalDisconnect) {
                Log.d(tag, "Attempting auto-reconnect to $currentHost...")
                connect(currentHost)
            }
        }
    }
}
