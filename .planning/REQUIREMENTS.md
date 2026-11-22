# OXYSYNC 2.0 Requirements Specification

## 1. Functional Requirements (FR)

### FR-01: Simulated Patient Monitoring
- Real-time simulation of SpO2 (70-100%), pulse rate (40-180 BPM), respiratory rate, and perfusion index.
- 60 FPS animated plethysmographic (PPG) waveform rendered on HTML5 Canvas.
- Ubiquitous, high-visibility "SIMULATED DATA" badges across all patient displays.

### FR-02: Dual-Cylinder Management & Physics
- Primary Cylinder & Secondary (Backup) Cylinder tracking:
  - Pressure in Bar & PSI
  - Remaining gas volume in Liters ($V = P_{bar} \times V_{water}$)
  - Percentage capacity (0-100%)
  - Estimated remaining duration ($T = V_{gas} / Q_{flow}$)
  - Connection status: Connected, Active, Standby, Empty, Disconnected, Refilling.
- Configurable auto-switch threshold (default: 10% / 20 bar).
- Automatic primary-to-secondary failover when primary reaches threshold.
- Manual switching toggle with safety interlock.
- One-click cylinder refill simulation.

### FR-03: Five-Minute Reserve Buffer (Original OXYSYNC Concept)
- Dedicated reserve oxygen buffer conceptually designed for temporary continuity during supply swap.
- Configurable capacity (default 12.5 L = 5 minutes at 2.5 L/min).
- Dynamic countdown visualization showing remaining time and percentage.
- Automatic activation if both primary and secondary supplies are depleted or disconnected.
- Automatic simulated refill when replacement supply is restored.
- Explicit engineering disclaimer regarding clinical validation targets.

### FR-04: Animated Visual Supply Path
- Interactive SVG mechatronic manifold diagram.
- Real-time visual depiction of active gas flow pulses from Primary, Secondary, or Reserve Buffer through the regulator to the patient cannula.
- Valve actuation states (Open, Closed, Switching) with clear simulated disclaimer.

### FR-05: Predictive Analytics Engine
- Deterministic depletion calculation displaying remaining hours and minutes.
- Projected exhaustion timestamps based on current flow rate.
- Interactive Recharts visualization showing supply consumption trends and depletion curves.
- Mathematical formula transparency card displaying $T = (P \times V) / Q$ and gas law assumptions.

### FR-06: Emergency Simulation Lab (Live Demonstration)
- Dedicated top-level page with 8 one-click scenarios:
  1. Normal operation
  2. Primary cylinder becoming empty
  3. Automatic backup switching
  4. Low simulated SpO2 alert
  5. Backup cylinder becoming empty
  6. Both supplies unavailable
  7. Reserve buffer activation
  8. Supply restoration and reserve refill
- Each scenario mutates live state with structured rationale:
  - What happened
  - Why it happened
  - System response
  - Timestamped event log entry
- Step-by-step animated event progression pipeline.
- One-click "Reset Simulation" action.

### FR-07: Caregiver Dashboard
- Dedicated simplified interface for family attendants and nurses.
- High-contrast, reassuring status indicators (Stable / Warning / Emergency).
- Total available supply duration in plain language.
- Active warnings with recommended actions.
- Browser demo notifications (`Notification` API) and Web Audio test alarms.

### FR-08: Analytics, Auditing & Reports
- Interactive charts: consumption trends, switching history, and alert frequency.
- Filterable system event log.
- Exportable CSV report generation.
- Formatted printable clinical demonstration report.

### FR-09: Presentation Mode for Judges
- Streamlined exhibition mode hiding navigation chrome.
- OXYSYNC 2.0 branding, tagline, and project mission.
- Interactive system architecture diagram:
  `Patient Monitoring Simulator` → `OXYSYNC Control Engine` → `Oxygen Supply Prediction` → `Primary/Backup Supply Manager` → `Reserve Buffer Manager` → `Alert and Caregiver Interface`.
- Embedded live switching and reserve demonstration panel.

### FR-10: Configuration & Persistence
- Adjustable simulation speed (0.5x, 1x, 2x, 5x, 10x).
- Cylinder sizes, switching thresholds, flow rates, and reserve capacities.
- LocalStorage persistence for user preferences.

## 2. Non-Functional Requirements (NFR)
- NFR-01: 100% offline functionality — no external API keys or paid services.
- NFR-02: Clean, modular React + TypeScript architecture adhering to Clean Code standards.
- NFR-03: Responsive medical dark-mode design (charcoal/navy with teal/cyan accents).
- NFR-04: Web performance optimization: 60 FPS waveform animation via `requestAnimationFrame` with zero memory leaks.
