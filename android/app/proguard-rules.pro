# Keep OXYSYNC telemetry DTO models for Moshi reflection
-keep class com.oxysync.connected.data.model.** { *; }
-keepclassmembers class com.oxysync.connected.data.model.** { *; }

# Retrofit & OkHttp
-dontwarn okhttp3.**
-dontwarn okio.**
-dontwarn retrofit2.**
