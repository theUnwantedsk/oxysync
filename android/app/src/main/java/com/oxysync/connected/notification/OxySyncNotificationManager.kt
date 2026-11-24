package com.oxysync.connected.notification

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.oxysync.connected.R
import com.oxysync.connected.ui.MainActivity

class OxySyncNotificationManager(private val context: Context) {

    companion object {
        const val CHANNEL_CRITICAL_ID = "oxysync_critical_channel"
        const val CHANNEL_EVENTS_ID = "oxysync_events_channel"
        const val NOTIF_CRITICAL_ID = 1001
        const val NOTIF_SWITCH_ID = 1002
    }

    private val notificationManager =
        context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

    private var lastCriticalMessage: String = ""
    private var lastCriticalTimestamp: Long = 0

    init {
        createNotificationChannels()
    }

    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            // Channel 1: Critical Alerts (Hypoxemia, Depletion, Emergency Buffer)
            val criticalChannel = NotificationChannel(
                CHANNEL_CRITICAL_ID,
                "OXYSYNC Critical Medical Alerts",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "High-priority alarms for low SpO2, cylinder exhaustion, and buffer failover"
                enableVibration(true)
                vibrationPattern = longArrayOf(0, 500, 200, 500)
            }

            // Channel 2: System Failover & Operational Events
            val eventsChannel = NotificationChannel(
                CHANNEL_EVENTS_ID,
                "OXYSYNC System Failover & Events",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "Automatic cylinder switching and refill notifications"
                enableVibration(true)
            }

            notificationManager.createNotificationChannel(criticalChannel)
            notificationManager.createNotificationChannel(eventsChannel)
        }
    }

    fun showCriticalAlert(title: String, message: String) {
        val now = System.currentTimeMillis()
        // Debounce if same message received within 8 seconds
        if (message == lastCriticalMessage && (now - lastCriticalTimestamp < 8000)) {
            return
        }
        lastCriticalMessage = message
        lastCriticalTimestamp = now

        val intent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val pendingIntent = PendingIntent.getActivity(
            context,
            0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(context, CHANNEL_CRITICAL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_alert)
            .setContentTitle(title)
            .setContentText(message)
            .setStyle(NotificationCompat.BigTextStyle().bigText(message))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .setVibrate(longArrayOf(0, 500, 200, 500))
            .build()

        try {
            NotificationManagerCompat.from(context).notify(NOTIF_CRITICAL_ID, notification)
        } catch (_: SecurityException) {
            // Notification permission might not be granted yet on Android 13+
        }
    }

    fun showSwitchEvent(title: String, message: String) {
        val intent = Intent(context, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            context,
            0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(context, CHANNEL_EVENTS_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle(title)
            .setContentText(message)
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .build()

        try {
            NotificationManagerCompat.from(context).notify(NOTIF_SWITCH_ID, notification)
        } catch (_: SecurityException) {}
    }
}
