import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  ActiveSupplySource,
  CylinderState,
  ReserveBufferState,
  VitalsData,
  SystemOperatingMode,
  SwitchingEvent,
  AlertItem,
  PredictionData,
  EmergencyScenarioId,
  ScenarioDefinition,
  SystemSettings,
  CaregiverNotification,
  TelemetryPacket,
  UsbConnectionStatus,
  UsbSerialLogEntry
} from '../types/telemetry';
import { audioAlert } from '../services/audioAlert';
import { SCENARIO_DEFINITIONS } from '../services/scenarioData';
import {
  calculateRuntimeMinutes,
  formatDepletionTimestamp,
  formatPrecisionCountdown,
  BAR_TO_PSI
} from '../services/physicsEngine';
import {
  esp32Sync,
  Esp32ConnectionState,
  Esp32TelemetryPayload,
  ESP32_TO_SCENARIO_ID,
  SCENARIO_ID_TO_ESP32
} from '../services/esp32Sync';
import { usbSerialBridge } from '../services/usbSerialBridge';

interface TelemetryContextType {
  // Precision Timing State
  therapyElapsedSeconds: number;
  therapyElapsedFormatted: string;
  sessionStartTime: string;
  lastScenarioUpdatedAt: string;

  // ESP32 Live Tri-Device Sync State (Wi-Fi + USB Serial)
  esp32Host: string;
  esp32SyncEnabled: boolean;
  esp32ConnectionState: Esp32ConnectionState;
  esp32LastError: string | null;
  connectEsp32: (host: string) => void;
  disconnectEsp32: () => void;
  usbSupported: boolean;
  usbStatus: UsbConnectionStatus;
  usbError: string | null;
  usbLastPacketAt: string | null;
  usbLcdStatus: { ready: boolean; address: string } | null;
  usbRawLogs: UsbSerialLogEntry[];
  connectUsbEsp32: () => Promise<void>;
  disconnectUsbEsp32: () => Promise<void>;
  sendUsbCommand: (command: Record<string, unknown>) => Promise<boolean>;
  clearUsbLogs: () => void;

  // System State
  vitals: VitalsData;
  primaryCylinder: CylinderState;
  secondaryCylinder: CylinderState;
  reserveBuffer: ReserveBufferState;
  activeSource: ActiveSupplySource;
  systemMode: SystemOperatingMode;
  switchingHistory: SwitchingEvent[];
  alerts: AlertItem[];
  activeScenario: ScenarioDefinition;
  scenarioHistory: ScenarioDefinition[];
  settings: SystemSettings;
  predictions: PredictionData;
  caregiverNotifications: CaregiverNotification[];
  telemetryPackets: TelemetryPacket[];
  isMuted: boolean;
  snoozeRemaining: number;
  theme: 'light' | 'dark';

  // Actions
  toggleTheme: () => void;
  triggerScenario: (scenarioId: EmergencyScenarioId) => void;
  resetSimulation: () => void;
  switchActiveSource: (
    source: ActiveSupplySource,
    reason?: string,
    triggerType?: SwitchingEvent['triggerType'],
    percentOverrides?: { primaryPercent?: number; secondaryPercent?: number; reservePercent?: number }
  ) => void;
  setFlowRate: (flowRateLpm: number) => void;
  setSimulationSpeed: (speed: number) => void;
  jumpTimeForwardMinutes: (minutes: number) => void;
  setSwitchingThreshold: (thresholdPercent: number) => void;
  refillCylinder: (target: 'primary' | 'secondary' | 'all') => void;
  toggleCylinderConnection: (target: 'primary' | 'secondary') => void;
  updateSettings: (newSettings: Partial<SystemSettings>) => void;
  acknowledgeAlert: (alertId: string) => void;
  acknowledgeAllAlerts: () => void;
  clearAllAlerts: () => void;
  toggleMute: () => void;
  togglePulseOximeterSound: () => void;
  snoozeAlarms: () => void;
  requestBrowserNotification: () => Promise<boolean>;
  sendDemoNotification: (title: string, body: string) => void;
}

const TelemetryContext = createContext<TelemetryContextType | null>(null);

const DEFAULT_SETTINGS: SystemSettings = {
  simulationSpeed: 1,
  switchingThresholdPercent: 10,
  flowRateLpm: 2.5,
  primaryWaterCapacity: 4.4,
  secondaryWaterCapacity: 4.4,
  reserveCapacityLiters: 12.5,
  soundEnabled: true,
  audioVolume: 0.8,
  pulseOximeterBeepEnabled: true,
  autoSwitchEnabled: true,
  sweepSpeedMmPerSec: 25
};

function advanceVitalsWaveforms(prev: VitalsData): VitalsData {
  const nextPleth = prev.plethWaveform.slice(1);
  const nextEcg = prev.ecgWaveform.slice(1);
  const nextCapno = prev.capnoWaveform.slice(1);

  const t = Date.now() / 1000;
  const hrFreq = (prev.pulseRate / 60) * 2 * Math.PI;
  const plethSample = 0.5 + 0.35 * Math.sin(t * hrFreq) + 0.12 * Math.sin(t * hrFreq * 2 + 0.5);
  nextPleth.push(Math.max(0.05, Math.min(0.95, plethSample)));

  const phase = (t * (prev.pulseRate / 60)) % 1;
  let ecgSample = 0.5;
  if (phase < 0.1) ecgSample = 0.5 + 0.08 * Math.sin(phase * 10 * Math.PI);
  else if (phase >= 0.12 && phase < 0.14) ecgSample = 0.42;
  else if (phase >= 0.14 && phase < 0.18) ecgSample = 0.95;
  else if (phase >= 0.18 && phase < 0.22) ecgSample = 0.35;
  else if (phase >= 0.28 && phase < 0.45) ecgSample = 0.5 + 0.14 * Math.sin(((phase - 0.28) / 0.17) * Math.PI);
  nextEcg.push(ecgSample);

  const respPhase = (t * (prev.respiratoryRate / 60)) % 1;
  nextCapno.push(respPhase < 0.5 ? 0.85 : 0.1);

  return {
    ...prev,
    plethWaveform: nextPleth,
    ecgWaveform: nextEcg,
    capnoWaveform: nextCapno,
    lastUpdated: new Date().toLocaleTimeString()
  };
}

function buildTelemetryPacket(
  pktId: number,
  primaryBar: number,
  secondaryBar: number,
  reserveGasLiters: number,
  flowRateLpm: number,
  activeSource: ActiveSupplySource,
  spo2: number,
  pulseRate: number
): TelemetryPacket {
  const solByte =
    activeSource === 'primary'
      ? '0x01'
      : activeSource === 'secondary'
      ? '0x02'
      : activeSource === 'reserve'
      ? '0x04'
      : '0x00';
  const p1 = Math.round(primaryBar * 10) / 10;
  const p2 = Math.round(secondaryBar * 10) / 10;
  const sccm = Math.round(flowRateLpm * 1000);
  const crcHex = `0x${((pktId * 17 + Math.round(p1 * 10)) & 0xffff).toString(16).toUpperCase().padStart(4, '0')}`;

  return {
    packetId: pktId,
    timestamp: new Date().toLocaleTimeString(),
    primaryBar: p1,
    secondaryBar: p2,
    reserveGasLiters: Math.round(reserveGasLiters * 10) / 10,
    manifoldPressureBar: activeSource === 'none' ? 0.0 : 3.5,
    flowRateSccm: sccm,
    solenoidStateByte: solByte,
    spo2Percent: Math.round(spo2 * 10) / 10,
    heartRateBpm: pulseRate,
    crc16: crcHex,
    rawHex: `AA 55 ${pktId.toString(16).padStart(4, '0')} ${Math.round(p1).toString(16).padStart(2, '0')} ${Math.round(p2).toString(16).padStart(2, '0')} ${solByte.slice(2)} ${crcHex.slice(2)}`
  };
}

