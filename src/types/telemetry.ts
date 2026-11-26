// OXYSYNC 2.0 Next-Gen Medical Mechatronics Telemetry Type System
// All vitals, supply levels, valve states, and telemetry packets are simulated.

export type ActiveSupplySource = 'primary' | 'secondary' | 'reserve' | 'none';

export type CylinderStatus = 
  | 'active'
  | 'standby'
  | 'low'
  | 'empty'
  | 'refilling'
  | 'disconnected';

export interface CylinderState {
  id: 'primary' | 'secondary';
  name: string;
  waterCapacityLiters: number;      // e.g., 4.4L for standard D/E size
  maxPressureBar: number;           // e.g., 150 bar
  currentPressureBar: number;       // 0 - 150 bar
  pressurePsi: number;              // Calculated PSI (bar * 14.5038)
  remainingGasLiters: number;       // V = P * V_water (Liters NTP)
  percentRemaining: number;         // 0 - 100%
  status: CylinderStatus;
  connected: boolean;
  remainingMinutes: number;         // Runtime at current flow rate
  remainingSecondsExact: number;    // Sub-second precision
  valveOpen: boolean;
  temperatureC: number;             // Ambient temperature (20.0°C)
}

export interface ReserveBufferState {
  capacityLiters: number;           // e.g., 12.5L
  currentGasLiters: number;         // Remaining gas in buffer
  percentRemaining: number;         // 0 - 100%
  remainingSeconds: number;         // Calculated seconds remaining
  targetDurationMinutes: number;    // 5.0 minutes design target
  isActive: boolean;                // Engaged when primary & secondary fail
  isRefilling: boolean;             // Refilling from active supply via bleed valve
  valveOpen: boolean;
  rechargePressureBar: number;      // Accumulator pressure (up to 30 bar)
  disclaimer: string;
}

export type PatientStatus = 'stable' | 'borderline' | 'hypoxemic' | 'critical';

export interface VitalsData {
  spo2: number;                     // Simulated 0 - 100%
  pulseRate: number;                // Simulated 40 - 200 BPM
  perfusionIndex: number;           // Simulated 0.1 - 20.0%
  respiratoryRate: number;          // Simulated breaths per minute (10 - 40)
  etco2Mmhg: number;                // End-tidal CO2 (30 - 45 mmHg)
  plethWaveform: number[];          // 60-sample normalized PPG buffer
  ecgWaveform: number[];            // 60-sample Lead II ECG buffer
  capnoWaveform: number[];          // 60-sample EtCO2 waveform buffer
  patientStatus: PatientStatus;
  lastUpdated: string;
  isSimulated: true;                // Explicit badge indicator
}

export type SystemOperatingMode = 
  | 'auto'
  | 'manual'
  | 'emergency_reserve'
  | 'failover'
  | 'depleted';

export interface SwitchingEvent {
  id: string;
  timestamp: string;
  fromSource: ActiveSupplySource;
  toSource: ActiveSupplySource;
  reason: string;
  triggerType: 'auto_threshold' | 'manual_override' | 'primary_depletion' | 'emergency_failover' | 'restoration';
  primaryPercent: number;
  secondaryPercent: number;
  reservePercent: number;
  manifoldPressureBar: number;
}

export type AlarmSeverity = 'critical' | 'warning' | 'advisory';

export type AlertType = 
  | 'primary_low'
  | 'primary_empty'
  | 'secondary_low'
  | 'secondary_empty'
  | 'auto_switched'
  | 'reserve_active'
  | 'all_supplies_depleted'
  | 'low_spo2'
  | 'severe_hypoxemia'
  | 'cannula_disconnect'
  | 'restored';

export interface AlertItem {
  id: string;
  severity: AlarmSeverity;
  title: string;
  message: string;
  timestamp: string;
  acknowledged: boolean;
  source: string;
  type: AlertType;
  isSimulated: true;
}

