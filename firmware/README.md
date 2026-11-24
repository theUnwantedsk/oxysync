# OXYSYNC 2.0 — ESP32 Embedded Firmware Guide

## 1. Hardware Pinout & Wiring Table

All pin definitions are centralized in [`firmware/include/hardware_config.h`](include/hardware_config.h).

| Component | Component Pin | ESP32 GPIO Pin | Notes |
| :--- | :--- | :--- | :--- |
| **I2C LCD Display (PCF8574)** | `GND` | `GND` | Common ground |
| | `VCC` | `5V` (or `VIN`) | Power supply (5V gives optimal LCD contrast) |
| | `SDA` | **GPIO 21** | ESP32 Hardware I2C Data |
| | `SCL` | **GPIO 22** | ESP32 Hardware I2C Clock |
| **Primary Solenoid Relay** | `IN / SIG` | **GPIO 18** | Digital Output (Active HIGH) |
| **Backup Solenoid Relay** | `IN / SIG` | **GPIO 19** | Digital Output (Active HIGH) |
| **Reserve Solenoid Relay** | `IN / SIG` | **GPIO 23** | Digital Output (Active HIGH) |
| **Alarm Buzzer (Piezo)** | `+` (Positive) | **GPIO 25** | Digital Output (Active HIGH) |
| **Manual LCD Button** | `Button Pin` | **GPIO 0** | Uses ESP32 onboard `BOOT` button (Active LOW) |

> [!TIP]
> **I2C Address**: Default is `0x27`. If your LCD uses the alternate PCF8574AT backpack chip, change `#define LCD_I2C_ADDR 0x3F` in `hardware_config.h`.

---

## 2. Multi-Page Display Operation

The firmware automatically cycles through 5 distinct pages every **3.5 seconds** (or press the onboard `BOOT` button on GPIO 0 to cycle manually):

1. **PAGE 1: OXYSYNC HOME**: Branding, live pulse rate, SpO2, and network mode (`STA` or `AP`).
2. **PAGE 2: SUPPLY MONITOR**: Primary cylinder (`%` & `Bar`), Backup cylinder (`%` & `Bar`), and active line indicator (`*`).
3. **PAGE 3: PREDICTION**: Remaining supply runtime (`HH:MM`), delivery flow rate (`L/min`), and status indicator.
4. **PAGE 4: ALERTS**: System alert severity (`NORMAL`, `WARNING`, `CRITICAL`), active alert text, and sensor status.
5. **PAGE 5: SYSTEM**: Wi-Fi connection mode (`SoftAP` or `STA-Net`), client count, IP address, and memory diagnostics.

---

## 3. Wi-Fi Dual-Mode (STA + Fallback AP)

1. **Station Mode (Default Router)**:
   - Configured via `WIFI_STA_SSID` and `WIFI_STA_PASS` in `hardware_config.h`.
   - ESP32 tries to connect to your Wi-Fi router for 10 seconds.
2. **Exhibition SoftAP Fallback (Offline Mode)**:
   - If no router is detected or connection times out, ESP32 automatically launches its own Wi-Fi Access Point:
     - **SSID**: `OXYSYNC-AP`
     - **Password**: `oxysync2026`
     - **IP Address**: `192.168.4.1`
   - Connect your Android phone or laptop directly to `OXYSYNC-AP`.

---

## 4. HTTP REST API Reference (Port 80)

All endpoints include CORS headers (`Access-Control-Allow-Origin: *`).

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | Responsive HTML status dashboard for browser access |
| `GET` | `/api/status` | Complete JSON telemetry packet |
| `GET` | `/api/vitals` | Live simulated patient vitals (SpO2, Pulse, Respiration) |
| `GET` | `/api/prediction` | Boyle's law remaining runtime and depletion math |
| `GET` | `/api/alerts` | Active alert message and recent event history |
| `POST` | `/api/control/switch` | `{"target": "PRIMARY" \| "BACKUP"}` |
| `POST` | `/api/control/flow` | `{"rate": 5.0}` (Set flow rate in L/min) |
| `POST` | `/api/control/refill` | `{"cylinder": "ALL" \| "PRIMARY" \| "BACKUP"}` |
| `POST` | `/api/control/scenario` | `{"scenarioId": 1..8}` (Triggers one of 8 scenarios) |
| `POST` | `/api/control/reset` | Resets simulation to 100% full baseline |

---

## 5. WebSocket Telemetry Stream (Port 81)

- Connect to `ws://<ESP32_IP>:81/`
- Streams telemetry JSON packets automatically at **2 Hz (500 ms)**.
- Can receive commands: `{"action": "scenario", "id": 3}`.

---

## 6. How to Flash

### Option A: PlatformIO (Recommended)
```bash
cd firmware
pio run --target upload
pio device monitor -b 115200
```

### Option B: Arduino IDE
1. Open `firmware.ino` in Arduino IDE.
2. Open **Library Manager** (`Ctrl+Shift+I`) and install:
   - `ArduinoJson` by Benoit Blanchon (v6.x or v7.x)
   - `LiquidCrystal_I2C` by Frank de Brabander / Marco Schwartz
   - `WebSockets` by Markus Sattler
3. Select Board: **ESP32 Dev Module**
4. Connect ESP32 via micro-USB / USB-C and hit **Upload**!