function mapEsp32Source(src: Esp32TelemetryPayload['activeSource']): ActiveSupplySource {
  switch (src) {
    case 'PRIMARY':
      return 'primary';
    case 'BACKUP':
      return 'secondary';
    case 'RESERVE':
      return 'reserve';
    default:
      return 'none';
  }
}

function mapEsp32Mode(mode: string): SystemOperatingMode {
  switch (mode) {
    case 'EMERGENCY_BUFFER':
      return 'emergency_reserve';
    case 'MANUAL_PRIMARY':
    case 'MANUAL_BACKUP':
      return 'manual';
    default:
      return 'auto';
  }
}

export const TelemetryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SystemSettings>(() => {
    try {
      const saved = localStorage.getItem('oxysync_2_settings');
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch {
      // Fallback to defaults
    }
    return DEFAULT_SETTINGS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('oxysync_2_settings', JSON.stringify(settings));
    } catch {
      // Ignore storage errors
    }
  }, [settings]);

  const [therapyElapsedSeconds, setTherapyElapsedSeconds] = useState<number>(0);
  const sessionStartTimeRef = useRef<string>(new Date().toLocaleTimeString());
  const [lastScenarioUpdatedAt, setLastScenarioUpdatedAt] = useState<string>(new Date().toLocaleTimeString());
  const packetIdRef = useRef<number>(1001);

  // ESP32 live sync state
  const [esp32Host, setEsp32Host] = useState<string>(() => {
    try {
      return localStorage.getItem('oxysync_esp32_host') || '192.168.4.1';
    } catch {
      return '192.168.4.1';
    }
  });
  const [esp32SyncEnabled, setEsp32SyncEnabled] = useState<boolean>(false);
  const [esp32ConnectionState, setEsp32ConnectionState] = useState<Esp32ConnectionState>('disconnected');
  const [esp32LastError, setEsp32LastError] = useState<string | null>(null);

  const [vitals, setVitals] = useState<VitalsData>({
    spo2: 98,
    pulseRate: 72,
    perfusionIndex: 4.6,
    respiratoryRate: 16,
    etco2Mmhg: 38,
    plethWaveform: Array(60).fill(0.5),
    ecgWaveform: Array(60).fill(0.5),
    capnoWaveform: Array(60).fill(0.5),
    patientStatus: 'stable',
    lastUpdated: new Date().toLocaleTimeString(),
    isSimulated: true
  });

  const [primaryCylinder, setPrimaryCylinder] = useState<CylinderState>({
    id: 'primary',
    name: 'Primary Cylinder (A-1)',
    waterCapacityLiters: settings.primaryWaterCapacity,
    maxPressureBar: 150,
    currentPressureBar: 135,
    pressurePsi: Math.round(135 * BAR_TO_PSI),
    remainingGasLiters: 135 * settings.primaryWaterCapacity,
    percentRemaining: 90,
    status: 'active',
    connected: true,
    remainingMinutes: Math.round((135 * settings.primaryWaterCapacity) / settings.flowRateLpm),
    remainingSecondsExact: ((135 * settings.primaryWaterCapacity) / settings.flowRateLpm) * 60,
    valveOpen: true,
    temperatureC: 20.0
  });

  const [secondaryCylinder, setSecondaryCylinder] = useState<CylinderState>({
    id: 'secondary',
    name: 'Backup Cylinder (B-2)',
    waterCapacityLiters: settings.secondaryWaterCapacity,
    maxPressureBar: 150,
    currentPressureBar: 150,
    pressurePsi: Math.round(150 * BAR_TO_PSI),
    remainingGasLiters: 150 * settings.secondaryWaterCapacity,
    percentRemaining: 100,
    status: 'standby',
    connected: true,
    remainingMinutes: Math.round((150 * settings.secondaryWaterCapacity) / settings.flowRateLpm),
    remainingSecondsExact: ((150 * settings.secondaryWaterCapacity) / settings.flowRateLpm) * 60,
    valveOpen: false,
    temperatureC: 20.0
  });

  const [reserveBuffer, setReserveBuffer] = useState<ReserveBufferState>({
    capacityLiters: settings.reserveCapacityLiters,
    currentGasLiters: settings.reserveCapacityLiters,
    percentRemaining: 100,
    remainingSeconds: Math.round((settings.reserveCapacityLiters / settings.flowRateLpm) * 60),
    targetDurationMinutes: 5.0,
    isActive: false,
    isRefilling: false,
    valveOpen: false,
    rechargePressureBar: 28.5,
    disclaimer: 'Design target: 5-minute temporary continuity buffer. Requires clinical validation in hardware.'
  });

  const [activeSource, setActiveSource] = useState<ActiveSupplySource>('primary');
  const [systemMode, setSystemMode] = useState<SystemOperatingMode>('auto');
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [switchingHistory, setSwitchingHistory] = useState<SwitchingEvent[]>([
    {
      id: 'init-1',
      timestamp: new Date().toLocaleTimeString(),
      fromSource: 'none',
      toSource: 'primary',
      reason: 'System Initialized into Auto-Supply Mode',
      triggerType: 'restoration',
      primaryPercent: 90,
      secondaryPercent: 100,
      reservePercent: 100,
      manifoldPressureBar: 3.5
    }
  ]);

  const [activeScenario, setActiveScenario] = useState<ScenarioDefinition>(SCENARIO_DEFINITIONS.normal);
  const [scenarioHistory, setScenarioHistory] = useState<ScenarioDefinition[]>([SCENARIO_DEFINITIONS.normal]);
  const [caregiverNotifications, setCaregiverNotifications] = useState<CaregiverNotification[]>([
    {
      id: 'notif-1',
      title: 'OXYSYNC 2.0 Telemetry Stream Active',
      body: 'Continuous oxygen monitoring running. Primary cylinder at 90%.',
      severity: 'advisory',
      timestamp: new Date().toLocaleTimeString(),
      actionRequired: 'Routine monitoring'
    }
  ]);

  const [telemetryPackets, setTelemetryPackets] = useState<TelemetryPacket[]>([]);
  const [isMuted, setIsMuted] = useState<boolean>(!settings.soundEnabled);
  const [snoozeRemaining, setSnoozeRemaining] = useState<number>(0);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('oxysync_2_theme');
      if (saved === 'dark' || saved === 'light') return saved;
    } catch {
      // Ignore storage error
    }
    return 'light';
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.classList.toggle('dark', theme === 'dark');
    try {
      localStorage.setItem('oxysync_2_theme', theme);
    } catch {
      // Ignore storage error
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  // Real-time ESP32 USB Serial Bridge State
  const usbSupported = usbSerialBridge.isSupported();
  const [usbStatus, setUsbStatus] = useState<UsbConnectionStatus>('disconnected');
  const [usbError, setUsbError] = useState<string | null>(null);
  const [usbLastPacketAt, setUsbLastPacketAt] = useState<string | null>(null);
  const [usbLcdStatus, setUsbLcdStatus] = useState<{ ready: boolean; address: string } | null>(null);
  const [usbRawLogs, setUsbRawLogs] = useState<UsbSerialLogEntry[]>([]);
  const usbLogIdRef = useRef<number>(1);

  // Latest-state ref so the 1 Hz simulation loop never tears down on telemetry ticks
  const stateRef = useRef({
    settings,
    vitals,
    primaryCylinder,
    secondaryCylinder,
    reserveBuffer,
    activeSource,
    isMuted,
    esp32SyncEnabled,
    esp32ConnectionState,
    usbStatus
  });
  stateRef.current = {
    settings,
    vitals,
    primaryCylinder,
    secondaryCylinder,
    reserveBuffer,
    activeSource,
    isMuted,
    esp32SyncEnabled,
    esp32ConnectionState,
    usbStatus
  };

  // Sync water/reserve capacities cleanly when SettingsView updates tank sizes
  useEffect(() => {
    setPrimaryCylinder((prev) => {
      if (prev.waterCapacityLiters === settings.primaryWaterCapacity) return prev;
      const nextGas = prev.currentPressureBar * settings.primaryWaterCapacity;
      return {
        ...prev,
        waterCapacityLiters: settings.primaryWaterCapacity,
        remainingGasLiters: nextGas,
        remainingMinutes: Math.round(calculateRuntimeMinutes(nextGas, settings.flowRateLpm)),
        remainingSecondsExact: Math.max(0, (nextGas / settings.flowRateLpm) * 60)
      };
    });
  }, [settings.primaryWaterCapacity, settings.flowRateLpm]);

  useEffect(() => {
    setSecondaryCylinder((prev) => {
      if (prev.waterCapacityLiters === settings.secondaryWaterCapacity) return prev;
      const nextGas = prev.currentPressureBar * settings.secondaryWaterCapacity;
      return {
        ...prev,
        waterCapacityLiters: settings.secondaryWaterCapacity,
        remainingGasLiters: nextGas,
        remainingMinutes: Math.round(calculateRuntimeMinutes(nextGas, settings.flowRateLpm)),
        remainingSecondsExact: Math.max(0, (nextGas / settings.flowRateLpm) * 60)
      };
    });
  }, [settings.secondaryWaterCapacity, settings.flowRateLpm]);

  useEffect(() => {
    setReserveBuffer((prev) => {
      if (prev.capacityLiters === settings.reserveCapacityLiters) return prev;
      const ratio = prev.capacityLiters > 0 ? prev.currentGasLiters / prev.capacityLiters : 1;
      const nextGas = Math.min(settings.reserveCapacityLiters, ratio * settings.reserveCapacityLiters);
      return {
        ...prev,
        capacityLiters: settings.reserveCapacityLiters,
        currentGasLiters: nextGas,
        percentRemaining: Math.round((nextGas / settings.reserveCapacityLiters) * 100),
        remainingSeconds: Math.round((nextGas / settings.flowRateLpm) * 60)
      };
    });
  }, [settings.reserveCapacityLiters, settings.flowRateLpm]);

  // Sync Audio Settings
  useEffect(() => {
    audioAlert.setVolume(settings.audioVolume);
    audioAlert.setMuted(!settings.soundEnabled || isMuted);
    audioAlert.setPulseOximeterSound(settings.pulseOximeterBeepEnabled);
  }, [settings.audioVolume, settings.soundEnabled, settings.pulseOximeterBeepEnabled, isMuted]);

  // Audio Alarms Loop Effect
  useEffect(() => {
    const unacknowledged = alerts.filter((a) => !a.acknowledged);
    const critical = unacknowledged.find((a) => a.severity === 'critical');
    const warning = unacknowledged.find((a) => a.severity === 'warning');

    if (critical) {
      audioAlert.triggerAlarmLoop('critical');
    } else if (warning) {
      audioAlert.triggerAlarmLoop('warning');
    } else {
      audioAlert.stopAlarm();
    }
  }, [alerts]);

  // Snooze Ticker
  useEffect(() => {
    const interval = window.setInterval(() => {
      setSnoozeRemaining(audioAlert.getSnoozeRemainingSeconds());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const activeAlertTypesRef = useRef<Set<string>>(new Set());

  const addAlert = useCallback(
    (
      severity: AlertItem['severity'],
      title: string,
      message: string,
      type: AlertItem['type'],
      source: string = 'OXYSYNC Control Engine'
    ) => {
      const dedupeKey = `${type}:${title}`;
      if (activeAlertTypesRef.current.has(dedupeKey)) {
        return;
      }
      activeAlertTypesRef.current.add(dedupeKey);

      const id = `alert-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const timestamp = new Date().toLocaleTimeString();

      setAlerts((prev) => {
        if (prev.some((a) => a.type === type && !a.acknowledged)) return prev;
        return [
          {
            id,
            severity,
            title,
            message,
            timestamp,
            acknowledged: false,
            source,
            type,
            isSimulated: true
          },
          ...prev.slice(0, 49)
        ];
      });

      setCaregiverNotifications((prev) => [
        {
          id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          title,
          body: message,
          severity,
          timestamp,
          actionRequired: severity === 'critical' ? 'Immediate Attendant Action Required' : 'Review Supply Status'
        },
        ...prev.slice(0, 29)
      ]);
    },
    []
  );

  // Keep activeAlertTypesRef synchronized whenever alerts are acknowledged/cleared
  useEffect(() => {
    const active = new Set<string>();
    for (const a of alerts) {
      if (!a.acknowledged) {
        active.add(`${a.type}:${a.title}`);
      }
    }
    activeAlertTypesRef.current = active;
  }, [alerts]);

  const lastEsp32SourceRef = useRef<ActiveSupplySource>('primary');
  const lastEsp32ScenarioRef = useRef<number>(1);

  const applyEsp32Telemetry = useCallback(
    (pkt: Esp32TelemetryPayload) => {
      const mappedSource = mapEsp32Source(pkt.activeSource);
      const mappedMode = mapEsp32Mode(pkt.operatingMode);
      const flow = pkt.flowRateLpm > 0 ? pkt.flowRateLpm : 5.0;

      setActiveSource(mappedSource);
      setSystemMode(mappedMode);
      setSettings((s) => {
        const nextSpeed = pkt.simSpeed || s.simulationSpeed;
        const nextThresh = pkt.switchThresholdPct || s.switchingThresholdPercent;
        if (
          s.flowRateLpm === flow &&
          s.simulationSpeed === nextSpeed &&
          s.switchingThresholdPercent === nextThresh
        ) {
          return s;
        }
        return {
          ...s,
          flowRateLpm: flow,
          simulationSpeed: nextSpeed,
          switchingThresholdPercent: nextThresh
        };
      });

      if (pkt.lcdAddress !== undefined || pkt.lcdReady !== undefined) {
        setUsbLcdStatus({
          ready: Boolean(pkt.lcdReady),
          address: pkt.lcdAddress || '0x27'
        });
      }

      setPrimaryCylinder((prev) => {
        const capL = prev.maxPressureBar * prev.waterCapacityLiters;
        const bar = Math.round(pkt.primary.pressureBar * 10) / 10;
        const pct = Math.max(0, Math.min(100, Math.round(pkt.primary.percentage)));
        return {
          ...prev,
          currentPressureBar: bar,
          pressurePsi: Math.round(bar * BAR_TO_PSI),
          remainingGasLiters: pkt.primary.remainingLiters,
          percentRemaining: pct,
          connected: pkt.primary.isConnected,
          valveOpen: mappedSource === 'primary',
          remainingMinutes: Math.round(calculateRuntimeMinutes(pkt.primary.remainingLiters, flow)),
          remainingSecondsExact: Math.max(0, (pkt.primary.remainingLiters / flow) * 60),
          status: !pkt.primary.isConnected
            ? 'disconnected'
            : pct <= 0
            ? 'empty'
            : mappedSource === 'primary'
            ? pct <= (pkt.switchThresholdPct || 15)
              ? 'low'
              : 'active'
            : capL > 0
            ? 'standby'
            : 'empty'
        };
      });

      setSecondaryCylinder((prev) => {
        const bar = Math.round(pkt.backup.pressureBar * 10) / 10;
        const pct = Math.max(0, Math.min(100, Math.round(pkt.backup.percentage)));
        return {
          ...prev,
          currentPressureBar: bar,
          pressurePsi: Math.round(bar * BAR_TO_PSI),
          remainingGasLiters: pkt.backup.remainingLiters,
          percentRemaining: pct,
          connected: pkt.backup.isConnected,
          valveOpen: mappedSource === 'secondary',
          remainingMinutes: Math.round(calculateRuntimeMinutes(pkt.backup.remainingLiters, flow)),
          remainingSecondsExact: Math.max(0, (pkt.backup.remainingLiters / flow) * 60),
          status: !pkt.backup.isConnected
            ? 'disconnected'
            : pct <= 0
            ? 'empty'
            : mappedSource === 'secondary'
            ? pct <= 10
              ? 'low'
              : 'active'
            : 'standby'
        };
      });

      setReserveBuffer((prev) => ({
        ...prev,
        currentGasLiters: pkt.reserve.remainingLiters,
        percentRemaining: Math.max(0, Math.min(100, Math.round(pkt.reserve.percentage))),
        remainingSeconds: Math.max(0, Math.round(pkt.reserve.remainingSeconds)),
        isActive: pkt.reserve.isActive,
        isRefilling: pkt.reserve.isRecharging,
        valveOpen: pkt.reserve.isActive
      }));

      setVitals((prev) => ({
        ...advanceVitalsWaveforms(prev),
        spo2: Math.round(pkt.vitals.spo2 * 10) / 10,
        pulseRate: pkt.vitals.pulseRate,
        respirationRate: pkt.vitals.respirationRate,
        perfusionIndex: Math.round(pkt.vitals.perfusionIndex * 10) / 10,
        patientStatus:
          pkt.vitals.spo2 < 88
            ? 'critical'
            : pkt.vitals.spo2 < 92
            ? 'hypoxemic'
            : pkt.vitals.spo2 < 95
            ? 'borderline'
            : 'stable'
      }));

      packetIdRef.current += 1;
      const frame = buildTelemetryPacket(
        packetIdRef.current,
        pkt.primary.pressureBar,
        pkt.backup.pressureBar,
        pkt.reserve.remainingLiters,
        flow,
        mappedSource,
        pkt.vitals.spo2,
        pkt.vitals.pulseRate
      );
      setTelemetryPackets((prev) => [frame, ...prev.slice(0, 19)]);

      if (mappedSource !== lastEsp32SourceRef.current) {
        const prevSrc = lastEsp32SourceRef.current;
        lastEsp32SourceRef.current = mappedSource;
        setSwitchingHistory((prev) => [
          {
            id: `esp32-sw-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString(),
            fromSource: prevSrc,
            toSource: mappedSource,
            reason: pkt.activeAlertMessage || 'ESP32 Hardware Failover Sync',
            triggerType: mappedSource === 'reserve' ? 'emergency_failover' : 'auto_threshold',
            primaryPercent: Math.round(pkt.primary.percentage),
            secondaryPercent: Math.round(pkt.backup.percentage),
            reservePercent: Math.round(pkt.reserve.percentage),
            manifoldPressureBar: mappedSource === 'none' ? 0 : 3.5
          },
          ...prev.slice(0, 49)
        ]);
      }

      const scenKey = ESP32_TO_SCENARIO_ID[pkt.activeScenarioId];
      if (scenKey && pkt.activeScenarioId !== lastEsp32ScenarioRef.current) {
        lastEsp32ScenarioRef.current = pkt.activeScenarioId;
        const sc = SCENARIO_DEFINITIONS[scenKey];
        setActiveScenario(sc);
        setScenarioHistory((prev) => [sc, ...prev.slice(0, 19)]);
        setLastScenarioUpdatedAt(new Date().toLocaleTimeString());
      }

      if (pkt.alertSeverity === 'CRITICAL') {
        addAlert('critical', 'ESP32 Critical Alert', pkt.activeAlertMessage, 'severe_hypoxemia', 'ESP32 Controller');
      } else if (pkt.alertSeverity === 'WARNING') {
        addAlert('warning', 'ESP32 Supply Warning', pkt.activeAlertMessage, 'primary_low', 'ESP32 Controller');
      }
    },
    [addAlert]
  );

  const appendUsbLog = useCallback((direction: UsbSerialLogEntry['direction'], raw: string) => {
    usbLogIdRef.current += 1;
    const entry: UsbSerialLogEntry = {
      id: usbLogIdRef.current,
      timestamp: new Date().toLocaleTimeString(),
      direction,
      raw
    };
    setUsbRawLogs((prev) => [entry, ...prev.slice(0, 79)]);
  }, []);

  const connectEsp32 = useCallback(
    (host: string) => {
      if (stateRef.current.usbStatus === 'connected') {
        void usbSerialBridge.disconnect();
      }
      const cleanHost = host.trim() || '192.168.4.1';
      setEsp32Host(cleanHost);
      try {
        localStorage.setItem('oxysync_esp32_host', cleanHost);
      } catch {
        // Ignore storage error
      }
      setEsp32SyncEnabled(true);
      setEsp32LastError(null);
      esp32Sync.connect(cleanHost, {
        onTelemetry: applyEsp32Telemetry,
        onStateChange: (state, err) => {
          setEsp32ConnectionState(state);
          setEsp32LastError(err ?? null);
        }
      });
    },
    [applyEsp32Telemetry]
  );

  const disconnectEsp32 = useCallback(() => {
    setEsp32SyncEnabled(false);
    setEsp32LastError(null);
    esp32Sync.disconnect();
  }, []);

  const connectUsbEsp32 = useCallback(async () => {
    if (stateRef.current.esp32SyncEnabled) {
      setEsp32SyncEnabled(false);
      esp32Sync.disconnect();
    }
    setUsbError(null);
    await usbSerialBridge.connect({
      onStatusChange: (status, err) => {
        setUsbStatus(status);
        setUsbError(err ?? null);
        if (status === 'disconnected') {
          setUsbLcdStatus(null);
        }
      },
      onTelemetry: (payload) => {
        setUsbLastPacketAt(new Date().toLocaleTimeString());
        applyEsp32Telemetry(payload);
      },
      onLogLine: appendUsbLog
    });
  }, [applyEsp32Telemetry, appendUsbLog]);

  const disconnectUsbEsp32 = useCallback(async () => {
    await usbSerialBridge.disconnect();
    setUsbLcdStatus(null);
    setUsbError(null);
  }, []);

  const sendUsbCommand = useCallback(async (command: Record<string, unknown>) => {
    return usbSerialBridge.sendCommand(command);
  }, []);

  const clearUsbLogs = useCallback(() => {
    setUsbRawLogs([]);
  }, []);

  const dispatchHardwareCommand = useCallback(
    (endpoint: string, body: Record<string, unknown>, cmdPayload: Record<string, unknown>) => {
      const current = stateRef.current;
      if (current.usbStatus === 'connected') {
        void usbSerialBridge.sendCommand(cmdPayload);
      }
      if (current.esp32SyncEnabled) {
        void esp32Sync.sendCommand(endpoint, body, cmdPayload);
      }
    },
    []
  );

  useEffect(() => {
    return () => {
      esp32Sync.disconnect();
      void usbSerialBridge.disconnect();
    };
  }, []);

  const switchActiveSource = useCallback(
    (
      newSource: ActiveSupplySource,
      reason: string = 'Manual Operator Switch',
      triggerType: SwitchingEvent['triggerType'] = 'manual_override',
      percentOverrides?: { primaryPercent?: number; secondaryPercent?: number; reservePercent?: number }
    ) => {
      const latest = stateRef.current;
      const effPrimaryPct = percentOverrides?.primaryPercent ?? latest.primaryCylinder.percentRemaining;
      const effSecondaryPct = percentOverrides?.secondaryPercent ?? latest.secondaryCylinder.percentRemaining;
      const effReservePct = percentOverrides?.reservePercent ?? latest.reserveBuffer.percentRemaining;
      setActiveSource(newSource);
      audioAlert.playValveActuationClick();

      setPrimaryCylinder((prev) => ({
        ...prev,
        valveOpen: newSource === 'primary',
        status: prev.currentPressureBar <= 0 ? 'empty' : newSource === 'primary' ? 'active' : 'standby'
      }));

      setSecondaryCylinder((prev) => ({
        ...prev,
        valveOpen: newSource === 'secondary',
        status: prev.currentPressureBar <= 0 ? 'empty' : newSource === 'secondary' ? 'active' : 'standby'
      }));

      setReserveBuffer((prev) => ({
        ...prev,
        isActive: newSource === 'reserve',
        valveOpen: newSource === 'reserve'
      }));

      const event: SwitchingEvent = {
        id: `switch-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        timestamp: new Date().toLocaleTimeString(),
        fromSource: latest.activeSource,
        toSource: newSource,
        reason,
        triggerType,
        primaryPercent: effPrimaryPct,
        secondaryPercent: effSecondaryPct,
        reservePercent: effReservePct,
        manifoldPressureBar: newSource === 'none' ? 0.0 : 3.5
      };

      setSwitchingHistory((prev) => [event, ...prev.slice(0, 49)]);

      if (newSource === 'secondary' && triggerType === 'auto_threshold') {
        addAlert(
          'warning',
          'Automatic Backup Switch Executed',
          `Primary cylinder reached ${effPrimaryPct}%. Automatically switched to Secondary Backup Cylinder.`,
          'auto_switched'
        );
      } else if (newSource === 'reserve') {
        addAlert(
          'critical',
          'EMERGENCY: Reserve Buffer Activated',
          'All primary supplies exhausted. 5-Minute Reserve Buffer engaged to provide temporary continuity.',
          'reserve_active'
        );
      }

      if (triggerType === 'manual_override' && (newSource === 'primary' || newSource === 'secondary' || newSource === 'reserve')) {
        lastEsp32SourceRef.current = newSource;
        const target = newSource === 'primary' ? 'PRIMARY' : newSource === 'secondary' ? 'BACKUP' : 'RESERVE';
        dispatchHardwareCommand('/api/control/switch', { target }, { action: 'switch', target });
      }
    },
    [addAlert, dispatchHardwareCommand]
  );

  const refillCylinder = useCallback(
    (target: 'primary' | 'secondary' | 'all', suppressAlert = false) => {
      const latest = stateRef.current;
      audioAlert.playValveActuationClick();

      if (target === 'primary' || target === 'all') {
        setPrimaryCylinder((prev) => {
          const gas = prev.maxPressureBar * prev.waterCapacityLiters;
          return {
            ...prev,
            currentPressureBar: prev.maxPressureBar,
            pressurePsi: Math.round(prev.maxPressureBar * BAR_TO_PSI),
            remainingGasLiters: gas,
            percentRemaining: 100,
            status: latest.activeSource === 'primary' ? 'active' : 'standby',
            connected: true,
            remainingMinutes: Math.round(gas / latest.settings.flowRateLpm),
            remainingSecondsExact: (gas / latest.settings.flowRateLpm) * 60
          };
        });
      }

      if (target === 'secondary' || target === 'all') {
        setSecondaryCylinder((prev) => {
          const gas = prev.maxPressureBar * prev.waterCapacityLiters;
          return {
            ...prev,
            currentPressureBar: prev.maxPressureBar,
            pressurePsi: Math.round(prev.maxPressureBar * BAR_TO_PSI),
            remainingGasLiters: gas,
            percentRemaining: 100,
            status: latest.activeSource === 'secondary' ? 'active' : 'standby',
            connected: true,
            remainingMinutes: Math.round(gas / latest.settings.flowRateLpm),
            remainingSecondsExact: (gas / latest.settings.flowRateLpm) * 60
          };
        });
      }

      setReserveBuffer((prev) => ({
        ...prev,
        currentGasLiters: prev.capacityLiters,
        percentRemaining: 100,
        remainingSeconds: Math.round((prev.capacityLiters / latest.settings.flowRateLpm) * 60),
        isActive: false,
        isRefilling: false
      }));

      if (!suppressAlert) {
        addAlert(
          'advisory',
          'Cylinder Refill Completed',
          `Simulated refill executed for ${target} cylinder(s). Reserves restored to 100%.`,
          'restored'
        );
        if (latest.activeSource === 'reserve' || latest.activeSource === 'none') {
          switchActiveSource('primary', 'Supply Restored after Refill', 'restoration');
        }
      }

      if (!suppressAlert) {
        const cyl = target === 'primary' ? 'PRIMARY' : target === 'secondary' ? 'BACKUP' : 'ALL';
        dispatchHardwareCommand('/api/control/refill', { cylinder: cyl }, { action: 'refill', cylinder: cyl });
      }
    },
    [addAlert, switchActiveSource, dispatchHardwareCommand]
  );

  const toggleCylinderConnection = useCallback(
    (target: 'primary' | 'secondary') => {
      const latest = stateRef.current;
      audioAlert.playValveActuationClick();

      if (target === 'primary') {
        const nextConnected = !latest.primaryCylinder.connected;
        setPrimaryCylinder((prev) => ({
          ...prev,
          connected: nextConnected,
          status: nextConnected ? (latest.activeSource === 'primary' ? 'active' : 'standby') : 'disconnected'
        }));

        if (!nextConnected && latest.activeSource === 'primary') {
          if (latest.secondaryCylinder.connected && latest.secondaryCylinder.currentPressureBar > 0) {
            switchActiveSource('secondary', 'Primary Disconnected — Switched to Secondary', 'emergency_failover');
          } else {
            switchActiveSource('reserve', 'All Cylinders Disconnected — Reserve Activated', 'emergency_failover');
          }
        }
      } else {
        const nextConnected = !latest.secondaryCylinder.connected;
        setSecondaryCylinder((prev) => ({
          ...prev,
          connected: nextConnected,
          status: nextConnected ? (latest.activeSource === 'secondary' ? 'active' : 'standby') : 'disconnected'
        }));

        if (!nextConnected && latest.activeSource === 'secondary') {
          if (latest.primaryCylinder.connected && latest.primaryCylinder.currentPressureBar > 0) {
            switchActiveSource('primary', 'Secondary Disconnected — Switched to Primary', 'emergency_failover');
          } else {
            switchActiveSource('reserve', 'All Cylinders Disconnected — Reserve Activated', 'emergency_failover');
          }
        }
      }
    },
    [switchActiveSource]
  );

  const jumpTimeForwardMinutes = useCallback(
    (minutes: number) => {
      const latest = stateRef.current;
      const flow = latest.settings.flowRateLpm;
      const consumedLiters = flow * minutes;
      const prevPrimary = latest.primaryCylinder;
      const thresholdLiters =
        (latest.settings.switchingThresholdPercent / 100) * (prevPrimary.maxPressureBar * prevPrimary.waterCapacityLiters);

      let nextPrimGas = prevPrimary.remainingGasLiters;
      let shouldSwitchToSecondary = false;
      let overflowLiters = 0;

      if (latest.activeSource === 'primary') {
        if (nextPrimGas - consumedLiters > thresholdLiters) {
          nextPrimGas -= consumedLiters;
        } else {
          const primaryUsed = Math.max(0, nextPrimGas - thresholdLiters);
          nextPrimGas = thresholdLiters;
          overflowLiters = consumedLiters - primaryUsed;
          shouldSwitchToSecondary = true;
        }
      }

      const nextPrimBar = Math.max(0, nextPrimGas / prevPrimary.waterCapacityLiters);
      setPrimaryCylinder((prev) => ({
        ...prev,
        remainingGasLiters: nextPrimGas,
        currentPressureBar: Math.round(nextPrimBar * 10) / 10,
        pressurePsi: Math.round(nextPrimBar * BAR_TO_PSI),
        percentRemaining: Math.round((nextPrimGas / (prev.maxPressureBar * prev.waterCapacityLiters)) * 100),
        remainingMinutes: Math.round(nextPrimGas / flow)
      }));

      if (shouldSwitchToSecondary) {
        setSecondaryCylinder((sPrev) => {
          const nextSecGas = Math.max(0, sPrev.remainingGasLiters - overflowLiters);
          const nextSecBar = Math.max(0, nextSecGas / sPrev.waterCapacityLiters);
          return {
            ...sPrev,
            remainingGasLiters: nextSecGas,
            currentPressureBar: Math.round(nextSecBar * 10) / 10,
            pressurePsi: Math.round(nextSecBar * BAR_TO_PSI),
            percentRemaining: Math.round((nextSecGas / (sPrev.maxPressureBar * sPrev.waterCapacityLiters)) * 100),
            remainingMinutes: Math.round(nextSecGas / flow)
          };
        });
        const jumpedPrimPct = Math.round(
          (nextPrimGas / (prevPrimary.maxPressureBar * prevPrimary.waterCapacityLiters)) * 100
        );
        const jumpedSecPct = Math.round(
          (Math.max(0, latest.secondaryCylinder.remainingGasLiters - overflowLiters) /
            (latest.secondaryCylinder.maxPressureBar * latest.secondaryCylinder.waterCapacityLiters)) *
            100
        );
        switchActiveSource('secondary', `Fast-forward (${minutes}m) crossed threshold`, 'auto_threshold', {
          primaryPercent: jumpedPrimPct,
          secondaryPercent: jumpedSecPct
        });
      }

      setTherapyElapsedSeconds((t) => t + minutes * 60);
      addAlert('advisory', `Time Jump Executed (+${minutes} min)`, `Simulation clock fast-forwarded by ${minutes} minutes.`, 'restored');
    },
    [switchActiveSource, addAlert]
  );

  const triggerScenario = useCallback(
    (scenarioId: EmergencyScenarioId) => {
      const scenario = SCENARIO_DEFINITIONS[scenarioId];
      if (!scenario) return;

      const latest = stateRef.current;
      const flow = latest.settings.flowRateLpm;

      setActiveScenario(scenario);
      setScenarioHistory((prev) => [scenario, ...prev.slice(0, 19)]);
      setLastScenarioUpdatedAt(new Date().toLocaleTimeString());
      audioAlert.playValveActuationClick();

      switch (scenarioId) {
        case 'normal':
          setVitals((v) => ({ ...v, spo2: 98, pulseRate: 72, respiratoryRate: 16, patientStatus: 'stable' }));
          setPrimaryCylinder((prev) => ({
            ...prev,
            currentPressureBar: 135,
            pressurePsi: Math.round(135 * BAR_TO_PSI),
            remainingGasLiters: 135 * prev.waterCapacityLiters,
            percentRemaining: 90,
            remainingMinutes: Math.round((135 * prev.waterCapacityLiters) / flow),
            status: 'active',
            connected: true,
            valveOpen: true
          }));
          setSecondaryCylinder((prev) => ({
            ...prev,
            currentPressureBar: 150,
            pressurePsi: Math.round(150 * BAR_TO_PSI),
            remainingGasLiters: 150 * prev.waterCapacityLiters,
            percentRemaining: 100,
            remainingMinutes: Math.round((150 * prev.waterCapacityLiters) / flow),
            status: 'standby',
            connected: true,
            valveOpen: false
          }));
          setReserveBuffer((prev) => ({
            ...prev,
            currentGasLiters: prev.capacityLiters,
            percentRemaining: 100,
            remainingSeconds: Math.round((prev.capacityLiters / flow) * 60),
            isActive: false,
            isRefilling: false,
            valveOpen: false
          }));
          setActiveSource('primary');
          setSystemMode('auto');
          addAlert('advisory', 'Scenario Injected: Normal Operation', 'Baseline stable telemetry loaded.', 'restored');
          break;

        case 'primary_empty':
          setPrimaryCylinder((prev) => ({
            ...prev,
            currentPressureBar: 18,
            pressurePsi: Math.round(18 * BAR_TO_PSI),
            remainingGasLiters: 18 * prev.waterCapacityLiters,
            percentRemaining: 12,
            remainingMinutes: Math.round((18 * prev.waterCapacityLiters) / flow),
            status: 'low',
            connected: true,
            valveOpen: true
          }));
          addAlert(
            'warning',
            'Primary Cylinder Depletion Injected',
            'Primary pressure dropped to 18 bar (12%). Approaching auto-switch threshold.',
            'primary_low'
          );
          break;

        case 'auto_switch':
          setPrimaryCylinder((prev) => ({
            ...prev,
            currentPressureBar: 12,
            pressurePsi: Math.round(12 * BAR_TO_PSI),
            remainingGasLiters: 12 * prev.waterCapacityLiters,
            percentRemaining: 8,
            remainingMinutes: Math.round((12 * prev.waterCapacityLiters) / flow),
            status: 'standby',
            valveOpen: false
          }));
          setSecondaryCylinder((prev) => ({
            ...prev,
            connected: true,
            status: 'active',
            valveOpen: true
          }));
          switchActiveSource('secondary', 'Automatic Switchover triggered by 10% threshold', 'auto_threshold', {
            primaryPercent: 8
          });
          break;

        case 'low_spo2':
          setVitals((v) => ({ ...v, spo2: 84, pulseRate: 118, respiratoryRate: 24, patientStatus: 'critical' }));
          addAlert(
            'critical',
            'Severe Hypoxemia Alert: SpO₂ 84%',
            'Simulated patient oxygen saturation dropped below 88%. Flow adjustment required immediately.',
            'low_spo2'
          );
          break;

        case 'backup_empty':
          setSecondaryCylinder((prev) => ({
            ...prev,
            currentPressureBar: 7.5,
            pressurePsi: Math.round(7.5 * BAR_TO_PSI),
            remainingGasLiters: 7.5 * prev.waterCapacityLiters,
            percentRemaining: 5,
            remainingMinutes: Math.round((7.5 * prev.waterCapacityLiters) / flow),
            status: 'low'
          }));
          addAlert(
            'critical',
            'CRITICAL: Backup Cylinder Near Depletion',
            'Secondary cylinder has only 5% remaining. System at imminent risk of total exhaustion.',
            'secondary_low'
          );
          break;

        case 'both_unavailable':
          setPrimaryCylinder((prev) => ({
            ...prev,
            currentPressureBar: 0,
            pressurePsi: 0,
            remainingGasLiters: 0,
            percentRemaining: 0,
            remainingMinutes: 0,
            status: 'empty',
            valveOpen: false
          }));
          setSecondaryCylinder((prev) => ({
            ...prev,
            currentPressureBar: 0,
            pressurePsi: 0,
            remainingGasLiters: 0,
            percentRemaining: 0,
            remainingMinutes: 0,
            status: 'empty',
            valveOpen: false
          }));
          setSystemMode('emergency_reserve');
          switchActiveSource('reserve', 'Both Primary & Secondary cylinders depleted (0 bar)', 'emergency_failover', {
            primaryPercent: 0,
            secondaryPercent: 0
          });
          break;

        case 'reserve_active':
          setPrimaryCylinder((prev) => ({
            ...prev,
            currentPressureBar: 0,
            pressurePsi: 0,
            remainingGasLiters: 0,
            percentRemaining: 0,
            remainingMinutes: 0,
            valveOpen: false,
            status: 'empty'
          }));
          setSecondaryCylinder((prev) => ({
            ...prev,
            currentPressureBar: 0,
            pressurePsi: 0,
            remainingGasLiters: 0,
            percentRemaining: 0,
            remainingMinutes: 0,
            valveOpen: false,
            status: 'empty'
          }));
          setReserveBuffer((prev) => ({
            ...prev,
            isActive: true,
            valveOpen: true,
            currentGasLiters: 10.0,
            percentRemaining: 80,
            remainingSeconds: Math.round((10.0 / flow) * 60)
          }));
          setActiveSource('reserve');
          setSystemMode('emergency_reserve');
          addAlert(
            'critical',
            '5-Minute Reserve Buffer Operating',
            'Temporary continuity bridge active. Emergency 4:00 countdown running.',
            'reserve_active'
          );
          break;

        case 'restoration':
          refillCylinder('all', true);
          setVitals((v) => ({ ...v, spo2: 98, pulseRate: 72, respiratoryRate: 16, patientStatus: 'stable' }));
          switchActiveSource('primary', 'Fresh 150-bar cylinders installed', 'restoration');
          setSystemMode('auto');
          addAlert('advisory', 'Supply Restored & Reserves Full', 'New 150-bar cylinders detected. Nominal delivery resumed.', 'restored');
          break;
      }

      const espId = SCENARIO_ID_TO_ESP32[scenarioId];
      lastEsp32ScenarioRef.current = espId;
      dispatchHardwareCommand('/api/control/scenario', { scenarioId: espId }, { action: 'scenario', id: espId });
    },
    [addAlert, switchActiveSource, refillCylinder, dispatchHardwareCommand]
  );

  const resetSimulation = useCallback(() => {
    triggerScenario('normal');
    setAlerts([]);
    audioAlert.stopAlarm();
    setTherapyElapsedSeconds(0);
    setCaregiverNotifications([
      {
        id: `notif-${Date.now()}`,
        title: 'Simulation Reset to Nominal',
        body: 'All oxygen supplies, vitals, and buffer parameters restored to defaults.',
        severity: 'advisory',
        timestamp: new Date().toLocaleTimeString(),
        actionRequired: 'Routine monitoring'
      }
    ]);
    dispatchHardwareCommand('/api/control/reset', {}, { action: 'reset' });
  }, [triggerScenario, dispatchHardwareCommand]);

  // Stable 1 Hz simulation loop (no interval churn!)
  useEffect(() => {
    const interval = window.setInterval(() => {
      const current = stateRef.current;
      const isLiveEsp32 =
        (current.esp32SyncEnabled && current.esp32ConnectionState === 'connected') ||
        current.usbStatus === 'connected';

      // When connected to real ESP32 hardware, ESP32 drives physics & telemetry packets
      if (isLiveEsp32) {
        setTherapyElapsedSeconds((t) => t + 1);
        setVitals((prev) => advanceVitalsWaveforms(prev));
        return;
      }

      const speed = current.settings.simulationSpeed;
      const flowRateLpm = current.settings.flowRateLpm;
      const consumedLiters = (flowRateLpm / 60) * speed;

      setTherapyElapsedSeconds((t) => t + speed);
      setVitals((prev) => advanceVitalsWaveforms(prev));

      if (!current.isMuted && current.settings.pulseOximeterBeepEnabled) {
        audioAlert.playPulseOximeterBeep(current.vitals.spo2);
      }

      packetIdRef.current += 1;
      const newPacket = buildTelemetryPacket(
        packetIdRef.current,
        current.primaryCylinder.currentPressureBar,
        current.secondaryCylinder.currentPressureBar,
        current.reserveBuffer.currentGasLiters,
        flowRateLpm,
        current.activeSource,
        current.vitals.spo2,
        current.vitals.pulseRate
      );
      setTelemetryPackets((prev) => [newPacket, ...prev.slice(0, 19)]);

      if (current.activeSource === 'primary') {
        const prev = current.primaryCylinder;
        if (prev.connected && prev.currentPressureBar > 0) {
          const nextGas = Math.max(0, prev.remainingGasLiters - consumedLiters);
          const nextPressureBar = Math.max(0, nextGas / prev.waterCapacityLiters);
          const nextPercent = Math.max(0, Math.round((nextGas / (prev.maxPressureBar * prev.waterCapacityLiters)) * 100));
          const nextMinutes = calculateRuntimeMinutes(nextGas, flowRateLpm);

          setPrimaryCylinder({
            ...prev,
            remainingGasLiters: nextGas,
            currentPressureBar: Math.round(nextPressureBar * 10) / 10,
            pressurePsi: Math.round(nextPressureBar * BAR_TO_PSI),
            percentRemaining: nextPercent,
            remainingMinutes: Math.round(nextMinutes),
            remainingSecondsExact: Math.max(0, (nextGas / flowRateLpm) * 60),
            status: nextPercent <= 0 ? 'empty' : nextPercent <= current.settings.switchingThresholdPercent ? 'low' : 'active'
          });

          if (
            current.settings.autoSwitchEnabled &&
            nextPercent <= current.settings.switchingThresholdPercent &&
            current.secondaryCylinder.connected &&
            current.secondaryCylinder.currentPressureBar > 0
          ) {
            switchActiveSource(
              'secondary',
              `Primary reached ${nextPercent}% (threshold: ${current.settings.switchingThresholdPercent}%)`,
              'auto_threshold',
              { primaryPercent: nextPercent }
            );
          } else if (nextGas <= 0) {
            if (current.secondaryCylinder.connected && current.secondaryCylinder.currentPressureBar > 0) {
              switchActiveSource('secondary', 'Primary cylinder completely exhausted', 'primary_depletion', {
                primaryPercent: 0
              });
            } else {
              switchActiveSource('reserve', 'Primary depleted and backup unavailable', 'emergency_failover', {
                primaryPercent: 0
              });
            }
          }
        }
      } else if (current.activeSource === 'secondary') {
        const prev = current.secondaryCylinder;
        if (prev.connected && prev.currentPressureBar > 0) {
          const nextGas = Math.max(0, prev.remainingGasLiters - consumedLiters);
          const nextPressureBar = Math.max(0, nextGas / prev.waterCapacityLiters);
          const nextPercent = Math.max(0, Math.round((nextGas / (prev.maxPressureBar * prev.waterCapacityLiters)) * 100));
          const nextMinutes = calculateRuntimeMinutes(nextGas, flowRateLpm);

          setSecondaryCylinder({
            ...prev,
            remainingGasLiters: nextGas,
            currentPressureBar: Math.round(nextPressureBar * 10) / 10,
            pressurePsi: Math.round(nextPressureBar * BAR_TO_PSI),
            percentRemaining: nextPercent,
            remainingMinutes: Math.round(nextMinutes),
            remainingSecondsExact: Math.max(0, (nextGas / flowRateLpm) * 60),
            status: nextPercent <= 0 ? 'empty' : nextPercent <= 10 ? 'low' : 'active'
          });

          if (nextGas <= 0) {
            switchActiveSource('reserve', 'Secondary backup cylinder completely exhausted', 'emergency_failover', {
              secondaryPercent: 0
            });
          }
        }
      } else if (current.activeSource === 'reserve') {
        const prev = current.reserveBuffer;
        const nextGas = Math.max(0, prev.currentGasLiters - consumedLiters);
        const nextPercent = Math.max(0, Math.round((nextGas / prev.capacityLiters) * 100));
        const nextSeconds = Math.max(0, Math.round((nextGas / flowRateLpm) * 60));

        setReserveBuffer({
          ...prev,
          currentGasLiters: nextGas,
          percentRemaining: nextPercent,
          remainingSeconds: nextSeconds
        });

        if (nextGas <= 0) {
          setActiveSource('none');
          setSystemMode('depleted');
          addAlert(
            'critical',
            'OXYGEN EXHAUSTION: Reserve Buffer Depleted',
            'Zero oxygen available across all primary, secondary, and reserve buffers! Immediate emergency intervention required!',
            'all_supplies_depleted'
          );
        }
      }

      // Bleed recharge for reserve buffer
      if (
        (current.activeSource === 'primary' || current.activeSource === 'secondary') &&
        current.reserveBuffer.percentRemaining < 100
      ) {
        setReserveBuffer((prev) => {
          const rechargeRateLps = 0.05 * speed;
          const newGas = Math.min(prev.capacityLiters, prev.currentGasLiters + rechargeRateLps);
          const newPct = Math.round((newGas / prev.capacityLiters) * 100);
          return {
            ...prev,
            currentGasLiters: newGas,
            percentRemaining: newPct,
            remainingSeconds: Math.round((newGas / flowRateLpm) * 60),
            isRefilling: newPct < 100
          };
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [switchActiveSource, addAlert]);

  const predictions = useMemo<PredictionData>(() => {
    const flow = settings.flowRateLpm;
    const primGas = primaryCylinder.connected ? primaryCylinder.remainingGasLiters : 0;
    const secGas = secondaryCylinder.connected ? secondaryCylinder.remainingGasLiters : 0;
    const primMin = calculateRuntimeMinutes(primGas, flow);
    const secMin = calculateRuntimeMinutes(secGas, flow);
    const resSec = Math.round((reserveBuffer.currentGasLiters / flow) * 60);
    const totalMin = primMin + secMin + Math.round(resSec / 60);
    const totalSec = totalMin * 60;

    return {
      flowRateLpm: flow,
      primaryDepletionMinutes: Math.round(primMin),
      primaryDepletionTimeStr: formatDepletionTimestamp(primMin),
      secondaryDepletionMinutes: Math.round(secMin),
      secondaryDepletionTimeStr: formatDepletionTimestamp(secMin),
      reserveDepletionSeconds: resSec,
      totalSystemMinutes: Math.round(totalMin),
      totalSystemDepletionTimeStr: formatDepletionTimestamp(totalMin),
      predictedSwitchTimeStr: formatDepletionTimestamp(
        Math.max(0, primMin - (settings.switchingThresholdPercent / 100) * ((primaryCylinder.maxPressureBar * primaryCylinder.waterCapacityLiters) / flow))
      ),
      totalSecondsRemaining: totalSec,
      formattedCountdown: formatPrecisionCountdown(totalSec),
      formula: 'T = (P_bar × V_water) / Q_flow',
      vanDerWaalsCorrection: 'V_NTP = (P / Z) × V_water where Z ≈ 0.96 at 150 bar',
      assumptions: [
        'Real gas compressibility factor Z ≈ 0.96 for O2 at 150 bar, 20°C',
        'Continuous uniform patient inspiratory demand without breath-trigger pulse saving',
        'Dual-stage diaphragm pressure reduction to 3.5 bar nominal manifold pressure',
        `Configured medical cylinder water volume: ${primaryCylinder.waterCapacityLiters.toFixed(1)} Liters (${Math.round(150 * primaryCylinder.waterCapacityLiters)} L gas NTP)`
      ]
    };
  }, [
    settings.flowRateLpm,
    settings.switchingThresholdPercent,
    primaryCylinder.connected,
    primaryCylinder.remainingGasLiters,
    primaryCylinder.maxPressureBar,
    primaryCylinder.waterCapacityLiters,
    secondaryCylinder.connected,
    secondaryCylinder.remainingGasLiters,
    reserveBuffer.currentGasLiters
  ]);

  const therapyElapsedFormatted = useMemo(() => {
    const s = Math.floor(therapyElapsedSeconds);
    const hrs = Math.floor(s / 3600).toString().padStart(2, '0');
    const mins = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
    const secs = (s % 60).toString().padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
  }, [therapyElapsedSeconds]);

  const setFlowRate = useCallback(
    (flow: number) => {
      const safeFlow = Math.max(0.5, Math.min(15.0, flow));
      setSettings((s) => ({ ...s, flowRateLpm: safeFlow }));
      dispatchHardwareCommand('/api/control/flow', { rate: safeFlow }, { action: 'flow', rate: safeFlow });
    },
    [dispatchHardwareCommand]
  );

  const setSimulationSpeed = useCallback(
    (speed: number) => {
      setSettings((s) => ({ ...s, simulationSpeed: speed }));
      if (stateRef.current.usbStatus === 'connected') {
        void usbSerialBridge.sendCommand({ action: 'speed', speed });
      }
    },
    []
  );

  const setSwitchingThreshold = useCallback(
    (threshold: number) => {
      setSettings((s) => ({ ...s, switchingThresholdPercent: threshold }));
      if (stateRef.current.usbStatus === 'connected') {
        void usbSerialBridge.sendCommand({ action: 'threshold', threshold });
      }
    },
    []
  );

  const updateSettings = useCallback((newSettings: Partial<SystemSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  }, []);

  const acknowledgeAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, acknowledged: true } : a)));
  }, []);

  const acknowledgeAllAlerts = useCallback(() => {
    setAlerts((prev) => prev.map((a) => ({ ...a, acknowledged: true })));
    audioAlert.stopAlarm();
  }, []);

  const clearAllAlerts = useCallback(() => {
    setAlerts([]);
    audioAlert.stopAlarm();
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      audioAlert.setMuted(next);
      return next;
    });
  }, []);

  const togglePulseOximeterSound = useCallback(() => {
    setSettings((s) => {
      const next = !s.pulseOximeterBeepEnabled;
      audioAlert.setPulseOximeterSound(next);
      return { ...s, pulseOximeterBeepEnabled: next };
    });
  }, []);

  const snoozeAlarms = useCallback(() => {
    audioAlert.snooze(120);
    setSnoozeRemaining(120);
  }, []);

  const requestBrowserNotification = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      return false;
    }
    const perm = await Notification.requestPermission();
    return perm === 'granted';
  }, []);

  const sendDemoNotification = useCallback((title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(`OXYSYNC 2.0: ${title}`, {
          body,
          icon: '/favicon.ico'
        });
      } catch {
        // Ignore notification constructor errors
      }
    }
  }, []);

  const contextValue = useMemo<TelemetryContextType>(
    () => ({
      therapyElapsedSeconds,
      therapyElapsedFormatted,
      sessionStartTime: sessionStartTimeRef.current,
      lastScenarioUpdatedAt,
      esp32Host,
      esp32SyncEnabled,
      esp32ConnectionState,
      esp32LastError,
      connectEsp32,
      disconnectEsp32,
      usbSupported,
      usbStatus,
      usbError,
      usbLastPacketAt,
      usbLcdStatus,
      usbRawLogs,
      connectUsbEsp32,
      disconnectUsbEsp32,
      sendUsbCommand,
      clearUsbLogs,
      vitals,
      primaryCylinder,
      secondaryCylinder,
      reserveBuffer,
      activeSource,
      systemMode,
      switchingHistory,
      alerts,
      activeScenario,
      scenarioHistory,
      settings,
      predictions,
      caregiverNotifications,
      telemetryPackets,
      isMuted,
      snoozeRemaining,
      theme,
      toggleTheme,
      triggerScenario,
      resetSimulation,
      switchActiveSource,
      setFlowRate,
      setSimulationSpeed,
      jumpTimeForwardMinutes,
      setSwitchingThreshold,
      refillCylinder,
      toggleCylinderConnection,
      updateSettings,
      acknowledgeAlert,
      acknowledgeAllAlerts,
      clearAllAlerts,
      toggleMute,
      togglePulseOximeterSound,
      snoozeAlarms,
      requestBrowserNotification,
      sendDemoNotification
    }),
    [
      therapyElapsedSeconds,
      therapyElapsedFormatted,
      lastScenarioUpdatedAt,
      esp32Host,
      esp32SyncEnabled,
      esp32ConnectionState,
      esp32LastError,
      connectEsp32,
      disconnectEsp32,
      usbSupported,
      usbStatus,
      usbError,
      usbLastPacketAt,
      usbLcdStatus,
      usbRawLogs,
      connectUsbEsp32,
      disconnectUsbEsp32,
      sendUsbCommand,
      clearUsbLogs,
      vitals,
      primaryCylinder,
      secondaryCylinder,
      reserveBuffer,
      activeSource,
      systemMode,
      switchingHistory,
      alerts,
      activeScenario,
      scenarioHistory,
      settings,
      predictions,
      caregiverNotifications,
      telemetryPackets,
      isMuted,
      snoozeRemaining,
      theme,
      toggleTheme,
      triggerScenario,
      resetSimulation,
      switchActiveSource,
      setFlowRate,
      setSimulationSpeed,
      jumpTimeForwardMinutes,
      setSwitchingThreshold,
      refillCylinder,
      toggleCylinderConnection,
      updateSettings,
      acknowledgeAlert,
      acknowledgeAllAlerts,
      clearAllAlerts,
      toggleMute,
      togglePulseOximeterSound,
      snoozeAlarms,
      requestBrowserNotification,
      sendDemoNotification
    ]
  );

  return <TelemetryContext.Provider value={contextValue}>{children}</TelemetryContext.Provider>;
};

export const useTelemetry = () => {
  const context = useContext(TelemetryContext);
  if (!context) {
    throw new Error('useTelemetry must be used within a TelemetryProvider');
  }
  return context;
};
