# OXYSYNC 2.0 — Intelligent Oxygen Management Platform

[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?logo=vite)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Recharts](https://img.shields.io/badge/Recharts-3.11-22c55e)](https://recharts.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> **Tagline**: *Intelligent Oxygen. Continuous Care.*

**OXYSYNC 2.0** is an intelligent oxygen supply monitoring, predictive depletion estimation, and automated backup management software prototype. It demonstrates how a connected healthcare mechatronics platform can monitor oxygen parameters, estimate remaining oxygen runtimes, predict cylinder depletion, automatically manage primary-to-backup supply failover, activate a conceptual 5-minute reserve buffer during supply transitions, and notify caregivers before emergencies occur.

---

> [!IMPORTANT]
> **SAFETY & SIMULATION NOTICE**:
> This is a **SOFTWARE-ONLY PROTOTYPE**. There is no connected medical hardware or validated clinical monitoring. All patient readings, oxygen measurements, alerts, valve states, and switching operations are clearly labelled as **SIMULATED**. Never present simulated measurements as real clinical readings.

---

## 🚀 Key Modules & Architecture

### 1. Operations Dashboard
- **Patient Monitoring Panel**: Simulated SpO₂ (70-100%), pulse rate (40-200 BPM), respiration rate, perfusion index, 60 FPS HTML5 Canvas plethysmograph (PPG) waveform, and persistent simulation badges.
- **Oxygen Supply Management**: Primary Cylinder (A-1), Secondary Backup Cylinder (B-2), and the conceptual 5-Minute Reserve Buffer with pressure readouts (bar & PSI), runtime remaining, and 1-click refill.
- **System Overview & Audit**: Real-time operating mode, total combined volume, last switching event, and active alerts stream.

### 2. Smart Supply Manifold & Flow Path
- **Interactive SVG Mechatronics Schematic**: Real-time visual depiction of the oxygen transit path from cylinders, through solenoid valves (V-1, V-2), high-pressure manifold, pressure regulator (3.5 bar), mass flow controller, and to the patient nasal cannula.
- **Animated Gas Flow Pulses**: Visualizes active gas flow with glowing pulse keyframes.
- **Configurable Switching Threshold**: Adjust auto-switch trigger (5% to 25%).

### 3. Emergency Simulation Lab (Live Demonstration)
Dedicated testbed featuring 8 one-click deterministic clinical & supply scenarios:
1. **Normal Operation**: Stable vitals (SpO₂ 98%, HR 72), primary cylinder active at 135 bar.
2. **Primary Cylinder Depletion**: Primary pressure rapidly falls to 18 bar (12%), arming auto-failover.
3. **Automatic Backup Switching**: Primary crosses 10% threshold; valve transitions smoothly to secondary cylinder.
4. **Low Simulated SpO₂ Alert**: Patient desaturates to 84% SpO₂, triggering clinical alarm and flow alert.
5. **Backup Cylinder Depletion**: Secondary backup cylinder drops to critical low level (5%).
6. **Both Supplies Unavailable**: Primary and secondary cylinders both depleted or disconnected (0 bar).
7. **Reserve Buffer Activation**: Original OXYSYNC 5-minute reserve buffer engages; emergency countdown begins.
8. **Supply Restoration & Refill**: Fresh 150-bar cylinder connected; normal flow resumes and reserve recharges.
- Includes structured breakdown (*What Happened*, *Why It Happened*, *System Response*, *State Snapshot*), step-by-step animated logic sequence, and **RESET SIMULATION** action.

### 4. Predictive Depletion Analytics
- **Deterministic Boyle\'s Gas Law Physics**:
  $$V_{\text{gas}} = P_{\text{bar}} \times V_{\text{water}}$$
  $$T_{\text{remaining}} = \frac{V_{\text{gas}}}{Q_{\text{flow}}}$$
- **Recharts Forecast Visualization**: Area chart projecting multi-source depletion curves over the next 4 hours.
- **Transparent Assumptions**: Transparently details gas law assumptions (ideal gas at 20°C, continuous uniform flow, no pneumatic leaks). Clarified as deterministic physics modeling, not black-box heuristic AI.

### 5. Caregiver Interface
- Reassuring, plain-language patient condition cards (*Patient Breathing Comfortably* / *Caution Advised* / *Urgent Attention*).
- Total available oxygen runtime in plain English (*"X Hours Y Minutes"*).
- Plain-English attendant advisories with recommended actions.
- Browser-based push notification demo (`Notification` API) and medical audio chime tester.

### 6. Analytics, Auditing & Reports
- Hourly consumption volume chart and alert incident frequency chart.
- Complete cylinder switching audit trail table.
- **CSV Export**: Generates and downloads `OXYSYNC_2.0_Demonstration_Report.csv`.
- **Demonstration Dossier**: Printable clinical demonstration report modal.

### 7. College Exhibition Presentation Mode
- Tailored presentation interface for exhibition judges.
- Complete system architecture diagram:
  $$\text{Patient Monitoring Simulator} \longrightarrow \text{OXYSYNC Control Engine} \longrightarrow \text{Oxygen Supply Prediction} \longrightarrow \text{Primary/Backup Supply Manager} \longrightarrow \text{Reserve Buffer Manager} \longrightarrow \text{Alert and Caregiver Interface}$$
- Interactive clickable subsystem nodes detailing control signals and specifications.
- Embedded live demonstration controls.

### 8. Innovation & Technical Dossier
- Six core innovation pillars of OXYSYNC 2.0.
- Clear distinction between implemented software prototype and proposed physical mechatronics hardware (ESP32-S3, piezoresistive pressure transducers, Bürkert latching solenoid valves, Sensirion mass flow sensor).

### 9. System Simulation Settings
- Simulation speed multiplier (0.5x, 1x, 2x, 5x, 10x).
- Cylinder sizes (4.4L D/E vs 10.0L M-size).
- Switching threshold slider.
- Reserve buffer capacity adjustment.
- Audio volume and alarm preferences.
- LocalStorage persistence.

---

## 🛠️ Technology Stack
- **Framework**: React 18 + Vite 6 + TypeScript 5.7
- **Styling**: Tailwind CSS + Custom Medical Dark Glassmorphism
- **Charting**: Recharts 3.11 + HTML5 Canvas
- **Icons**: Lucide React
- **Audio**: Web Audio API (IEC 60601-1-8 medical alarm tone synthesizer)
- **Persistence**: Browser LocalStorage

---

## 💻 Getting Started

### Development Server
```bash
npm install
npm run dev
```

### Production Build
```bash
npm run build
npm run preview
```
The optimized production build will be emitted to `dist/`.
