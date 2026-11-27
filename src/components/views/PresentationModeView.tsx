import React, { useState } from 'react';
import {
  Activity,
  CheckCircle2,
  ShieldAlert,
  Cylinder,
  Heart,
  Cpu,
  Bell,
  Layers,
  TrendingUp,
  RotateCcw,
  Box
} from 'lucide-react';
import { useTelemetry } from '../../context/TelemetryContext';

interface PresentationModeViewProps {
  onOpen3DTwin?: () => void;
}

interface ArchNode {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  description: string;
  techDetails: string[];
}

export const PresentationModeView: React.FC<PresentationModeViewProps> = ({ onOpen3DTwin }) => {
  const {
    activeSource,
    primaryCylinder,
    secondaryCylinder,
    reserveBuffer,
    vitals,
    triggerScenario,
    resetSimulation
  } = useTelemetry();

  const [selectedNode, setSelectedNode] = useState<string>('engine');

  const architectureNodes: ArchNode[] = [
    {
      id: 'patient',
      title: '1. Physiological Sensor Model',
      subtitle: 'Pulse Oximetry & ECG Waveforms',
      icon: Heart,
      description:
        'Generates bounded patient vital parameters (SpO₂ 70–100%, pulse 40–200 BPM, Lead II ECG, and PPG plethysmograph traces).',
      techDetails: [
        'Smooth delta-time waveform rendering at 60 FPS',
        'Clinical hypoxemia alarm boundary at SpO₂ < 90%',
        'Audio QRS beep cadence modulated to saturation'
      ]
    },
    {
      id: 'engine',
      title: '2. OXYSYNC Control Kernel',
      subtitle: 'Failover State Machine & Alarms',
      icon: Cpu,
      description:
        'Coordinates supply telemetry across manifolds, evaluates threshold crossings, sequences valve state transitions, and routes alarm priorities.',
      techDetails: [
        'Deterministic state machine synced with ESP32',
        'Configurable switchover threshold (5%–30%)',
        'IEC 60601-1-8 alarm cadence management'
      ]
    },
    {
      id: 'prediction',
      title: '3. Depletion Prediction',
      subtitle: "Boyle's Law Volumetric Model",
      icon: TrendingUp,
      description:
        'Computes remaining liters and duration from instantaneous tank pressure, cylinder water volume, and prescribed cannula flow.',
      techDetails: [
        'V_gas = P_bar × V_water (NTP liters)',
        'T_remaining = V_gas / Q_flow (minutes)',
        'Continuous threshold crossing timestamp estimation'
      ]
    },
    {
      id: 'manager',
      title: '4. Dual-Cylinder Switchover',
      subtitle: 'Primary & Backup Valve Coordination',
      icon: Cylinder,
      description:
        'Isolates Standby Cylinder (B-2) until Primary (A-1) drops below safety reserves, switching flow seamlessly without clinical drop.',
      techDetails: [
        'Interlocked latching solenoids (V-1 & V-2)',
        'Continuous 3.5 Bar regulated downstream line',
        'Transition records exported cleanly to CSV'
      ]
    },
    {
      id: 'reserve',
      title: '5. 5-Min Reserve Buffer',
      subtitle: 'Emergency Continuity Bridge',
      icon: ShieldAlert,
      description:
        'An inline 12.5-liter accumulator designed to maintain continuous patient supply for 5 minutes while a physical cylinder swap occurs.',
      techDetails: [
        '12.5 L capacity = 5.0 min target @ 2.5 L/min',
        'Check-valve activation upon dual-cylinder exhaustion',
        'Restricted bleed line recharge on supply restore'
      ]
    },
    {
      id: 'caregiver',
      title: '6. Telemetry & Attendant Alerts',
      subtitle: 'Web, Android & Local LCD Bridge',
      icon: Bell,
      description:
        'Broadcasts supply health across desktop workstations, native Android companion clients, and the local 16×2 character LCD.',
      techDetails: [
        'Web Serial (115200 baud) & Wi-Fi WebSocket bridge',
        'Plain-language warnings and replacement countdown',
        'Desktop Notification API integration'
      ]
    }
  ];

  const activeNodeData = architectureNodes.find((n) => n.id === selectedNode) || architectureNodes[1];

  return (
    <div className="space-y-6">
      {/* System Summary Banner */}
      <div className="clinical-card p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 text-xs font-mono text-[var(--accent-primary)] font-semibold">
            <Activity className="w-4 h-4" />
            <span>OXYSYNC 2.0 SYSTEM ARCHITECTURE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] tracking-tight">
            Closed-Loop Oxygen Continuity Platform
          </h1>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            Built to prevent unexpected cylinder exhaustion through Boyle&apos;s Law runtime prediction, automated dual-tank failover, and a 5-minute inline reserve bridge.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-2 text-xs font-mono tabular-nums">
            <span className="clinical-well px-2.5 py-1 text-[var(--text-secondary)]">
              Feed: <strong className="text-[var(--text-primary)] capitalize">{activeSource}</strong>
            </span>
            <span className="clinical-well px-2.5 py-1 text-[var(--text-secondary)]">
              Primary: <strong className="text-[var(--text-primary)]">{primaryCylinder.percentRemaining}%</strong>
            </span>
            <span className="clinical-well px-2.5 py-1 text-[var(--text-secondary)]">
              Backup: <strong className="text-[var(--text-primary)]">{secondaryCylinder.percentRemaining}%</strong>
            </span>
            <span className="clinical-well px-2.5 py-1 text-[var(--text-secondary)]">
              Reserve: <strong className="text-[var(--text-primary)]">{reserveBuffer.remainingSeconds}s</strong>
            </span>
            <span className="clinical-well px-2.5 py-1 text-[var(--text-secondary)]">
              SpO₂: <strong className="text-[var(--text-primary)]">{vitals.spo2}%</strong>
            </span>
          </div>
        </div>

        {onOpen3DTwin && (
          <div className="shrink-0">
            <button
              onClick={onOpen3DTwin}
              className="clinical-btn-primary px-5 py-2.5 text-xs inline-flex items-center gap-2"
            >
              <Box className="w-4 h-4" />
              <span>Open 3D Hardware Twin</span>
            </button>
          </div>
        )}
      </div>

      {/* Interactive Subsystem Grid */}
      <div className="clinical-card p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[var(--border-subtle)]">
          <div>
            <h2 className="text-base font-bold text-[var(--text-primary)] inline-flex items-center gap-2">
              <Layers className="w-4 h-4 text-[var(--accent-primary)]" />
              End-to-End Subsystem Stages
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Select a subsystem below to inspect control principles and verification parameters
            </p>
          </div>
          <span className="text-xs font-mono text-[var(--text-muted)]">6 Connected Stages</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {architectureNodes.map((node, index) => {
            const Icon = node.icon;
            const isSelected = selectedNode === node.id;
            return (
              <button
                key={node.id}
                onClick={() => setSelectedNode(node.id)}
                className={`p-4 rounded-xl border text-left transition-colors duration-150 ${
                  isSelected
                    ? 'bg-[var(--accent-soft)] border-[var(--accent-border)]'
                    : 'bg-[var(--surface-well)] hover:bg-[var(--surface-hover)] border-[var(--border-subtle)]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Icon
                    className={`w-4 h-4 ${
                      isSelected ? 'text-[var(--accent-primary)]' : 'text-[var(--text-muted)]'
                    }`}
                  />
                  <span className="text-[11px] font-mono text-[var(--text-muted)] tabular-nums">
                    Stage 0{index + 1}
                  </span>
                </div>
                <div className="text-xs sm:text-sm font-semibold text-[var(--text-primary)]">{node.title}</div>
                <div className="text-xs text-[var(--text-muted)] mt-0.5">{node.subtitle}</div>
              </button>
            );
          })}
        </div>

        {/* Selected Node Details */}
        <div className="clinical-well p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-[var(--text-primary)]">{activeNodeData.title}</h3>
            <span className="text-xs font-mono text-[var(--accent-primary)]">{activeNodeData.subtitle}</span>
          </div>

          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            {activeNodeData.description}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            {activeNodeData.techDetails.map((detail, i) => (
              <div
                key={i}
                className="p-2.5 rounded-lg bg-[var(--surface-card)] border border-[var(--border-subtle)] text-[11px] font-mono text-[var(--text-secondary)] flex items-start gap-2"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-[var(--accent-primary)] shrink-0 mt-0.5" />
                <span>{detail}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Transitions */}
      <div className="clinical-card p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[var(--border-subtle)]">
          <div>
            <h2 className="text-sm font-bold text-[var(--text-primary)]">Quick State Triggers</h2>
            <p className="text-xs text-[var(--text-muted)]">
              Demonstrate core failover and restoration states live
            </p>
          </div>

          <button
            onClick={resetSimulation}
            className="clinical-btn-secondary px-3 py-1.5 text-xs inline-flex items-center gap-1.5 self-start sm:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
            <span>Reset Baseline</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            ['normal', '1. Nominal Operation', 'Primary supplying 2.5 L/min at 135 bar; backup at 100%.'],
            ['auto_switch', '2. Backup Auto-Switch', 'Primary drops to threshold; valve transitions to B-2.'],
            ['reserve_active', '3. Reserve Continuity', 'Both cylinders exhausted; 5-minute inline buffer engages.'],
            ['restoration', '4. Supply Restoration', 'Fresh 150-bar tank connected; reserve buffer recharges.']
          ].map(([id, title, desc]) => (
            <button
              key={id}
              onClick={() => triggerScenario(id as 'normal' | 'auto_switch' | 'reserve_active' | 'restoration')}
              className="clinical-well p-3.5 hover:bg-[var(--surface-hover)] text-left transition-colors duration-150"
            >
              <div className="text-xs font-semibold text-[var(--text-primary)]">{title}</div>
              <p className="text-xs text-[var(--text-muted)] mt-1">{desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
