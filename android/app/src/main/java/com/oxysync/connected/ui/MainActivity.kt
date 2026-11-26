package com.oxysync.connected.ui

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.view.View
import android.widget.EditText
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import com.google.android.material.tabs.TabLayout
import com.oxysync.connected.R
import com.oxysync.connected.data.model.ConnectionState
import com.oxysync.connected.databinding.ActivityMainBinding
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private val viewModel: MainViewModel by viewModels()

    private val requestNotificationPermissionLauncher =
        registerForActivityResult(ActivityResultContracts.RequestPermission()) { isGranted ->
            if (!isGranted) {
                Toast.makeText(
                    this,
                    "Notification permission needed for critical failover alerts",
                    Toast.LENGTH_SHORT
                ).show()
            }
        }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        checkNotificationPermissions()
        setupTabs()
        setupListeners()
        observeViewModel()
    }

    private fun checkNotificationPermissions() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(
                    this,
                    Manifest.permission.POST_NOTIFICATIONS
                ) != PackageManager.PERMISSION_GRANTED
            ) {
                requestNotificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
            }
        }
    }

    private fun setupTabs() {
        binding.tabLayout.addOnTabSelectedListener(object : TabLayout.OnTabSelectedListener {
            override fun onTabSelected(tab: TabLayout.Tab?) {
                when (tab?.position) {
                    0 -> showSection(binding.layoutDashboardView)
                    1 -> showSection(binding.layoutLabView)
                    2 -> showSection(binding.layoutAnalyticsView)
                }
            }

            override fun onTabUnselected(tab: TabLayout.Tab?) {}
            override fun onTabReselected(tab: TabLayout.Tab?) {}
        })
    }

    private fun showSection(target: View) {
        binding.layoutDashboardView.visibility =
            if (target == binding.layoutDashboardView) View.VISIBLE else View.GONE
        binding.layoutLabView.visibility =
            if (target == binding.layoutLabView) View.VISIBLE else View.GONE
        binding.layoutAnalyticsView.visibility =
            if (target == binding.layoutAnalyticsView) View.VISIBLE else View.GONE
    }

    private fun setupListeners() {
        binding.btnConnectionSettings.setOnClickListener { showConnectionDialog() }
        binding.btnSwitchPrimary.setOnClickListener { viewModel.switchSupply("PRIMARY") }
        binding.btnSwitchBackup.setOnClickListener { viewModel.switchSupply("BACKUP") }

        binding.btnFlow2.setOnClickListener { viewModel.setFlowRate(2.5f) }
        binding.btnFlow5.setOnClickListener { viewModel.setFlowRate(5.0f) }
        binding.btnFlow8.setOnClickListener { viewModel.setFlowRate(8.0f) }
        binding.btnFlow12.setOnClickListener { viewModel.setFlowRate(12.0f) }

        val scenarioButtons = listOf(
            binding.btnScenario1 to 1,
            binding.btnScenario2 to 2,
            binding.btnScenario3 to 3,
            binding.btnScenario4 to 4,
            binding.btnScenario5 to 5,
            binding.btnScenario6 to 6,
            binding.btnScenario7 to 7,
            binding.btnScenario8 to 8
        )
        scenarioButtons.forEach { (button, id) ->
            button.setOnClickListener { viewModel.applyScenario(id) }
        }

        binding.btnRefillAll.setOnClickListener { viewModel.refillCylinders("ALL") }
        binding.btnResetSimulation.setOnClickListener { viewModel.resetSimulation() }
        binding.btnExportCsv.setOnClickListener { exportCsvReport() }
    }

    private fun observeViewModel() {
        lifecycleScope.launch {
            repeatOnLifecycle(Lifecycle.State.STARTED) {
                viewModel.uiState.collect { state ->
                    renderUi(state)
                }
            }
        }
    }

    private fun renderUi(state: MainUiState) {
        // 1. Connection Status Pill
        when (state.connectionState) {
            ConnectionState.CONNECTED -> {
                binding.tvConnectionStatus.text = "CONNECTED"
                binding.tvConnectionStatus.setTextColor(getColor(R.color.status_nominal))
                binding.tvConnectionStatus.setBackgroundResource(R.drawable.bg_pill_green)
            }
            ConnectionState.CONNECTING -> {
                binding.tvConnectionStatus.text = "CONNECTING"
                binding.tvConnectionStatus.setTextColor(getColor(R.color.status_warning))
                binding.tvConnectionStatus.setBackgroundResource(R.drawable.bg_pill_amber)
            }
            ConnectionState.DISCONNECTED, ConnectionState.ERROR -> {
                binding.tvConnectionStatus.text = "OFFLINE"
                binding.tvConnectionStatus.setTextColor(getColor(R.color.status_critical))
                binding.tvConnectionStatus.setBackgroundResource(R.drawable.bg_pill_red)
            }
        }

        val tele = state.telemetry
        val isConnected = (state.connectionState == ConnectionState.CONNECTED)

        // 2. Active Alert Banner
        binding.tvActiveAlertText.text = tele.activeAlertMessage
        when (tele.alertSeverity) {
            "CRITICAL" -> {
                binding.cardActiveAlert.setBackgroundResource(R.drawable.bg_pill_red)
                binding.tvActiveAlertText.setTextColor(getColor(R.color.status_critical))
                binding.ivAlertIcon.setColorFilter(getColor(R.color.status_critical))
            }
            "WARNING" -> {
                binding.cardActiveAlert.setBackgroundResource(R.drawable.bg_pill_amber)
                binding.tvActiveAlertText.setTextColor(getColor(R.color.status_warning))
                binding.ivAlertIcon.setColorFilter(getColor(R.color.status_warning))
            }
            else -> {
                binding.cardActiveAlert.setBackgroundResource(R.drawable.bg_pill_green)
                binding.tvActiveAlertText.setTextColor(getColor(R.color.status_nominal))
                binding.ivAlertIcon.setColorFilter(getColor(R.color.status_nominal))
            }
        }

        // 3. Patient Vitals
        binding.tvVitalsSpO2.text = String.format(Locale.US, "%.0f%%", tele.vitals.spo2)
        binding.tvVitalsPulse.text = String.format(Locale.US, "%d bpm", tele.vitals.pulseRate)
        binding.tvVitalsResp.text = String.format(Locale.US, "%d rpm", tele.vitals.respirationRate)
        binding.tvFlowRateBadge.text = String.format(Locale.US, "FLOW: %.1f L/min", tele.flowRateLpm)

        // 4. Update Custom Plethysmograph Waveform View
        binding.plethWaveView.updateVitals(tele.vitals.pulseRate, tele.vitals.spo2, isConnected)

        // 5. Dual Cylinder Progress
        binding.pbPrimarySupply.progress = tele.primary.percentage.toInt().coerceIn(0, 100)
        binding.tvPrimaryPercent.text = String.format(Locale.US, "%.0f%%", tele.primary.percentage)
        binding.tvPrimaryBar.text = String.format(Locale.US, "%.0f Bar", tele.primary.pressureBar)

        binding.pbBackupSupply.progress = tele.backup.percentage.toInt().coerceIn(0, 100)
        binding.tvBackupPercent.text = String.format(Locale.US, "%.0f%%", tele.backup.percentage)
        binding.tvBackupBar.text = String.format(Locale.US, "%.0f Bar", tele.backup.pressureBar)

        // 6. Active Supply Source Indicator
        when (tele.activeSource) {
            "PRIMARY" -> {
                binding.tvActiveSourceBadge.text = "PRIMARY CYLINDER ONLINE"
                binding.tvActiveSourceBadge.setTextColor(getColor(R.color.cyan_accent))
            }
            "BACKUP" -> {
                binding.tvActiveSourceBadge.text = "BACKUP CYLINDER ENGAGED"
                binding.tvActiveSourceBadge.setTextColor(getColor(R.color.teal_accent))
            }
            "RESERVE" -> {
                binding.tvActiveSourceBadge.text = "5-MIN RESERVE BUFFER ACTIVE!"
                binding.tvActiveSourceBadge.setTextColor(getColor(R.color.status_critical))
            }
            else -> {
                binding.tvActiveSourceBadge.text = "TOTAL EXHAUSTION / OFF"
                binding.tvActiveSourceBadge.setTextColor(getColor(R.color.status_critical))
            }
        }

        // 7. 5-Minute Reserve Buffer Card
        binding.pbReserveBuffer.progress = tele.reserve.percentage.toInt().coerceIn(0, 100)
        binding.tvReserveBufferState.text = when {
            tele.reserve.isActive -> "ACTIVE IN USE"
            tele.reserve.isRecharging -> "RECHARGING"
            else -> "STANDBY (${tele.reserve.percentage.toInt()}%)"
        }
        binding.tvReserveCountdown.text = String.format(
            Locale.US,
            "Buffer Available: %.1fs (%.1f L) \u2022 Safety bridge",
            tele.reserve.remainingSeconds,
            tele.reserve.remainingLiters
        )

        // 8. Analytics & Prediction tab
        val hours = (tele.estRemainingMinutes / 60f).toInt()
        val mins = (tele.estRemainingMinutes % 60f).toInt()
        binding.tvAnalyticsEstimatedRuntime.text = String.format(
            Locale.US,
            "Estimated Remaining Runtime: %02dh %02dm (%.1f mins)",
            hours,
            mins,
            tele.estRemainingMinutes
        )

        val logSb = StringBuilder()
        state.eventHistory.forEach { ev ->
            val time = SimpleDateFormat("HH:mm:ss", Locale.US).format(Date(ev.timestampMs))
            logSb.append("[$time] [${ev.severity}] ${ev.message}\n")
        }
        if (state.eventHistory.isEmpty()) {
            logSb.append("No events recorded yet. Target host: ${state.hostAddress}")
        }
        binding.tvEventLogOutput.text = logSb.toString()

        // One-shot feedback toast (consumed immediately so 2 Hz telemetry never repeats it)
        state.statusFeedback?.let { msg ->
            Toast.makeText(this, msg, Toast.LENGTH_SHORT).show()
            viewModel.consumeStatusFeedback()
        }
    }

    private fun showConnectionDialog() {
        val currentIp = viewModel.uiState.value.hostAddress
        val input = EditText(this).apply {
            setText(currentIp)
            hint = "192.168.4.1"
        }

        AlertDialog.Builder(this)
            .setTitle("ESP32 Controller IP")
            .setMessage("Default SoftAP IP is 192.168.4.1. If connected via a local Wi-Fi router, enter the ESP32 STA IP address:")
            .setView(input)
            .setPositiveButton("Connect") { _, _ ->
                val ip = input.text.toString().trim()
                if (ip.isNotEmpty()) {
                    viewModel.connectToHost(ip)
                }
            }
            .setNeutralButton("Use SoftAP (192.168.4.1)") { _, _ ->
                viewModel.connectToHost("192.168.4.1")
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun exportCsvReport() {
        val csv = viewModel.generateCsvReport()
        val sendIntent = Intent().apply {
            action = Intent.ACTION_SEND
            putExtra(Intent.EXTRA_TEXT, csv)
            putExtra(Intent.EXTRA_TITLE, "OXYSYNC_2.0_Audit_Report.csv")
            type = "text/csv"
        }
        startActivity(Intent.createChooser(sendIntent, "Share Demonstration Audit Report"))
    }
}
