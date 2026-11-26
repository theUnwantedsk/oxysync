export type TwinComponentId =
  | 'overview'
  | 'primary_cylinder'
  | 'secondary_cylinder'
  | 'solenoid_bank'
  | 'manifold_regulator'
  | 'reserve_buffer'
  | 'esp32_lcd'
  | 'patient_pod';

export interface TwinComponentSpec {
  id: TwinComponentId;
  stepNumber: number;
  title: string;
  subtitle: string;
  gpioPin: string;
  roleSummary: string;
  judgeScript: string;
  technicalSpecs: string[];
  cameraPos: [number, number, number];
  cameraTarget: [number, number, number];
}

export const TWIN_COMPONENTS: Record<TwinComponentId, TwinComponentSpec> = {
  overview: {
    id: 'overview',
    stepNumber: 0,
    title: 'Full OXYSYNC 2.0 Mechatronic Rig',
    subtitle: 'Complete Dual-Cylinder + 5-Min Reserve + ESP32 Ecosystem',
    gpioPin: 'ESP32-WROOM-32 · 240 MHz',
    roleSummary:
      'Virtual exhibition hardware assembly demonstrating closed-loop oxygen monitoring, automated cylinder failover, 5-minute reserve bridging, and live telemetry sync.',
    judgeScript:
      'Judges, since physical medical solenoids and pressurized O₂ cylinders are simulated safely here, this 3D Digital Twin mirrors every firmware pin, Boyle’s Law calculation, valve transition, and LCD page in real time.',
    technicalSpecs: [
      'Dual-mode telemetry: Local Wi-Fi (WS:81 / REST:80) + USB Serial (115200 baud)',
      'Deterministic Boyle’s Law depletion: V_gas = P × V_water, T = V / Q',
      'Zero-interruption automated failover + 5-minute emergency safety bridge'
    ],
    cameraPos: [7.6, 5.2, 8.6],
    cameraTarget: [0, 1.0, 0]
  },
  primary_cylinder: {
    id: 'primary_cylinder',
    stepNumber: 1,
    title: 'Primary Oxygen Cylinder (A-1)',
    subtitle: 'Main Pressurized Source + 0–200 Bar Piezoresistive Sensor',
    gpioPin: 'ADC1_CH6 (GPIO 34) · Solenoid V-1 (GPIO 18)',
    roleSummary:
      'Primary high-pressure medical oxygen source (up to 150 Bar). Continuously monitored via a 12-bit pressure transducer to compute exact remaining minutes.',
    judgeScript:
      'Cylinder A-1 supplies the patient first. As pressure drops, our ESP32 applies Boyle’s Law to predict exact exhaustion time and arms auto-failover before the tank runs dry.',
    technicalSpecs: [
      'Nominal Fill: 150 Bar (2175 PSI) · 4.4 L D/E or 10.0 L M-Size water volume',
      'Transducer: 0–200 Bar piezoresistive bridge sampled at 12-bit resolution',
      'Auto-switch threshold configurable from 5% to 30% (default 10%)'
    ],
    cameraPos: [-5.6, 3.6, 4.8],
    cameraTarget: [-3.2, 1.3, -1.2]
  },
  secondary_cylinder: {
    id: 'secondary_cylinder',
    stepNumber: 2,
    title: 'Secondary Backup Cylinder (B-2)',
    subtitle: 'Hot-Standby Redundant Cylinder for Zero-Drop Failover',
    gpioPin: 'ADC1_CH7 (GPIO 35) · Solenoid V-2 (GPIO 19)',
    roleSummary:
      'Pressurized redundant cylinder isolated on cold/hot standby. Engages instantaneously when Primary drops below the safety threshold or disconnects.',
    judgeScript:
      'When Primary reaches the 10% threshold, the ESP32 closes Valve V-1 and energizes Valve V-2 in milliseconds — maintaining steady oxygen delivery with zero gap.',
    technicalSpecs: [
      'Isolated via normally-closed latching solenoid V-2 until failover',
      'Pre-checked for readiness (>5% pressure & connected) before switching',
      'Logs every transition into the RFC-4180 CSV compliance audit trail'
    ],
    cameraPos: [-5.6, 3.4, 5.4],
    cameraTarget: [-3.2, 1.2, 1.4]
  },
  solenoid_bank: {
    id: 'solenoid_bank',
    stepNumber: 3,
    title: '3-Channel Latching Solenoid Valve Bank',
    subtitle: 'Electromechanical Flow Switching Actuators (V-1, V-2, VR)',
    gpioPin: 'GPIO 18 (V-1) · GPIO 19 (V-2) · GPIO 23 (VR)',
    roleSummary:
      'Drives three independent high-pressure oxygen lines via MOSFET/relay gates. Glowing LED rings show which coil is currently energized.',
    judgeScript:
      'Look at the three brass solenoid valves: V-1 for Primary, V-2 for Backup, and VR for the 5-Minute Reserve. Only the active coil stays energized, preventing cross-tank backflow.',
    technicalSpecs: [
      'Active HIGH relay triggers on GPIO 18, 19, and 23',
      'Pulse-and-hold zero-heat architecture prevents coil thermal drift',
      'Hardware register byte (0x01 / 0x02 / 0x04) streamed over UART/WebSocket'
    ],
    cameraPos: [-1.1, 2.8, 4.4],
    cameraTarget: [-1.1, 0.85, 0.2]
  },
  manifold_regulator: {
    id: 'manifold_regulator',
    stepNumber: 4,
    title: 'High-Pressure Manifold, Regulator & MFC',
    subtitle: '3.5 Bar Dual-Stage Regulator + Mass Flow Controller',
    gpioPin: 'Regulated Output: 3.5 Bar · Flow: 0.5–15.0 L/min',
    roleSummary:
      'Merges Primary and Backup feeds into a machined 6061-T6 aluminum manifold, steps 150 Bar down to 3.5 Bar, and meters exact cannula L/min flow.',
    judgeScript:
      'High cylinder pressure cannot go straight to a patient. The 6061-T6 manifold merges both tanks into a 3.5-bar regulator and Sensirion-class mass flow controller.',
    technicalSpecs: [
      '6061-T6 CNC aluminum manifold with integrated check valves',
      'Dual-stage diaphragm step-down to steady 3.5 Bar line pressure',
      'Real-time volumetric flow control from 0.5 to 15.0 L/min (500–15,000 SCCM)'
    ],
    cameraPos: [0.8, 2.9, 4.6],
    cameraTarget: [0.6, 1.0, 0.1]
  },
  reserve_buffer: {
    id: 'reserve_buffer',
    stepNumber: 5,
    title: '5-Minute Reserve Buffer (Flagship Innovation)',
    subtitle: 'Inline Emergency Continuity Reservoir + Bleed Recharge',
    gpioPin: 'Solenoid VR (GPIO 23) · Target: 300s @ Standard Flow',
    roleSummary:
      'OXYSYNC’s core innovation: an internal pressurized accumulator that activates automatically if both main cylinders fail, giving caregivers 5 minutes to swap tanks.',
    judgeScript:
      'If both cylinders hit zero at the same time, Valve VR opens the 5-Minute Reserve Buffer immediately — buying caregivers critical time to mount a new tank, then auto-recharging via the bleed line.',
    technicalSpecs: [
      'Conceptual 12.5 L @ 2.5 L/min (or 25 L @ 5.0 L/min) = 300 seconds bridge',
      'Engages on dual exhaustion with pulsing crimson alarm & caregiver alert',
      'Auto-recharges at 2.0 L/min bleed rate once fresh cylinder is restored'
    ],
    cameraPos: [0.4, 3.6, -4.4],
    cameraTarget: [0.6, 1.4, -1.6]
  },
  esp32_lcd: {
    id: 'esp32_lcd',
    stepNumber: 6,
    title: 'ESP32 Controller, 16×2 I2C LCD & Piezo Buzzer',
    subtitle: 'Embedded Brain + Live 5-Page LCD Screen + Offline SoftAP',
    gpioPin: 'SDA: GPIO 21 · SCL: GPIO 22 · Buzzer: GPIO 25 · BOOT: GPIO 0',
    roleSummary:
      'Runs the Boyle’s Law simulation, drives the auto-scanned 0x27/0x3F 16×2 LCD across 5 live telemetry pages, sounds IEC alarms on GPIO 25, and hosts OXYSYNC-AP.',
    judgeScript:
      'This ESP32 module runs the entire controller locally with zero cloud dependency. Notice the live 16×2 LCD cycling through the exact 5 pages from our C++ DisplayManager firmware!',
    technicalSpecs: [
      'I2C LCD auto-scans 0x27 & 0x3F at 100 kHz with custom CGRAM glyphs',
      'SoftAP fallback ("OXYSYNC-AP" @ 192.168.4.1) streams WS:81 + REST:80',
      'GPIO 25 piezo buzzer pulses at 2 Hz (Critical) or 0.5 Hz (Warning)'
    ],
    cameraPos: [3.2, 3.2, 5.2],
    cameraTarget: [2.2, 1.1, 1.7]
  },
  patient_pod: {
    id: 'patient_pod',
    stepNumber: 7,
    title: 'Patient Cannula Delivery & Respiratory Pod',
    subtitle: 'Simulated Lung Expansion, SpO₂ Saturation & Pulse Sync',
    gpioPin: 'Target SpO₂: 94–99% · Alarm Threshold: < 90%',
    roleSummary:
      'Visualizes real-time patient response to oxygen delivery. Lungs expand at the simulated respiratory rate and shift color immediately during hypoxemia.',
    judgeScript:
      'Finally, oxygen reaches the nasal cannula. Watch the lungs breathe in sync with respiratory rate — if you trigger Scenario 4 (Low SpO₂), saturation drops to 84% and alarms fire across all screens.',
    technicalSpecs: [
      'Live respiratory motion synced to breaths/min + cardiac pulse ring at BPM',
      'Color-coded physiological feedback: Cyan/Emerald (Nominal) → Red (Hypoxemic)',
      'IEC 60601-1-8 alarm synthesis & Android heads-up caregiver push alerts'
    ],
    cameraPos: [5.4, 3.2, 4.4],
    cameraTarget: [3.3, 1.2, -0.3]
  }
};

export const TWIN_TOUR_ORDER: TwinComponentId[] = [
  'overview',
  'primary_cylinder',
  'secondary_cylinder',
  'solenoid_bank',
  'manifold_regulator',
  'reserve_buffer',
  'esp32_lcd',
  'patient_pod'
];
