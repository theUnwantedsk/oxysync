export type SourceType = 'cylinder' | 'concentrator';

export type TitrationMode = 'auto' | 'manual';

export type AlarmSeverity = 'critical' | 'warning' | 'info';

export interface VitalsData {
  spo2: number;               // 0 - 100 %
  pulseRate: number;          // 30 - 220 BPM
  perfusionIndex: number;     // 0.1 - 20.0 %
  respiratoryRate: number;    // breaths per minute (10 - 40)
  plethWaveform: number[];    // recent normalized PPG samples
  lastUpdated: string;
}

export interface OxygenSupply {
  sourceType: SourceType;
  flowRate: number;                 // Liters per minute (L/min, 0.0 - 10.0)
  pressurePsi: number;              // Cylinder pressure (0 - 2200 PSI)
  pressureBar: number;              // Calculated bar
  tankWaterCapacityLiters: number;  // Standard D/E cylinder = 4.4L or 680L gas capacity
  remainingGasLiters: number;       // Gas remaining = (pressure / 14.7) * water capacity
  remainingRuntimeMinutes: number;  // Remaining minutes at current flow rate
  cylinderPercent: number;          // 0 - 100%
  valvePositionPercent: number;     // 0 - 100% actuator opening
}

export interface DoctorPrescription {
  isLocked: boolean;
  passcode: string;                 // Default '1234'
  prescribedBy: string;
  prescribedAt: string;
  targetSpo2Min: number;            // e.g. 92%
  targetSpo2Max: number;            // e.g. 96%
  minAllowedFlow: number;           // e.g. 1.0 L/min
  maxAllowedFlow: number;           // e.g. 5.0 L/min
  titrationMode: TitrationMode;
  notes: string;
}

export interface AlertItem {
  id: string;
  severity: AlarmSeverity;
  title: string;
  message: string;
  timestamp: string;
  acknowledged: boolean;
  type: 'hypoxemia' | 'severe_hypoxemia' | 'tachycardia' | 'bradycardia' | 'tank_low' | 'tank_exhausted' | 'cannula_disconnect' | 'sensor_fault' | 'valve_limit';
}

export interface DeviceStatus {
  connected: boolean;
  batteryLevel: number;             // 0 - 100 %
  esp32Status: 'online' | 'offline' | 'pairing';
  cannulaAttached: boolean;
  sensorFault: boolean;
  bluetoothConnected: boolean;
  wifiSignalDbm: number;            // -90 to -30 dBm
}

export type SimulationScenario = 
  | 'normal'
  | 'hypoxemia'
  | 'exertion'
  | 'low_tank'
  | 'cannula_drop'
  | 'valve_limit';
