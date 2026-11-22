# OXYSYNC 2.0 Roadmap

## Milestone: v2.0.0 — Intelligent Oxygen Management Platform

### Phase 1: Core Physics & Multi-Source Simulation Engine
- [ ] Define comprehensive TypeScript interfaces for Dual Cylinders (Primary, Secondary), 5-Minute Reserve Buffer, Switching Engine, Predictions, Alerts, and Events.
- [ ] Build physics calculation helpers ($T = (P \times V)/Q$, depletion curves, timestamp projections).
- [ ] Implement simulation state provider with auto-switching logic, reserve buffer engagement, and LocalStorage persistence.

### Phase 2: Live Operational Dashboard & Animated Supply Path
- [ ] Refactor patient vitals card with prominent SIMULATED badges and 60fps PPG canvas.
- [ ] Create Dual-Cylinder & Reserve Buffer status panels.
- [ ] Build interactive SVG animated mechatronic manifold illustrating active flow path, valve actuations, and gas delivery.

### Phase 3: Emergency Simulation Lab (Live Demonstration Page)
- [ ] Build dedicated "Live Demonstration" page with 8 deterministic one-click scenarios.
- [ ] Implement structured narrative cards (What Happened, Why, System Response).
- [ ] Add animated step-by-step event pipeline and Reset Simulation control.

### Phase 4: Predictive Analytics, Caregiver View & Audio Alarms
- [ ] Build Predictive Analytics view with Recharts depletion forecasts, consumption trends, and mathematical formula transparency.
- [ ] Build Caregiver Dashboard with friendly patient status, plain-English advisories, and browser demo notifications.
- [ ] Implement IEC 60601-1-8 compliant Web Audio alarms with mute and snooze.

### Phase 5: Analytics, Reports, Exhibition Presentation Mode & Innovation Spec
- [ ] Build Analytics & Reports view with consumption charts, switching logs, alert frequency, and CSV exporter.
- [ ] Build College Exhibition Presentation Mode with interactive end-to-end architecture diagram.
- [ ] Build About & Innovation page detailing mechatronic hardware roadmap vs software simulation.
- [ ] Build comprehensive Settings page for simulation speeds and physical parameters.
- [ ] Quality assurance: verification of all scenarios, responsive layouts, 0 console errors, 0 TS errors, and verified production build.
