import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { 
  VitalsData, 
  OxygenSupply, 
  DoctorPrescription, 
  AlertItem, 
  DeviceStatus, 
  SimulationScenario,
  TitrationMode,
  SourceType
} from '../types/telemetry';
import { audioAlert } from '../services/audioAlert';

interface TelemetryContextType {
  vitals: VitalsData;
  supply: OxygenSupply;
  prescription: DoctorPrescription;
  device: DeviceStatus;
  alerts: AlertItem[];
  activeScenario: SimulationScenario;
  isMuted: boolean;
  snoozeRemaining: number;
  serialPackets: string[];
  
  // Actions
  setScenario: (scenario: SimulationScenario) => void;
  setFlowRate: (flow: number) => void;
  setTitrationMode: (mode: TitrationMode) => void;
  setSourceType: (source: SourceType) => void;
  emergencyBoost: () => void;
  toggleMute: () => void;
  snoozeAlarms: () => void;
  acknowledgeAlert: (id: string) => void;
  clearAllAlerts: () => void;
  updatePrescription: (newPrescription: Partial<DoctorPrescription>, passcode: string) => boolean;
  setCannulaAttached: (attached: boolean) => void;
  injectCustomVitals: (spo2: number, bpm: number, psi?: number) => void;
}

const TelemetryContext = createContext<TelemetryContextType | null>(null);

