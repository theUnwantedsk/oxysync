# OxySync — Smart Oxygen Supply & Patient Monitoring System

[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?logo=vite)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> *"Making oxygen supply status visible, understandable, and actionable before it becomes an emergency."*

OxySync is an intelligent healthcare mechatronics and patient telemetry platform. It bridges the critical monitoring gap between oxygen supply sources (pressurized cylinders or continuous molecular-sieve concentrators) and patient physiological status ($SpO_2$, pulse rate, respiration rate, and plethysmograph waveform).

---

## 🌟 Key Features

### 1. Real-Time Patient Vitals Telemetry
- **Continuous $SpO_2$ Tracking**: Precision blood oxygen monitoring with color-coded alerts (Normal $\ge 95\%$, Target Band $92-96\%$, Caution $< 90\%$, Critical Hypoxemia $< 85\%$).
- **Pulse Rate (BPM)**: Real-time heart rate with dynamic beat animation synchronized to the patient's pulse rhythm, plus tachycardia ($> 120$ BPM) and bradycardia alerts.
- **60 FPS PPG Waveform Canvas**: High-frequency synthetic Photoplethysmograph with dicrotic notch rendering.
- **Perfusion Index & Respiration**: Quantitative signal strength ($PI\%$) and respiratory rate tracking ($Br/\text{min}$).
- **Cannula / Probe Disconnection Alarm**: Immediate detection of dislodged nasal prongs or detached pulse oximeter probe.

### 2. Oxygen Supply & Depletion Physics
- **Dual Source Support**:
  - **Pressurized Cylinder**: High-pressure cylinder physics model ($0 - 2200$ PSI / $0 - 150$ Bar) with 680L tank capacity ($4.4$L water volume).
  - **Oxygen Concentrator**: Continuous flow generation from ambient air without pressure depletion.
- **Dynamic Runtime Estimation**: Calculates remaining hours and minutes dynamically using Boyle's gas law:
  $$\text{Remaining Minutes} = \frac{\left(\frac{P_{\text{psi}}}{2000}\right) \times 680\text{ Liters}}{\text{Flow Rate }(L/\text{min})}$$
- **Mechatronic Valve Actuator**: Percentage stepper/servo valve position feedback ($0 - 100\%$).

### 3. Doctor-Prescribed Closed-Loop Titration
- **Physician Passcode Gate**: Clinicians authenticate (PIN: `1234`) to lock/unlock safe titration bounds:
  - Minimum Allowed Flow ($0.5 - 5.0\ L/\text{min}$)
  - Maximum Allowed Flow ($1.0 - 10.0\ L/\text{min}$)
  - Target $SpO_2$ Saturation Window (e.g. $92\% - 96\%$)
- **Automated Titration**: Smoothly titrates valve delivery up when $SpO_2$ desaturates and down when hyper-oxygenated, strictly bounded within clinician orders.
- **Manual Override & 1-Click 5L Boost**: Immediate tactile override for patients, caregivers, or emergency situations.

### 4. Safety & Auditory Alarm Subsystem
- **IEC 60601-1-8 Compliant Audio**: Built-in Web Audio API synthesizer generating standard medical alarm pulse sequences:
  - High-Priority Critical Alarm (Urgent 3-pulse burst)
  - Yellow Caution Warning (2-pulse chime)
  - QRS Heartbeat Sync Tone
- **2-Minute Snooze & Acknowledgment**: Dedicated 120-second alarm silence timer with audit logging.
- **Comprehensive Incident Audit**: Timestamped alarm history with CSV export.

### 5. Mechatronics Testbench & ESP32 Link
- **Clinical Scenario Injector**:
  - *Normal Resting* ($SpO_2\ 96\%$, 72 BPM, 2.0 L/min)
  - *Acute Hypoxemia* ($SpO_2\ 84\%$, 108 BPM, valve ramps up)
  - *Post-Exercise Walk Test* ($SpO_2\ 89\%$, 126 BPM)
  - *Low Tank Reserve* ($< 200$ PSI, runtime $< 20$ min)
  - *Cannula Disconnection* (Probe off patient)
  - *Upper Flow Limit* (SpO2 remains critical despite max valve opening)
- **Live ESP32 Serial Telemetry Monitor**: Displays formatted UART JSON packets (`seq`, `dev`, `spo2`, `bpm`, `flow`, `psi`, `valve`, `cannula`).
- **Web Bluetooth / BLE Connector**: Hooks directly into real ESP32 microcontroller boards.

### 6. Clinical Bedside Mode & Reporting
- **Bedside Night Mode**: Fullscreen, high-contrast, low-light OLED display for overnight care without room glare.
- **Dossier & Report Generator**: Generates clinical session summaries with 1-click Print to PDF or JSON export.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (tested on v24.19)
- npm or pnpm

### Installation
```bash
# Clone or navigate to the project directory
cd C:\Users\Shubham\.gemini\antigravity\scratch\oxysync-app

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will start at `http://localhost:3000`.

### Production Build
```bash
npm run build
npm run preview
```

---

## 🔒 Clinician Access
- **Default Doctor PIN**: `1234`
- Use the **Rx Lock** button in the top navigation bar to authenticate and calibrate patient titration boundaries.

---

## 🛠️ Mechatronic Architecture

```
[ Medical O2 Flow Sensor ] --+
[ Pressure Transducer   ] ---+---> [ ESP32 Controller ] <--- BLE/WiFi ---> [ OxySync Web Dashboard ]
[ SpO2 / Pulse Probe    ] --+          |
                                       +---> [ O2-Rated Valve Actuator ]
```
