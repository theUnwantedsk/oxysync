# OXYSYNC 2.0 — Intelligent Oxygen Management Platform

## Project Purpose & Vision
OXYSYNC 2.0 is an intelligent oxygen supply monitoring, predictive depletion estimation, and automated backup management software prototype.
**Tagline**: *Intelligent Oxygen. Continuous Care.*

Its objective is to demonstrate how a connected healthcare mechatronics platform can continuously monitor oxygen-related parameters, estimate remaining oxygen supply, predict cylinder exhaustion, automatically manage primary-to-backup supply failover, activate a conceptual 5-minute reserve buffer during supply transitions, and notify caregivers before emergencies occur.

## Critical Safety & Simulation Disclaimer
IMPORTANT: This is a **SOFTWARE-ONLY PROTOTYPE**. There is no connected medical hardware or validated clinical monitoring. All patient readings, oxygen measurements, alerts, valve states, and switching operations are clearly labelled as **SIMULATED**.
Simulated measurements are never presented as real clinical data.

## Key Subsystems
1. **Patient Monitoring Simulator**: Simulated SpO2, heart rate, respiratory rate, perfusion index, and real-time plethysmograph waveform canvas.
2. **Dual-Cylinder Supply Manager**: Continuous monitoring of Primary and Secondary (Backup) cylinders with configurable capacity, pressure, and auto-switching thresholds.
3. **Five-Minute Reserve Buffer**: Conceptual emergency bridge providing temporary continuity during cylinder replacement, with countdown visualization and simulated refill.
4. **Predictive Depletion Analytics**: Deterministic gas physics calculations estimating remaining runtime and projected low-supply timestamps.
5. **Emergency Simulation Lab (Live Demonstration)**: 8 interactive one-click clinical and supply failure scenarios with real-time state mutation and visual step sequencing.
6. **Caregiver Interface**: Plain-language alerts, total supply runtime display, and browser demonstration notifications.
7. **Exhibition Presentation Mode**: Tailored view for college judges with interactive end-to-end system architecture diagram.
8. **Engineering Innovation & Transparency**: Mathematical formulas, gas law assumptions, and hardware implementation roadmap.
