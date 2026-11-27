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
  designRationale: string;
  technicalSpecs: string[];
  cameraPos: [number, number, number];
  cameraTarget: [number, number, number];
}

export const TWIN_COMPONENTS: Record<TwinComponentId, TwinComponentSpec> = {
  overview: {
    id: 'overview',
    stepNumber: 0,
    title: 'Full OXYSYNC 2.0 Assembly',
    subtitle: 'Dual-Cylinder Manifold · 5-Min Reserve · ESP32 Controller',
    gpioPin: 'ESP32-WROOM-32 · 240 MHz',
    roleSummary:
      'Complete simulated pneumatic and electronics rig linking Boyle’s Law cylinder depletion with automated valve switching, reserve bridging, and 5-page LCD telemetry.',
    designRationale:
      'Replaces unmonitored hospital regulators with real-time pressure sensing, automated tank changeover before exhaustion, and deterministic reserve continuity.',
    technicalSpecs: [
      'Local telemetry sync over Wi-Fi (WS:81 / REST:80) and USB Serial (115200 baud)',
      'Boyle’s Law runtime estimation: V_gas = P × V_water, T = V / Q',
      'Automated primary-to-backup changeover with inline 5-minute safety bridge'
    ],
    cameraPos: [7.6, 5.2, 8.6],
    cameraTarget: [0, 1.0, 0]
  },
  primary_cylinder: {
    id: 'primary_cylinder',
    stepNumber: 1,
    title: 'Primary Oxygen Cylinder (A-1)',
    subtitle: 'Main Pressurized Source · 0–200 Bar Transducer',
    gpioPin: 'ADC1_CH6 (GPIO 34) · Solenoid V-1 (GPIO 18)',
    roleSummary:
      'Primary 150-bar oxygen tank supplying continuous therapeutic flow while continuously sampled by a 12-bit piezoresistive sensor.',
    designRationale:
      'Continuous pressure tracking detects declining reserve well ahead of exhaustion, giving staff predictable time-to-empty countdowns.',
    technicalSpecs: [
      '150 Bar nominal fill · 4.4 L D/E (660 L NTP) or 10.0 L M-Size (1500 L NTP)',
      '12-bit ADC transducer sampling mapped across 0–200 Bar span',
      'Configurable auto-switch trigger from 5% to 30% remaining (default 10%)'
    ],
    cameraPos: [-5.6, 3.6, 4.8],
    cameraTarget: [-3.2, 1.3, -1.2]
  },
  secondary_cylinder: {
    id: 'secondary_cylinder',
    stepNumber: 2,
    title: 'Backup Oxygen Cylinder (B-2)',
    subtitle: 'Standby Redundant Tank for Zero-Gap Failover',
    gpioPin: 'ADC1_CH7 (GPIO 35) · Solenoid V-2 (GPIO 19)',
    roleSummary:
      'Pressurized secondary tank held isolated on standby until Primary A-1 reaches the failover threshold or disconnects.',
    designRationale:
      'Isolating B-2 behind solenoid V-2 prevents simultaneous draw-down of both cylinders and guarantees immediate full-pressure availability on switchover.',
    technicalSpecs: [
      'Normally-closed latching solenoid V-2 energized on threshold crossing',
      'Pre-switch readiness validation (>5% remaining & connected)',
      'Every transition timestamped in CSV compliance audit trail'
    ],
    cameraPos: [-5.6, 3.4, 5.4],
    cameraTarget: [-3.2, 1.2, 1.4]
  },
  solenoid_bank: {
    id: 'solenoid_bank',
    stepNumber: 3,
    title: '3-Channel Solenoid Valve Bank',
    subtitle: 'Actuator Stage for V-1, V-2, and VR Lines',
    gpioPin: 'GPIO 18 (V-1) · GPIO 19 (V-2) · GPIO 23 (VR)',
    roleSummary:
      'Three independent MOSFET-driven latching solenoid valves routing gas from Primary, Backup, or the Reserve Buffer.',
    designRationale:
      'Mutually exclusive coil actuation eliminates cross-cylinder backflow while keeping idle coil dissipation near zero.',
    technicalSpecs: [
      'Discrete active-HIGH gate outputs on GPIO 18, GPIO 19, and GPIO 23',
      'Pulse-and-hold PWM minimizes coil thermal drift during long sessions',
      'Coil bitmask byte (0x01 / 0x02 / 0x04) published in telemetry frames'
    ],
    cameraPos: [-1.1, 2.8, 4.4],
    cameraTarget: [-1.1, 0.85, 0.2]
  },
  manifold_regulator: {
    id: 'manifold_regulator',
    stepNumber: 4,
    title: 'Manifold, Regulator & Mass Flow Meter',
    subtitle: '3.5 Bar Pressure Reduction · 0.5–15.0 L/min Metering',
    gpioPin: 'Line: 3.5 Bar · Delivery: 0.5–15.0 L/min',
    roleSummary:
      'Machined 6061-T6 manifold merging A-1 and B-2 feeds through check valves, a 3.5-bar dual-stage regulator, and cannula flow controller.',
    designRationale:
      'Separates high-pressure tank storage (up to 150 Bar) from steady, safe low-pressure patient cannula delivery (3.5 Bar line).',
    technicalSpecs: [
      'CNC 6061-T6 aluminum block with non-return check valves',
      'Dual-stage diaphragm pressure reduction to 3.5 Bar downstream',
      'Proportional volumetric titration across 500–15,000 SCCM'
    ],
    cameraPos: [0.8, 2.9, 4.6],
    cameraTarget: [0.6, 1.0, 0.1]
  },
  reserve_buffer: {
    id: 'reserve_buffer',
    stepNumber: 5,
    title: '5-Minute Reserve Buffer',
    subtitle: 'Inline Emergency Reservoir · Auto Bleed Recharge',
    gpioPin: 'Solenoid VR (GPIO 23) · Target: 300s Continuity',
    roleSummary:
      'Internal accumulator providing up to 5 minutes of emergency supply if both external cylinders empty simultaneously.',
    designRationale:
      'Buys caregivers critical transition minutes to mount a fresh cylinder without hypoxia risk, then automatically recharges via a restricted bleed line.',
    technicalSpecs: [
      '12.5 L @ 2.5 L/min baseline design target (~300 s window)',
      'Sub-second check-valve failover when manifold pressure collapses',
      'Automatic inline recharge upon cylinder restoration'
    ],
    cameraPos: [0.4, 3.6, -4.4],
    cameraTarget: [0.6, 1.4, -1.6]
  },
  esp32_lcd: {
    id: 'esp32_lcd',
    stepNumber: 6,
    title: 'ESP32 Controller & 16×2 I2C LCD',
    subtitle: 'Embedded Telemetry Node · 5-Page Display · SoftAP',
    gpioPin: 'SDA: GPIO 21 · SCL: GPIO 22 · Buzzer: GPIO 25 · BOOT: GPIO 0',
    roleSummary:
      'Onboard ESP32-WROOM-32 executes depletion modeling, drives the auto-scanned 0x27/0x3F 16×2 character LCD, sounds alarms, and bridges Web/Android clients.',
    designRationale:
      'Zero cloud dependency ensures continuous bedside visibility and alarm generation even in offline clinical or transit environments.',
    technicalSpecs: [
      'Automatic I2C bus scan (0x27 / 0x3F @ 100 kHz) with custom CGRAM glyphs',
      'Offline SoftAP ("OXYSYNC-AP" @ 192.168.4.1) + WebSocket & REST API',
      'GPIO 25 piezo alarm pulses at 2 Hz (Critical) or 0.5 Hz (Warning)'
    ],
    cameraPos: [3.2, 3.2, 5.2],
    cameraTarget: [2.2, 1.1, 1.7]
  },
  patient_pod: {
    id: 'patient_pod',
    stepNumber: 7,
    title: 'Patient Cannula & Respiratory Pod',
    subtitle: 'Simulated Lung Compliance · SpO₂ & Pulse Sync',
    gpioPin: 'Target SpO₂: 94–99% · Critical < 90%',
    roleSummary:
      'Renders breathing frequency synced to respiratory rate, cardiac pulse wave ring, and color state changes during hypoxemic excursions.',
    designRationale:
      'Links upstream tank pressure directly to downstream physiological status so operators see the clinical consequence of interrupted flow.',
    technicalSpecs: [
      'Delta-smoothed lung expansion synced to respiratory rate',
      'Pulse wave ring locked to simulated heart rate BPM',
      'Coupled to IEC 60601-1-8 alarm cadence and mobile alerts'
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
