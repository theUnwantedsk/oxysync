package com.oxysync.connected.data.api

import com.oxysync.connected.data.model.*
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST

interface Esp32ApiService {

    @GET("/api/status")
    suspend fun getStatus(): Response<TelemetryPacket>

    @GET("/api/vitals")
    suspend fun getVitals(): Response<PatientVitalsData>

    @GET("/api/prediction")
    suspend fun getPrediction(): Response<PredictionData>

    @GET("/api/alerts")
    suspend fun getAlerts(): Response<AlertsData>

    @POST("/api/control/switch")
    suspend fun switchSupply(@Body request: SwitchRequest): Response<TelemetryPacket>

    @POST("/api/control/flow")
    suspend fun setFlowRate(@Body request: FlowRequest): Response<TelemetryPacket>

    @POST("/api/control/refill")
    suspend fun refillCylinder(@Body request: RefillRequest): Response<TelemetryPacket>

    @POST("/api/control/scenario")
    suspend fun applyScenario(@Body request: ScenarioRequest): Response<TelemetryPacket>

    @POST("/api/control/reset")
    suspend fun resetSimulation(): Response<TelemetryPacket>
}