export interface PredictionData {
  flowRateLpm: number;
  primaryDepletionMinutes: number;
  primaryDepletionTimeStr: string;
  secondaryDepletionMinutes: number;
  secondaryDepletionTimeStr: string;
  reserveDepletionSeconds: number;
  totalSystemMinutes: number;
  totalSystemDepletionTimeStr: string;
  predictedSwitchTimeStr: string;
  totalSecondsRemaining: number;
  formattedCountdown: string;       // e.g. "08:42:15.3"
  formula: string;
  vanDerWaalsCorrection: string;
  assumptions: string[];
}

export type EmergencyScenarioId = 
  | 'normal'
  | 'primary_empty'
  | 'auto_switch'
  | 'low_spo2'
  | 'backup_empty'
  | 'both_unavailable'
  | 'reserve_active'
  | 'restoration';

export interface ScenarioDefinition {
  id: EmergencyScenarioId;
  stepNumber: number;
  title: string;
  subtitle: string;
  badge: string;
  whatHappened: string;
  whyItHappened: string;
  systemResponse: string;
  sequenceSteps: string[];
}

export interface SystemSettings {
  simulationSpeed: number;          // 0.5, 1, 2, 5, 10, 30, 60
  switchingThresholdPercent: number; // 5% - 25% (default 10%)
  flowRateLpm: number;              // 0.5 - 15.0 L/min
  primaryWaterCapacity: number;     // e.g. 4.4L
  secondaryWaterCapacity: number;   // e.g. 4.4L
  reserveCapacityLiters: number;    // e.g. 12.5L
  soundEnabled: boolean;
  audioVolume: number;              // 0.0 - 1.0
  pulseOximeterBeepEnabled: boolean;// Hospital QRS pitch sound
  autoSwitchEnabled: boolean;
  sweepSpeedMmPerSec: number;       // 12.5, 25, 50 mm/s
}

export interface CaregiverNotification {
  id: string;
  title: string;
  body: string;
  severity: AlarmSeverity;
  timestamp: string;
  actionRequired: string;
}

export interface TelemetryPacket {
  packetId: number;
  timestamp: string;
  primaryBar: number;
  secondaryBar: number;
  reserveGasLiters: number;
  manifoldPressureBar: number;
  flowRateSccm: number;
  solenoidStateByte: string;        // "0x01" (V1 open), "0x02" (V2 open), "0x04" (VR open)
  spo2Percent: number;
  heartRateBpm: number;
  crc16: string;
  rawHex: string;
}

export type UsbConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface Esp32CylinderPayload {
  pressureBar: number;
  remainingLiters: number;
  percentage: number;
  isConnected: boolean;
  isActive: boolean;
}

export interface Esp32ReservePayload {
  remainingLiters: number;
  percentage: number;
  remainingSeconds: number;
  isActive: boolean;
  isRecharging: boolean;
}

export interface Esp32VitalsPayload {
  spo2: number;
  pulseRate: number;
  respirationRate: number;
  perfusionIndex: number;
}

export interface Esp32TelemetryPayload {
  type?: string;
  transport?: string;
  protocol?: string;
  lcdReady?: boolean;
  lcdAddress?: string;
  timestamp: number;
  operatingMode: string;
  activeSource: 'PRIMARY' | 'BACKUP' | 'RESERVE' | 'NONE';
  flowRateLpm: number;
  simSpeed: number;
  switchThresholdPct: number;
  estRemainingMinutes: number;
  alertSeverity: 'NORMAL' | 'INFO' | 'WARNING' | 'CRITICAL';
  activeAlertMessage: string;
  activeScenarioId: number;
  scenarioExplanation: string;
  primary: Esp32CylinderPayload;
  backup: Esp32CylinderPayload;
  reserve: Esp32ReservePayload;
  vitals: Esp32VitalsPayload;
}

export interface UsbSerialLogEntry {
  id: number;
  timestamp: string;
  direction: 'rx' | 'tx' | 'sys';
  raw: string;
}
