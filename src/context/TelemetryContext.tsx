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
  TelemetryPacket
} from '../types/telemetry';
import { audioAlert } from '../services/audioAlert';
import { SCENARIO_DEFINITIONS } from '../services/scenarioData';
import { 
  calculateRuntimeMinutes, 
  formatDepletionTimestamp, 
  formatPrecisionCountdown, 
  BAR_TO_PSI 
} from '../services/physicsEngine';

interface TelemetryContextType {
  // Precision Clock & Timing State
  masterClockMs: string;
  therapyElapsedSeconds: number;
  therapyElapsedFormatted: string;
  sessionStartTime: string;

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

  // Actions
  triggerScenario: (scenarioId: EmergencyScenarioId) => void;
  resetSimulation: () => void;
  switchActiveSource: (source: ActiveSupplySource, reason?: string, triggerType?: SwitchingEvent['triggerType']) => void;
  setFlowRate: (flowRateLpm: number) => void;
  setSimulationSpeed: (speed: number) => void;
  jumpTimeForwardMinutes: (minutes: number) => void;
  setSwitchingThreshold: (thresholdPercent: number) => void;
  refillCylinder: (target: 'primary' | 'secondary' | 'all') => void;
  toggleCylinderConnection: (target: 'primary' | 'secondary') => void;
  updateSettings: (newSettings: Partial<SystemSettings>) => void;
  acknowledgeAlert: (alertId: string) => void;
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
  primaryWaterCapacity: 4.4,     // 4.4L water volume = 660L gas at 150 bar
  secondaryWaterCapacity: 4.4,   // 4.4L water volume = 660L gas at 150 bar
  reserveCapacityLiters: 12.5,   // 12.5L gas volume = 5 minutes at 2.5 L/min
  soundEnabled: true,
  audioVolume: 0.8,
  pulseOximeterBeepEnabled: true,
  autoSwitchEnabled: true,
  sweepSpeedMmPerSec: 25
};

