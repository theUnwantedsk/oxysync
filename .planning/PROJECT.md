# OxySync — Smart Oxygen Supply & Patient Monitoring System

## Vision & Objective
OxySync is an intelligent healthcare mechatronics and telemetry platform that closes the critical gap between oxygen supply sources (concentrators and cylinders) and patient physiological status. Its motto: *"Making oxygen supply status visible, understandable, and actionable before it becomes an emergency."*

The web application provides patients, caregivers, and clinicians with real-time patient vitals, oxygen supply metrics, doctor-prescribed flow titration, and safety alert protocols.

## Target Audience & Personas
1. **Home Healthcare & Respiratory Patients**: Patients with COPD, pulmonary fibrosis, or acute respiratory distress requiring continuous or pulse-dose oxygen.
2. **Family Caregivers & Home Attendants**: Non-clinical operators who need simple, color-coded, predictive status indicators ("How many hours of oxygen are left? Is my family member safe?").
3. **Attending Clinicians & Pulmonologists**: Doctors setting authorized upper and lower oxygen flow titration limits ($L/\text{min}$) and reviewing historical vitals and compliance logs.
4. **Emergency / Clinic Staff**: Healthcare providers needing fast bedside status or ambulance telemetry handoffs.

## Core Problem Statement & Solution
- **Current Problems**:
  - Standalone oxygen concentrators and cylinders have no visibility into the patient's actual $SpO_2$.
  - Disconnected pulse oximeters sound localized beeps without adjusting oxygen delivery or alerting remote caregivers.
  - Cylinders run empty unexpectedly, causing preventable clinical emergencies.
- **OxySync Solution**:
  - Unified real-time telemetry integrating oxygen supply physics (pressure, flow, estimated runtime) with patient vitals ($SpO_2$, pulse rate, waveform).
  - Doctor-prescribed automatic flow regulation within validated clinician boundaries with instantaneous manual override.
  - Multi-tier alert subsystem (visual, auditory, push alerts) for hypoxemia, low reserve, cannula detachment, and valve failover.

## Scope & Architectural Boundaries
- **Frontend / Client**: Modern high-performance React + TypeScript web application built with Tailwind CSS, Lucide icons, responsive dashboard, bedside high-contrast night mode, and audio alert sound generation (Web Audio API).
- **Telemetry & State Engine**: Real-time simulated ESP32 mechatronics telemetry stream with instant preset scenario injection (Normal, Hypoxemic Episode, Cylinder Exhaustion, Cannula Drop, Clinician Limits Exceeded) and Web Bluetooth/WebSocket interface for real ESP32 mechatronic controller boards.
- **Clinical Governance**: Doctor prescription locks, safe min/max flow fences, change auditing, and HIPAA/patient privacy compliant local data storage.
