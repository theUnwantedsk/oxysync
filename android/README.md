# OXYSYNC 2.0 — Native Kotlin Android Application Guide

## 1. Overview
The **OXYSYNC 2.0 Native Android Application** is written in Kotlin for Android 8.0+ (API 24 to 34). It connects directly to the ESP32 central controller over local Wi-Fi or standalone Access Point mode (`OXYSYNC-AP`).

### Key Capabilities:
- **Real-Time Patient Vitals**: Continuous telemetry of SpO2 (%), Pulse Rate (BPM), Respiration (RPM), and Perfusion Index (PI).
- **Custom Canvas Plethysmograph (PPG Waveform)**: High-performance 60 FPS hardware-accelerated canvas displaying realistic pulse oximetry dicrotic notches, dynamically modulated by pulse rate and SpO2.
- **Dual-Cylinder Supply Visualizer**: Real-time progress gauges for Primary (Bar / %) and Backup (Bar / %) supplies with animated active flow line indicators.
- **5-Minute Reserve Buffer Chronometer**: Real-time countdown and recharge monitor for the conceptual 5-minute safety bridge.
- **Emergency Simulation Lab**: 8 one-click trigger buttons corresponding to the exhibition test suite.
- **Caregiver Heads-Up Notifications**: System alert channels triggering notifications on low SpO2 (<89%), automatic solenoid switching, or reserve buffer engagement.
- **Exportable Demonstration Audit (CSV)**: One-tap export via Android Intent to share session logs and gas depletion records.

---

## 2. Requirements & Tech Stack
- **IDE**: Android Studio Hedgehog / Iguana / Jellyfish (or newer).
- **Gradle**: 8.5+ with AGP 8.2.2.
- **JDK**: Java 17+.
- **Language**: Kotlin 1.9.22.
- **UI Architecture**: MVVM, ViewBinding, Google Material 3 Dark Theme.
- **Networking**: OkHttp 4.12.0, Retrofit 2.9.0, Moshi Kotlin, WebSockets.

---

## 3. How to Open and Run in Android Studio

1. Open **Android Studio**.
2. Select **File > Open...** and navigate to:
   ```
   C:\Users\Shubham\.gemini\antigravity\scratch\oxysync-connected\android
   ```
3. Allow Gradle to sync dependencies.
4. Connect an Android phone via USB (with USB Debugging enabled) or start an Android Emulator.
5. Click **Run 'app'** (`Shift+F10`).

---

## 4. Connecting to the ESP32

### Mode A: Standalone Exhibition Demo (SoftAP — No Router Needed)
1. Turn on the ESP32.
2. If no home/office Wi-Fi is available, the ESP32 automatically starts its own Wi-Fi Access Point within 10 seconds:
   - **SSID**: `OXYSYNC-AP`
   - **Password**: `oxysync2026`
3. On your Android phone, connect to Wi-Fi `OXYSYNC-AP`.
4. Open the OXYSYNC Android app. It defaults automatically to `192.168.4.1` and establishes a real-time WebSocket connection immediately!

### Mode B: Local Wi-Fi Router
1. When the ESP32 and phone are connected to the same Wi-Fi router, the ESP32 LCD screen Page 5 displays its assigned IP (e.g., `192.168.1.45`).
2. In the Android App, tap the **Gear/Settings icon** in the top-right corner.
3. Enter the ESP32 IP address and tap **Connect**.

---

## 5. Emergency Simulation Lab Scenarios

From the **Simulation Lab** tab, tap any of the 8 scenarios:

1. **Normal Operation**: Restores primary supply to 100% and backup to standby.
2. **Primary Cylinder Low (<20%)**: Drives primary pressure down to near auto-switch threshold.
3. **Automatic Backup Switching**: Crosses 15% threshold; solenoid switches immediately to Backup.
4. **Low SpO2 Hypoxemia Alert**: Drops simulated SpO2 to 86.5%, triggering a critical heads-up caregiver alarm.
5. **Backup Cylinder Depleting**: Primary empty, backup drops under 15%.
6. **Dual Supply Failure**: Both primary and backup exhausted; reserve buffer engages.
7. **5-Minute Reserve Buffer**: Demonstrates countdown of the 5-minute safety bridge.
8. **Supply Restored & Reserve Refill**: New cylinder connected; reserve buffer recharges.