export const TelemetryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Settings with LocalStorage persistence
  const [settings, setSettings] = useState<SystemSettings>(() => {
    try {
      const saved = localStorage.getItem('oxysync_2_settings');
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch {
      // Fallback
    }
    return DEFAULT_SETTINGS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('oxysync_2_settings', JSON.stringify(settings));
    } catch {
      // Ignore
    }
  }, [settings]);

  // Master Chronometer & Time Telemetry
  const [masterClockMs, setMasterClockMs] = useState<string>('');
  const [therapyElapsedSeconds, setTherapyElapsedSeconds] = useState<number>(0);
  const sessionStartTimeRef = useRef<string>(new Date().toLocaleTimeString());
  const packetIdRef = useRef<number>(1001);

  // Vitals State with Multi-Lead ECG, PPG & Capnography Buffers
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

  // Primary Cylinder
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

  // Secondary Backup Cylinder
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

  // 5-Minute Reserve Buffer
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

  // Sync Audio Settings
  useEffect(() => {
    audioAlert.setVolume(settings.audioVolume);
    audioAlert.setMuted(!settings.soundEnabled || isMuted);
    audioAlert.setPulseOximeterSound(settings.pulseOximeterBeepEnabled);
  }, [settings.audioVolume, settings.soundEnabled, settings.pulseOximeterBeepEnabled, isMuted]);

  // Audio Alarms Loop Effect
  useEffect(() => {
    const unacknowledged = alerts.filter(a => !a.acknowledged);
    const critical = unacknowledged.find(a => a.severity === 'critical');
    const warning = unacknowledged.find(a => a.severity === 'warning');

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

  // Master Millisecond Clock Ticker (Runs at 20 Hz = 50ms)
  useEffect(() => {
    const clockInterval = window.setInterval(() => {
      const now = new Date();
      const h = now.getHours().toString().padStart(2, '0');
      const m = now.getMinutes().toString().padStart(2, '0');
      const s = now.getSeconds().toString().padStart(2, '0');
      const ms = Math.floor(now.getMilliseconds() / 10).toString().padStart(2, '0');
      setMasterClockMs(`${h}:${m}:${s}.${ms}`);
    }, 50);

    return () => clearInterval(clockInterval);
  }, []);

  // Helper to add an alert with automatic notification
  const addAlert = useCallback((
    severity: AlertItem['severity'],
    title: string,
    message: string,
    type: AlertItem['type'],
    source: string = 'OXYSYNC Control Engine'
  ) => {
    const id = `alert-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const timestamp = new Date().toLocaleTimeString();
    
    setAlerts(prev => {
      if (prev.some(a => a.type === type && !a.acknowledged)) return prev;
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

    setCaregiverNotifications(prev => [
      {
        id: `notif-${Date.now()}`,
        title,
        body: message,
        severity,
        timestamp,
        actionRequired: severity === 'critical' ? 'Immediate Attendant Action Required' : 'Review Supply Status'
      },
      ...prev.slice(0, 29)
    ]);
  }, []);

  // Manual or programmatic switch of active supply
  const switchActiveSource = useCallback((
    newSource: ActiveSupplySource,
    reason: string = 'Manual Operator Switch',
    triggerType: SwitchingEvent['triggerType'] = 'manual_override'
  ) => {
    setActiveSource(newSource);
    
    // Play tactile mechanical solenoid actuation sound!
    audioAlert.playValveActuationClick();

    setPrimaryCylinder(prev => ({
      ...prev,
      valveOpen: newSource === 'primary',
      status: prev.currentPressureBar <= 0 ? 'empty' : (newSource === 'primary' ? 'active' : 'standby')
    }));

    setSecondaryCylinder(prev => ({
      ...prev,
      valveOpen: newSource === 'secondary',
      status: prev.currentPressureBar <= 0 ? 'empty' : (newSource === 'secondary' ? 'active' : 'standby')
    }));

    setReserveBuffer(prev => ({
      ...prev,
      isActive: newSource === 'reserve',
      valveOpen: newSource === 'reserve'
    }));

    const event: SwitchingEvent = {
      id: `switch-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      fromSource: activeSource,
      toSource: newSource,
      reason,
      triggerType,
      primaryPercent: primaryCylinder.percentRemaining,
      secondaryPercent: secondaryCylinder.percentRemaining,
      reservePercent: reserveBuffer.percentRemaining,
      manifoldPressureBar: newSource === 'none' ? 0.0 : 3.5
    };

    setSwitchingHistory(prev => [event, ...prev.slice(0, 49)]);

    if (newSource === 'secondary' && triggerType === 'auto_threshold') {
      addAlert(
        'warning',
        'Automatic Backup Switch Executed',
        `Primary cylinder reached ${primaryCylinder.percentRemaining}%. Automatically switched to Secondary Backup Cylinder.`,
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
  }, [activeSource, primaryCylinder.percentRemaining, secondaryCylinder.percentRemaining, reserveBuffer.percentRemaining, addAlert]);

  // Cylinder Refill Simulation
  const refillCylinder = useCallback((target: 'primary' | 'secondary' | 'all') => {
    audioAlert.playValveActuationClick();

    if (target === 'primary' || target === 'all') {
      setPrimaryCylinder(prev => {
        const gas = prev.maxPressureBar * prev.waterCapacityLiters;
        return {
          ...prev,
          currentPressureBar: prev.maxPressureBar,
          pressurePsi: Math.round(prev.maxPressureBar * BAR_TO_PSI),
          remainingGasLiters: gas,
          percentRemaining: 100,
          status: activeSource === 'primary' ? 'active' : 'standby',
          connected: true,
          remainingMinutes: Math.round(gas / settings.flowRateLpm),
          remainingSecondsExact: (gas / settings.flowRateLpm) * 60
        };
      });
    }

    if (target === 'secondary' || target === 'all') {
      setSecondaryCylinder(prev => {
        const gas = prev.maxPressureBar * prev.waterCapacityLiters;
        return {
          ...prev,
          currentPressureBar: prev.maxPressureBar,
          pressurePsi: Math.round(prev.maxPressureBar * BAR_TO_PSI),
          remainingGasLiters: gas,
          percentRemaining: 100,
          status: activeSource === 'secondary' ? 'active' : 'standby',
          connected: true,
          remainingMinutes: Math.round(gas / settings.flowRateLpm),
          remainingSecondsExact: (gas / settings.flowRateLpm) * 60
        };
      });
    }

    setReserveBuffer(prev => ({
      ...prev,
      currentGasLiters: prev.capacityLiters,
      percentRemaining: 100,
      remainingSeconds: Math.round((prev.capacityLiters / settings.flowRateLpm) * 60),
      isActive: false,
      isRefilling: false
    }));

    addAlert('advisory', 'Cylinder Refill Completed', `Simulated refill executed for ${target} cylinder(s). Reserves restored to 100%.`, 'restored');

    if (activeSource === 'reserve' || activeSource === 'none') {
      switchActiveSource('primary', 'Supply Restored after Refill', 'restoration');
    }
  }, [activeSource, settings.flowRateLpm, addAlert, switchActiveSource]);

  // Connect / Disconnect Cylinder
  const toggleCylinderConnection = useCallback((target: 'primary' | 'secondary') => {
    audioAlert.playValveActuationClick();

    if (target === 'primary') {
      setPrimaryCylinder(prev => {
        const nextConnected = !prev.connected;
        if (!nextConnected && activeSource === 'primary') {
          setTimeout(() => {
            if (secondaryCylinder.connected && secondaryCylinder.currentPressureBar > 0) {
              switchActiveSource('secondary', 'Primary Disconnected — Switched to Secondary', 'emergency_failover');
            } else {
              switchActiveSource('reserve', 'All Cylinders Disconnected — Reserve Activated', 'emergency_failover');
            }
          }, 50);
        }
        return {
          ...prev,
          connected: nextConnected,
          status: nextConnected ? (activeSource === 'primary' ? 'active' : 'standby') : 'disconnected'
        };
      });
    } else {
      setSecondaryCylinder(prev => {
        const nextConnected = !prev.connected;
        if (!nextConnected && activeSource === 'secondary') {
          setTimeout(() => {
            if (primaryCylinder.connected && primaryCylinder.currentPressureBar > 0) {
              switchActiveSource('primary', 'Secondary Disconnected — Switched to Primary', 'emergency_failover');
            } else {
              switchActiveSource('reserve', 'All Cylinders Disconnected — Reserve Activated', 'emergency_failover');
            }
          }, 50);
        }
        return {
          ...prev,
          connected: nextConnected,
          status: nextConnected ? (activeSource === 'secondary' ? 'active' : 'standby') : 'disconnected'
        };
      });
    }
  }, [activeSource, primaryCylinder.connected, primaryCylinder.currentPressureBar, secondaryCylinder.connected, secondaryCylinder.currentPressureBar, switchActiveSource]);

  // Jump Time Forward by N Minutes (Interactive Fast-Forward / Time-Travel)
  const jumpTimeForwardMinutes = useCallback((minutes: number) => {
    const consumedLiters = settings.flowRateLpm * minutes;

    setPrimaryCylinder(prev => {
      const thresholdLiters = (settings.switchingThresholdPercent / 100) * (prev.maxPressureBar * prev.waterCapacityLiters);
      let nextGas = prev.remainingGasLiters;

      if (activeSource === 'primary') {
        if (nextGas - consumedLiters > thresholdLiters) {
          nextGas -= consumedLiters;
        } else {
          // Reached threshold or zero
          const primaryUsed = Math.max(0, nextGas - thresholdLiters);
          nextGas = thresholdLiters;
          const overflow = consumedLiters - primaryUsed;
          // Switch to secondary!
          setTimeout(() => {
            switchActiveSource('secondary', `Fast-forward (${minutes}m) crossed threshold`, 'auto_threshold');
          }, 50);

          setSecondaryCylinder(sPrev => {
            const nextSecGas = Math.max(0, sPrev.remainingGasLiters - overflow);
            const nextSecBar = Math.max(0, nextSecGas / sPrev.waterCapacityLiters);
            return {
              ...sPrev,
              remainingGasLiters: nextSecGas,
              currentPressureBar: Math.round(nextSecBar * 10) / 10,
              pressurePsi: Math.round(nextSecBar * BAR_TO_PSI),
              percentRemaining: Math.round((nextSecGas / (sPrev.maxPressureBar * sPrev.waterCapacityLiters)) * 100),
              remainingMinutes: Math.round(nextSecGas / settings.flowRateLpm)
            };
          });
        }
      }

      const nextBar = Math.max(0, nextGas / prev.waterCapacityLiters);
      return {
        ...prev,
        remainingGasLiters: nextGas,
        currentPressureBar: Math.round(nextBar * 10) / 10,
        pressurePsi: Math.round(nextBar * BAR_TO_PSI),
        percentRemaining: Math.round((nextGas / (prev.maxPressureBar * prev.waterCapacityLiters)) * 100),
        remainingMinutes: Math.round(nextGas / settings.flowRateLpm)
      };
    });

    setTherapyElapsedSeconds(t => t + minutes * 60);
    addAlert('advisory', `Time Jump Executed (+${minutes} min)`, `Simulation clock fast-forwarded by ${minutes} minutes.`, 'restored');
  }, [settings.flowRateLpm, settings.switchingThresholdPercent, activeSource, switchActiveSource, addAlert]);

  // 1-Click Emergency Scenarios Execution
  const triggerScenario = useCallback((scenarioId: EmergencyScenarioId) => {
    const scenario = SCENARIO_DEFINITIONS[scenarioId];
    if (!scenario) return;

    setActiveScenario(scenario);
    setScenarioHistory(prev => [scenario, ...prev.slice(0, 19)]);
    audioAlert.playValveActuationClick();

    switch (scenarioId) {
      case 'normal':
        setVitals(v => ({ ...v, spo2: 98, pulseRate: 72, patientStatus: 'stable' }));
        setPrimaryCylinder(prev => ({
          ...prev,
          currentPressureBar: 135,
          pressurePsi: Math.round(135 * BAR_TO_PSI),
          remainingGasLiters: 135 * prev.waterCapacityLiters,
          percentRemaining: 90,
          status: 'active',
          connected: true,
          valveOpen: true
        }));
        setSecondaryCylinder(prev => ({
          ...prev,
          currentPressureBar: 150,
          pressurePsi: Math.round(150 * BAR_TO_PSI),
          remainingGasLiters: 150 * prev.waterCapacityLiters,
          percentRemaining: 100,
          status: 'standby',
          connected: true,
          valveOpen: false
        }));
        setReserveBuffer(prev => ({
          ...prev,
          currentGasLiters: prev.capacityLiters,
          percentRemaining: 100,
          remainingSeconds: Math.round((prev.capacityLiters / settings.flowRateLpm) * 60),
          isActive: false,
          valveOpen: false
        }));
        setActiveSource('primary');
        setSystemMode('auto');
        addAlert('advisory', 'Scenario Injected: Normal Operation', 'Baseline stable telemetry loaded.', 'restored');
        break;

      case 'primary_empty':
        setPrimaryCylinder(prev => ({
          ...prev,
          currentPressureBar: 18,
          pressurePsi: Math.round(18 * BAR_TO_PSI),
          remainingGasLiters: 18 * prev.waterCapacityLiters,
          percentRemaining: 12,
          status: 'low',
          connected: true,
          valveOpen: true
        }));
        addAlert('warning', 'Primary Cylinder Depletion Injected', 'Primary pressure dropped to 18 bar (12%). Approaching auto-switch threshold.', 'primary_low');
        break;

      case 'auto_switch':
        setPrimaryCylinder(prev => ({
          ...prev,
          currentPressureBar: 12,
          pressurePsi: Math.round(12 * BAR_TO_PSI),
          remainingGasLiters: 12 * prev.waterCapacityLiters,
          percentRemaining: 8,
          status: 'standby',
          valveOpen: false
        }));
        setSecondaryCylinder(prev => ({
          ...prev,
          status: 'active',
          valveOpen: true
        }));
        switchActiveSource('secondary', 'Automatic Switchover triggered by 10% threshold', 'auto_threshold');
        break;

      case 'low_spo2':
        setVitals(v => ({ ...v, spo2: 84, pulseRate: 118, patientStatus: 'critical' }));
        addAlert('critical', 'Severe Hypoxemia Alert: SpO₂ 84%', 'Simulated patient oxygen saturation dropped below 88%. Flow adjustment required immediately.', 'low_spo2');
        break;

      case 'backup_empty':
        setSecondaryCylinder(prev => ({
          ...prev,
          currentPressureBar: 7.5,
          pressurePsi: Math.round(7.5 * BAR_TO_PSI),
          remainingGasLiters: 7.5 * prev.waterCapacityLiters,
          percentRemaining: 5,
          status: 'low'
        }));
        addAlert('critical', 'CRITICAL: Backup Cylinder Near Depletion', 'Secondary cylinder has only 5% remaining. System at imminent risk of total exhaustion.', 'secondary_low');
        break;

      case 'both_unavailable':
        setPrimaryCylinder(prev => ({
          ...prev,
          currentPressureBar: 0,
          pressurePsi: 0,
          remainingGasLiters: 0,
          percentRemaining: 0,
          status: 'empty',
          valveOpen: false
        }));
        setSecondaryCylinder(prev => ({
          ...prev,
          currentPressureBar: 0,
          pressurePsi: 0,
          remainingGasLiters: 0,
          percentRemaining: 0,
          status: 'empty',
          valveOpen: false
        }));
        setSystemMode('emergency_reserve');
        switchActiveSource('reserve', 'Both Primary & Secondary cylinders depleted (0 bar)', 'emergency_failover');
        break;

      case 'reserve_active':
        setPrimaryCylinder(prev => ({ ...prev, currentPressureBar: 0, percentRemaining: 0, valveOpen: false, status: 'empty' }));
        setSecondaryCylinder(prev => ({ ...prev, currentPressureBar: 0, percentRemaining: 0, valveOpen: false, status: 'empty' }));
        setReserveBuffer(prev => ({
          ...prev,
          isActive: true,
          valveOpen: true,
          currentGasLiters: 10.0,
          percentRemaining: 80,
          remainingSeconds: 240
        }));
        setActiveSource('reserve');
        setSystemMode('emergency_reserve');
        addAlert('critical', '5-Minute Reserve Buffer Operating', 'Temporary continuity bridge active. Emergency 4:00 countdown running.', 'reserve_active');
        break;

      case 'restoration':
        refillCylinder('all');
        setVitals(v => ({ ...v, spo2: 98, pulseRate: 72, patientStatus: 'stable' }));
        setActiveSource('primary');
        setSystemMode('auto');
        addAlert('advisory', 'Supply Restored & Reserves Full', 'New 150-bar cylinders detected. Nominal delivery resumed.', 'restored');
        break;
    }
  }, [settings.flowRateLpm, addAlert, switchActiveSource, refillCylinder]);

  // Reset Simulation Action
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
  }, [triggerScenario]);

  // Main Simulation Physics Loop (Ticks every 1 second scaled by simulationSpeed)
  useEffect(() => {
    const tickIntervalMs = 1000;
    const interval = window.setInterval(() => {
      const speed = settings.simulationSpeed;
      const flowRateLpm = settings.flowRateLpm;
      const consumedLiters = (flowRateLpm / 60) * speed;

      // Increment elapsed therapy time
      setTherapyElapsedSeconds(t => t + speed);

      // Advance Pleth, ECG, and Capnography waveforms
      setVitals(prev => {
        const nextPleth = [...prev.plethWaveform.slice(1)];
        const nextEcg = [...prev.ecgWaveform.slice(1)];
        const nextCapno = [...prev.capnoWaveform.slice(1)];

        const t = Date.now() / 1000;
        const hrFreq = (prev.pulseRate / 60) * 2 * Math.PI;

        // PPG pleth with dicrotic notch
        const plethSample = 0.5 + 0.35 * Math.sin(t * hrFreq) + 0.12 * Math.sin(t * hrFreq * 2 + 0.5);
        nextPleth.push(Math.max(0.05, Math.min(0.95, plethSample)));

        // ECG Lead II with sharp QRS spike
        const phase = (t * (prev.pulseRate / 60)) % 1;
        let ecgSample = 0.5;
        if (phase < 0.1) ecgSample = 0.5 + 0.08 * Math.sin(phase * 10 * Math.PI); // P wave
        else if (phase >= 0.12 && phase < 0.14) ecgSample = 0.42; // Q
        else if (phase >= 0.14 && phase < 0.18) ecgSample = 0.95; // R peak
        else if (phase >= 0.18 && phase < 0.22) ecgSample = 0.35; // S
        else if (phase >= 0.28 && phase < 0.45) ecgSample = 0.5 + 0.14 * Math.sin((phase - 0.28) / 0.17 * Math.PI); // T wave
        nextEcg.push(ecgSample);

        // Capnography EtCO2 waveform (square respiratory plateau)
        const respPhase = (t * (prev.respiratoryRate / 60)) % 1;
        let capnoSample = 0.1;
        if (respPhase < 0.5) {
          capnoSample = 0.85; // Expiratory plateau
        } else {
          capnoSample = 0.1; // Inspiratory zero
        }
        nextCapno.push(capnoSample);

        return {
          ...prev,
          plethWaveform: nextPleth,
          ecgWaveform: nextEcg,
          capnoWaveform: nextCapno,
          lastUpdated: new Date().toLocaleTimeString()
        };
      });

      // Pulse Oximeter Pitch-Modulated Audio Sync Tone
      if (!isMuted && settings.pulseOximeterBeepEnabled) {
        audioAlert.playPulseOximeterBeep(vitals.spo2);
      }

      // Generate simulated ESP32 UART Telemetry Packet
      packetIdRef.current += 1;
      const pktId = packetIdRef.current;
      const solByte = activeSource === 'primary' ? '0x01' : (activeSource === 'secondary' ? '0x02' : (activeSource === 'reserve' ? '0x04' : '0x00'));
      const p1 = Math.round(primaryCylinder.currentPressureBar * 10) / 10;
      const p2 = Math.round(secondaryCylinder.currentPressureBar * 10) / 10;
      const sccm = Math.round(flowRateLpm * 1000);
      const crcHex = `0x${((pktId * 17 + Math.round(p1 * 10)) & 0xFFFF).toString(16).toUpperCase()}`;
      
      const newPacket: TelemetryPacket = {
        packetId: pktId,
        timestamp: new Date().toLocaleTimeString(),
        primaryBar: p1,
        secondaryBar: p2,
        reserveGasLiters: Math.round(reserveBuffer.currentGasLiters * 10) / 10,
        manifoldPressureBar: activeSource === 'none' ? 0.0 : 3.5,
        flowRateSccm: sccm,
        solenoidStateByte: solByte,
        spo2Percent: vitals.spo2,
        heartRateBpm: vitals.pulseRate,
        crc16: crcHex,
        rawHex: `AA 55 ${pktId.toString(16).padStart(4, '0')} ${Math.round(p1).toString(16).padStart(2, '0')} ${Math.round(p2).toString(16).padStart(2, '0')} ${solByte.slice(2)} ${crcHex.slice(2)}`
      };

      setTelemetryPackets(prev => [newPacket, ...prev.slice(0, 19)]);

      // 2. Consume from active supply
      if (activeSource === 'primary') {
        setPrimaryCylinder(prev => {
          if (!prev.connected || prev.currentPressureBar <= 0) return prev;
          const nextGas = Math.max(0, prev.remainingGasLiters - consumedLiters);
          const nextPressureBar = Math.max(0, nextGas / prev.waterCapacityLiters);
          const nextPercent = Math.max(0, Math.round((nextGas / (prev.maxPressureBar * prev.waterCapacityLiters)) * 100));
          const nextMinutes = calculateRuntimeMinutes(nextGas, flowRateLpm);

          if (settings.autoSwitchEnabled && nextPercent <= settings.switchingThresholdPercent && secondaryCylinder.connected && secondaryCylinder.currentPressureBar > 0) {
            setTimeout(() => {
              switchActiveSource('secondary', `Primary reached ${nextPercent}% (threshold: ${settings.switchingThresholdPercent}%)`, 'auto_threshold');
            }, 50);
          } else if (nextGas <= 0) {
            setTimeout(() => {
              if (secondaryCylinder.connected && secondaryCylinder.currentPressureBar > 0) {
                switchActiveSource('secondary', 'Primary cylinder completely exhausted', 'primary_depletion');
              } else {
                switchActiveSource('reserve', 'Primary depleted and backup unavailable', 'emergency_failover');
              }
            }, 50);
          }

          return {
            ...prev,
            remainingGasLiters: nextGas,
            currentPressureBar: Math.round(nextPressureBar * 10) / 10,
            pressurePsi: Math.round(nextPressureBar * BAR_TO_PSI),
            percentRemaining: nextPercent,
            remainingMinutes: Math.round(nextMinutes),
            remainingSecondsExact: Math.max(0, (nextGas / flowRateLpm) * 60),
            status: nextPercent <= 0 ? 'empty' : (nextPercent <= settings.switchingThresholdPercent ? 'low' : 'active')
          };
        });
      } else if (activeSource === 'secondary') {
        setSecondaryCylinder(prev => {
          if (!prev.connected || prev.currentPressureBar <= 0) return prev;
          const nextGas = Math.max(0, prev.remainingGasLiters - consumedLiters);
          const nextPressureBar = Math.max(0, nextGas / prev.waterCapacityLiters);
          const nextPercent = Math.max(0, Math.round((nextGas / (prev.maxPressureBar * prev.waterCapacityLiters)) * 100));
          const nextMinutes = calculateRuntimeMinutes(nextGas, flowRateLpm);

          if (nextGas <= 0) {
            setTimeout(() => {
              switchActiveSource('reserve', 'Secondary backup cylinder completely exhausted', 'emergency_failover');
            }, 50);
          }

          return {
            ...prev,
            remainingGasLiters: nextGas,
            currentPressureBar: Math.round(nextPressureBar * 10) / 10,
            pressurePsi: Math.round(nextPressureBar * BAR_TO_PSI),
            percentRemaining: nextPercent,
            remainingMinutes: Math.round(nextMinutes),
            remainingSecondsExact: Math.max(0, (nextGas / flowRateLpm) * 60),
            status: nextPercent <= 0 ? 'empty' : (nextPercent <= 10 ? 'low' : 'active')
          };
        });
      } else if (activeSource === 'reserve') {
        setReserveBuffer(prev => {
          const nextGas = Math.max(0, prev.currentGasLiters - consumedLiters);
          const nextPercent = Math.max(0, Math.round((nextGas / prev.capacityLiters) * 100));
          const nextSeconds = Math.max(0, Math.round((nextGas / flowRateLpm) * 60));

          if (nextGas <= 0) {
            setTimeout(() => {
              setActiveSource('none');
              setSystemMode('depleted');
              addAlert('critical', 'OXYGEN EXHAUSTION: Reserve Buffer Depleted', 'Zero oxygen available across all primary, secondary, and reserve buffers! Immediate emergency intervention required!', 'all_supplies_depleted');
            }, 50);
          }

          return {
            ...prev,
            currentGasLiters: nextGas,
            percentRemaining: nextPercent,
            remainingSeconds: nextSeconds
          };
        });
      }

      // Bleed recharge for reserve buffer
      if ((activeSource === 'primary' || activeSource === 'secondary') && reserveBuffer.percentRemaining < 100) {
        setReserveBuffer(prev => {
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

    }, tickIntervalMs);

    return () => clearInterval(interval);
  }, [
    settings.simulationSpeed,
    settings.flowRateLpm,
    settings.autoSwitchEnabled,
    settings.switchingThresholdPercent,
    settings.pulseOximeterBeepEnabled,
    activeSource,
    secondaryCylinder.connected,
    secondaryCylinder.currentPressureBar,
    isMuted,
    vitals.spo2,
    vitals.pulseRate,
    primaryCylinder.currentPressureBar,
    reserveBuffer.currentGasLiters,
    reserveBuffer.percentRemaining,
    switchActiveSource,
    addAlert
  ]);

  // Predictions calculation memo
  const predictions = useMemo<PredictionData>(() => {
    const flow = settings.flowRateLpm;
    const primMin = calculateRuntimeMinutes(primaryCylinder.remainingGasLiters, flow);
    const secMin = calculateRuntimeMinutes(secondaryCylinder.remainingGasLiters, flow);
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
      predictedSwitchTimeStr: formatDepletionTimestamp(Math.max(0, primMin - (settings.switchingThresholdPercent / 100) * (primaryCylinder.maxPressureBar * primaryCylinder.waterCapacityLiters / flow))),
      totalSecondsRemaining: totalSec,
      formattedCountdown: formatPrecisionCountdown(totalSec),
      formula: 'T = (P_bar × V_water) / Q_flow',
      vanDerWaalsCorrection: 'V_NTP = (P / Z) × V_water where Z ≈ 0.96 at 150 bar',
      assumptions: [
        'Real gas compressibility factor Z ≈ 0.96 for O2 at 150 bar, 20°C',
        'Continuous uniform patient inspiratory demand without breath-trigger pulse saving',
        'Dual-stage diaphragm pressure reduction to 3.5 bar nominal manifold pressure',
        'Standard medical D/E cylinder water volume: 4.4 Liters (660 L gas NTP)'
      ]
    };
  }, [
    settings.flowRateLpm,
    settings.switchingThresholdPercent,
    primaryCylinder.remainingGasLiters,
    primaryCylinder.maxPressureBar,
    primaryCylinder.waterCapacityLiters,
    secondaryCylinder.remainingGasLiters,
    reserveBuffer.currentGasLiters
  ]);

  // Formatted Therapy Elapsed String: HH:MM:SS
  const therapyElapsedFormatted = useMemo(() => {
    const s = Math.floor(therapyElapsedSeconds);
    const hrs = Math.floor(s / 3600).toString().padStart(2, '0');
    const mins = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
    const secs = (s % 60).toString().padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
  }, [therapyElapsedSeconds]);

  const setFlowRate = useCallback((flow: number) => {
    const safeFlow = Math.max(0.5, Math.min(15.0, flow));
    setSettings(s => ({ ...s, flowRateLpm: safeFlow }));
  }, []);

  const setSimulationSpeed = useCallback((speed: number) => {
    setSettings(s => ({ ...s, simulationSpeed: speed }));
  }, []);

  const setSwitchingThreshold = useCallback((threshold: number) => {
    setSettings(s => ({ ...s, switchingThresholdPercent: threshold }));
  }, []);

  const updateSettings = useCallback((newSettings: Partial<SystemSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const acknowledgeAlert = useCallback((id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, acknowledged: true } : a));
  }, []);

  const clearAllAlerts = useCallback(() => {
    setAlerts([]);
    audioAlert.stopAlarm();
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const next = !prev;
      audioAlert.setMuted(next);
      return next;
    });
  }, []);

  const togglePulseOximeterSound = useCallback(() => {
    setSettings(s => {
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
      alert('Browser notifications not supported on this browser.');
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

  return (
    <TelemetryContext.Provider
      value={{
        masterClockMs,
        therapyElapsedSeconds,
        therapyElapsedFormatted,
        sessionStartTime: sessionStartTimeRef.current,
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
        clearAllAlerts,
        toggleMute,
        togglePulseOximeterSound,
        snoozeAlarms,
        requestBrowserNotification,
        sendDemoNotification
      }}
    >
      {children}
    </TelemetryContext.Provider>
  );
};

export const useTelemetry = () => {
  const context = useContext(TelemetryContext);
  if (!context) {
    throw new Error('useTelemetry must be used within a TelemetryProvider');
  }
  return context;
};
