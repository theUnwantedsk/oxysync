# OxySync Functional & Technical Requirements

## Functional Requirements

### 1. Patient Vitals Subsystem
- **REQ-VITALS-01**: Continuously track and display $SpO_2$ percentage with clinical color coding (Normal $\ge 95\%$, Caution $90-94\%$, Critical Hypoxemia $< 90\%$, Severe $< 85\%$).
- **REQ-VITALS-02**: Continuously track Pulse Rate (BPM) with tachycardia ($> 100$ BPM) and bradycardia ($< 50$ BPM) notifications.
- **REQ-VITALS-03**: Display animated real-time Photoplethysmogram (PPG) waveform / pulse rhythm graph.
- **REQ-VITALS-04**: Maintain 24-hour vitals telemetry buffer with trend graphs ($SpO_2$ vs Time, Pulse vs Time).

### 2. Oxygen Supply & Runtime Telemetry
- **REQ-SUPPLY-01**: Display real-time Oxygen Flow Rate in Liters Per Minute ($0.0 - 10.0\ L/\text{min}$, step $0.1$).
- **REQ-SUPPLY-02**: Measure Cylinder/Concentrator Pressure (PSI & Bar) with visual fill level gauges.
- **REQ-SUPPLY-03**: Compute dynamic Remaining Runtime ($hours:minutes$) based on current pressure, tank cylinder water volume ($V$), tank pressure factor, and instantaneous flow consumption rate ($t = \frac{P \times V \times F_c}{\text{Flow Rate}}$).
- **REQ-SUPPLY-04**: Support switching between Concentrator mode (continuous generation) and Cylinder mode (finite pressure tank).

### 3. Doctor-Prescribed Flow Titration & Control
- **REQ-TITR-01**: Provide a secure "Doctor Prescription Gate" where authorized clinicians set Min Flow Rate, Max Flow Rate, and Target $SpO_2$ Range ($e.g., 92\% - 96\%$).
- **REQ-TITR-02**: Automated Titration Engine: In Auto mode, adjust flow valve incrementally towards target $SpO_2$ while strictly bounding output within the prescribed Min-Max window.
- **REQ-TITR-03**: Instant Manual Override: Patients or caregivers can toggle to manual flow control or click "Emergency High-Flow Boost" at any moment.
- **REQ-TITR-04**: Valve status indicator with stepper/solenoid actuation feedback and fail-safe return to default baseline if telemetry drops.

### 4. Alert & Alarm Notification Engine
- **REQ-ALARM-01**: Multi-severity triage:
  - **Critical (Red)**: Severe Hypoxemia ($SpO_2 < 85\%$), Zero Oxygen Flow / Tank Empty ($< 15$ min left), Cannula Disconnect.
  - **Warning (Amber)**: Low Oxygen Reserve ($< 30$ min left), Moderate Hypoxemia ($< 90\%$), Flow Out of Range.
  - **Info (Blue/Green)**: System Stable, Flow Target Reached, Auto-Titration Active.
- **REQ-ALARM-02**: Synthesize audible clinical alarm beeps using the Web Audio API with silence/snooze button (120s timer).
- **REQ-ALARM-03**: Interactive Alarm History Log with timestamps, severity levels, and acknowledgment tracking.

### 5. Hardware Simulation & Physical Controller Interface
- **REQ-IOT-01**: Interactive Mechatronic Simulator embedded in the UI:
  - Quick scenario triggers: "Normal Resting", "Nocturnal Desaturation", "Rapid Tank Depletion", "Cannula Detached", "Exercise / Walk Test".
  - Manual sliders to inject custom pressure, $SpO_2$, pulse rate, or flow sensor readings.
- **REQ-IOT-02**: Live ESP32 connection connector via Web Bluetooth / WebSocket endpoint for physical prototype testing.

### 6. User Interface & Caregiver Experience
- **REQ-UI-01**: High-contrast, clean medical UI designed for dark room / bedside use as well as daytime clinical visibility.
- **REQ-UI-02**: Emergency Quick Actions: 1-click "Doctor Call / Emergency Alert", "Max Oxygen 5L/min Boost", "Alarm Silence".
- **REQ-UI-03**: Responsive design optimized for desktop monitors, bedside tablets, and mobile smartphones.
- **REQ-UI-04**: Telemetry export to CSV / PDF summary report for pulmonologist consultation.

## Non-Functional Requirements
- **NFR-PERF-01**: Sub-50ms UI update latency on live telemetry streams (60 FPS PPG waveform rendering).
- **NFR-RELIABILITY-02**: Zero external server dependency for standalone local use (client-side offline-first architecture).
- **NFR-ACCESSIBILITY-03**: High visual contrast compliance, large legible numeric values for patients and elders, audible cue distinctions.