export const TelemetryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Patient Vitals
  const [vitals, setVitals] = useState<VitalsData>({
    spo2: 96,
    pulseRate: 74,
    perfusionIndex: 4.8,
    respiratoryRate: 16,
    plethWaveform: Array(60).fill(0.5),
    lastUpdated: new Date().toLocaleTimeString()
  });

  // 2. Oxygen Supply
  const [supply, setSupply] = useState<OxygenSupply>({
    sourceType: 'cylinder',
    flowRate: 2.0,
    pressurePsi: 1950,
    pressureBar: Math.round(1950 / 14.5038),
    tankWaterCapacityLiters: 4.4,
    remainingGasLiters: 650,
    remainingRuntimeMinutes: 325,
    cylinderPercent: 92,
    valvePositionPercent: 40
  });

  // 3. Doctor Prescription
  const [prescription, setPrescription] = useState<DoctorPrescription>({
    isLocked: true,
    passcode: '1234',
    prescribedBy: 'Dr. Sarah Mitchell, MD (Pulmonology)',
    prescribedAt: 'Nov 09, 2026, 09:30 AM',
    targetSpo2Min: 92,
    targetSpo2Max: 96,
    minAllowedFlow: 1.0,
    maxAllowedFlow: 5.0,
    titrationMode: 'auto',
    notes: 'Maintain resting SpO₂ between 92-96%. Do not exceed 5.0 L/min without re-evaluation.'
  });

  // 4. Device Status
  const [device, setDevice] = useState<DeviceStatus>({
    connected: true,
    batteryLevel: 94,
    esp32Status: 'online',
    cannulaAttached: true,
    sensorFault: false,
    bluetoothConnected: false,
    wifiSignalDbm: -58
  });

  // 5. Alerts
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [activeScenario, setActiveScenario] = useState<SimulationScenario>('normal');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [snoozeRemaining, setSnoozeRemaining] = useState<number>(0);
  const [serialPackets, setSerialPackets] = useState<string[]>([]);

  const packetSeqRef = useRef<number>(1001);
  const plethPhaseRef = useRef<number>(0);

  // Helper to add or keep active alerts
  const syncAlerts = useCallback((newAlerts: AlertItem[]) => {
    setAlerts(prev => {
      const merged = [...prev];
      newAlerts.forEach(na => {
        const existingIdx = merged.findIndex(a => a.type === na.type && !a.acknowledged);
        if (existingIdx === -1) {
          merged.unshift(na);
        }
      });
      return merged.slice(0, 30); // Keep last 30
    });
  }, []);

  // Closed loop titration & physics tick (runs every 1000ms)
  useEffect(() => {
    const timer = setInterval(() => {
      // 1. Evaluate scenario target vitals
      let targetSpo2 = 96;
      let targetBpm = 74;
      let targetPsi = supply.pressurePsi;

      switch (activeScenario) {
        case 'hypoxemia':
          targetSpo2 = 84;
          targetBpm = 108;
          break;
        case 'exertion':
          targetSpo2 = 89;
          targetBpm = 126;
          break;
        case 'low_tank':
          targetSpo2 = 94;
          targetBpm = 82;
          targetPsi = Math.max(120, supply.pressurePsi - 12);
          break;
        case 'cannula_drop':
          targetSpo2 = 79;
          targetBpm = 114;
          break;
        case 'valve_limit':
          targetSpo2 = 88;
          targetBpm = 98;
          break;
        case 'normal':
        default:
          targetSpo2 = 96;
          targetBpm = 72;
          break;
      }

      // Add small natural physiological jitter
      const jitterSpo2 = Math.round(targetSpo2 + (Math.random() * 1.4 - 0.7));
      const jitterBpm = Math.round(targetBpm + (Math.random() * 3 - 1.5));
      const boundedSpo2 = Math.min(100, Math.max(70, jitterSpo2));

      // 2. Closed-Loop Auto Titration
      let nextFlow = supply.flowRate;
      let nextValvePos = supply.valvePositionPercent;

      if (prescription.titrationMode === 'auto' && device.cannulaAttached) {
        if (boundedSpo2 < prescription.targetSpo2Min) {
          // Patient desaturating: increase flow
          const step = boundedSpo2 < 88 ? 0.3 : 0.1;
          nextFlow = Math.min(prescription.maxAllowedFlow, Number((supply.flowRate + step).toFixed(1)));
        } else if (boundedSpo2 > prescription.targetSpo2Max && supply.flowRate > prescription.minAllowedFlow) {
          // Patient hyper-oxygenated: decrease flow
          nextFlow = Math.max(prescription.minAllowedFlow, Number((supply.flowRate - 0.1).toFixed(1)));
        }
        nextValvePos = Math.round((nextFlow / 6.0) * 100);
      }

      // 3. Tank depletion physics
      let nextPsi = targetPsi;
      if (supply.sourceType === 'cylinder') {
        // Oxygen usage rate: ~0.08 PSI per second per L/min
        const psiDrop = (nextFlow * 0.08);
        nextPsi = Math.max(0, Number((supply.pressurePsi - psiDrop).toFixed(1)));
      }

      const nextRemainingLiters = Number(((nextPsi / 2000) * 680).toFixed(0));
      const nextRuntimeMinutes = nextFlow > 0 ? Math.round(nextRemainingLiters / nextFlow) : 999;
      const nextCylinderPercent = Math.min(100, Math.round((nextPsi / 2000) * 100));

      setVitals(prev => ({
        ...prev,
        spo2: boundedSpo2,
        pulseRate: jitterBpm,
        respiratoryRate: boundedSpo2 < 90 ? 24 : 16,
        lastUpdated: new Date().toLocaleTimeString()
      }));

      setSupply(prev => ({
        ...prev,
        flowRate: nextFlow,
        pressurePsi: nextPsi,
        pressureBar: Math.round(nextPsi / 14.5038),
        remainingGasLiters: nextRemainingLiters,
        remainingRuntimeMinutes: nextRuntimeMinutes,
        cylinderPercent: nextCylinderPercent,
        valvePositionPercent: nextValvePos
      }));

      // 4. Alert rules triage
      const currentAlerts: AlertItem[] = [];
      const nowStr = new Date().toLocaleTimeString();

      if (!device.cannulaAttached) {
        currentAlerts.push({
          id: `cannula-${Date.now()}`,
          severity: 'critical',
          type: 'cannula_disconnect',
          title: 'Cannula Detached / Disconnected',
          message: 'Patient nasal cannula or sensor is disconnected. Immediate inspection needed.',
          timestamp: nowStr,
          acknowledged: false
        });
      }

      if (boundedSpo2 < 85) {
        currentAlerts.push({
          id: `severe-hypo-${Date.now()}`,
          severity: 'critical',
          type: 'severe_hypoxemia',
          title: 'CRITICAL HYPOXEMIA (SpO₂ < 85%)',
          message: `Patient blood oxygen is critically low at ${boundedSpo2}%. Immediate intervention required.`,
          timestamp: nowStr,
          acknowledged: false
        });
      } else if (boundedSpo2 < 90) {
        currentAlerts.push({
          id: `hypo-${Date.now()}`,
          severity: 'warning',
          type: 'hypoxemia',
          title: 'Hypoxemia Warning (SpO₂ < 90%)',
          message: `Patient SpO₂ has dropped below safe target to ${boundedSpo2}%. Flow automatically adjusting.`,
          timestamp: nowStr,
          acknowledged: false
        });
      }

      if (supply.sourceType === 'cylinder') {
        if (nextRuntimeMinutes <= 15) {
          currentAlerts.push({
            id: `tank-empty-${Date.now()}`,
            severity: 'critical',
            type: 'tank_exhausted',
            title: 'OXYGEN CYLINDER EXHAUSTION IMMINENT',
            message: `Less than ${nextRuntimeMinutes} minutes of oxygen remaining (${nextPsi} PSI). Swap cylinder immediately!`,
            timestamp: nowStr,
            acknowledged: false
          });
        } else if (nextRuntimeMinutes <= 35) {
          currentAlerts.push({
            id: `tank-low-${Date.now()}`,
            severity: 'warning',
            type: 'tank_low',
            title: 'Low Oxygen Reserve Warning',
            message: `Cylinder runtime is ${nextRuntimeMinutes} mins (${nextPsi} PSI). Prepare replacement cylinder.`,
            timestamp: nowStr,
            acknowledged: false
          });
        }
      }

      if (jitterBpm > 120) {
        currentAlerts.push({
          id: `tachy-${Date.now()}`,
          severity: 'warning',
          type: 'tachycardia',
          title: 'Tachycardia Alert (Pulse > 120 BPM)',
          message: `Elevated heart rate detected: ${jitterBpm} BPM. Verify patient comfort and breathing rate.`,
          timestamp: nowStr,
          acknowledged: false
        });
      }

      if (currentAlerts.length > 0) {
        syncAlerts(currentAlerts);
        const hasCritical = currentAlerts.some(a => a.severity === 'critical');
        audioAlert.triggerAlarmLoop(hasCritical ? 'critical' : 'warning');
      } else {
        audioAlert.stopAlarm();
      }

      // Snooze timer update
      const rem = audioAlert.getSnoozeRemainingSeconds();
      setSnoozeRemaining(rem);

      // Heartbeat blip
      if (boundedSpo2 >= 90) {
        audioAlert.playHeartbeatBlip(boundedSpo2 < 92 ? 660 : 880);
      }

      // Generate simulated ESP32 Mechatronic Serial Packet
      const seq = packetSeqRef.current++;
      const packet = JSON.stringify({
        seq,
        dev: 'ESP32-OXYSYNC-REV2',
        spo2: boundedSpo2,
        bpm: jitterBpm,
        flow: nextFlow,
        psi: nextPsi,
        valve: nextValvePos,
        cannula: device.cannulaAttached ? 1 : 0,
        ts: Date.now()
      });
      setSerialPackets(prev => [packet, ...prev.slice(0, 19)]);

    }, 1000);

    return () => clearInterval(timer);
  }, [activeScenario, prescription, supply, device, syncAlerts]);

  // High-frequency PPG waveform generator (60 updates per sec)
  useEffect(() => {
    let animId: number;
    const updateWave = () => {
      plethPhaseRef.current += (vitals.pulseRate / 60) * 0.12;
      const phase = plethPhaseRef.current;
      
      // Photoplethysmograph dicrotic notch synthetic formula
      const systolic = Math.sin(phase);
      const dicrotic = 0.35 * Math.sin(phase * 2.2 + 0.6);
      const val = Math.max(0.05, Math.min(0.95, (systolic + dicrotic + 1.2) / 2.4));

      setVitals(prev => ({
        ...prev,
        plethWaveform: [...prev.plethWaveform.slice(1), val]
      }));

      animId = requestAnimationFrame(updateWave);
    };

    animId = requestAnimationFrame(updateWave);
    return () => cancelAnimationFrame(animId);
  }, [vitals.pulseRate]);

  // Emergency boost action
  const emergencyBoost = useCallback(() => {
    setSupply(prev => ({
      ...prev,
      flowRate: 5.0,
      valvePositionPercent: 85
    }));
    setPrescription(prev => ({
      ...prev,
      titrationMode: 'manual'
    }));
    setAlerts(prev => [
      {
        id: `boost-${Date.now()}`,
        severity: 'info',
        type: 'valve_limit',
        title: 'Emergency High-Flow Oxygen Activated',
        message: 'Flow boosted to 5.0 L/min. Switched to manual override.',
        timestamp: new Date().toLocaleTimeString(),
        acknowledged: true
      },
      ...prev
    ]);
  }, []);

  const setFlowRate = useCallback((flow: number) => {
    const clamped = Math.max(0, Math.min(10, Number(flow.toFixed(1))));
    setSupply(prev => ({
      ...prev,
      flowRate: clamped,
      valvePositionPercent: Math.round((clamped / 6.0) * 100)
    }));
  }, []);

  const setTitrationMode = useCallback((mode: TitrationMode) => {
    setPrescription(prev => ({ ...prev, titrationMode: mode }));
  }, []);

  const setSourceType = useCallback((source: SourceType) => {
    setSupply(prev => ({
      ...prev,
      sourceType: source,
      pressurePsi: source === 'cylinder' ? 1900 : 45,
      remainingRuntimeMinutes: source === 'cylinder' ? 300 : 9999
    }));
  }, []);

  const toggleMute = useCallback(() => {
    const next = !isMuted;
    setIsMuted(next);
    audioAlert.setMuted(next);
  }, [isMuted]);

  const snoozeAlarms = useCallback(() => {
    audioAlert.snooze(120);
    setSnoozeRemaining(120);
  }, []);

  const acknowledgeAlert = useCallback((id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, acknowledged: true } : a));
  }, []);

  const clearAllAlerts = useCallback(() => {
    setAlerts([]);
    audioAlert.stopAlarm();
  }, []);

  const updatePrescription = useCallback((newPrescription: Partial<DoctorPrescription>, passcode: string): boolean => {
    if (passcode !== prescription.passcode) {
      return false;
    }
    setPrescription(prev => ({
      ...prev,
      ...newPrescription,
      prescribedAt: new Date().toLocaleString()
    }));
    return true;
  }, [prescription.passcode]);

  const setCannulaAttached = useCallback((attached: boolean) => {
    setDevice(prev => ({ ...prev, cannulaAttached: attached }));
  }, []);

  const injectCustomVitals = useCallback((spo2: number, bpm: number, psi?: number) => {
    setVitals(prev => ({ ...prev, spo2, pulseRate: bpm }));
    if (psi !== undefined) {
      setSupply(prev => ({ ...prev, pressurePsi: psi }));
    }
  }, []);

  return (
    <TelemetryContext.Provider value={{
      vitals,
      supply,
      prescription,
      device,
      alerts,
      activeScenario,
      isMuted,
      snoozeRemaining,
      serialPackets,
      setScenario: setActiveScenario,
      setFlowRate,
      setTitrationMode,
      setSourceType,
      emergencyBoost,
      toggleMute,
      snoozeAlarms,
      acknowledgeAlert,
      clearAllAlerts,
      updatePrescription,
      setCannulaAttached,
      injectCustomVitals
    }}>
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
