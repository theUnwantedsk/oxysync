import React, { useState } from 'react';
import { 
  MonitorPlay, 
  Activity, 
  ArrowRight, 
  CheckCircle2, 
  ShieldAlert, 
  Cylinder, 
  Heart, 
  Cpu, 
  Bell, 
  Layers, 
  TrendingUp, 
  RotateCcw,
  Sparkles,
  Info
} from 'lucide-react';
import { useTelemetry } from '../../context/TelemetryContext';

interface ArchNode {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  color: string;
  description: string;
  techDetails: string[];
}

export const PresentationModeView: React.FC = () => {
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
      title: '1. Patient Monitoring Simulator',
      subtitle: 'Physiological Telemetry Source',
      icon: Heart,
      color: 'from-rose-500/20 to-pink-500/10 border-rose-500/40 text-rose-400',
      description: 'Generates real-time patient physiological signals (SpO₂ saturation 70-100%, pulse rate 40-200 BPM, plethysmographic waveform) using mathematical wave models with clinical bounds.',
      techDetails: [
        'Deterministic mathematical waveform at 60 FPS',
        'Hypoxemia trigger detection thresholds (< 90% SpO₂)',
        'Simulated PPG plethysmograph with QRS pulse detection'
      ]
    },
    {
      id: 'engine',
      title: '2. OXYSYNC Control Engine',
      subtitle: 'Central Telemetry & Decision Kernel',
      icon: Cpu,
      color: 'from-cyan-500/20 to-blue-500/10 border-cyan-500/40 text-cyan-400',
      description: 'The core state machine that coordinates multi-source gas telemetry, manages valve interlocks, evaluates auto-switch conditions, and interfaces with the audio alarm synthesizer.',
      techDetails: [
        'Millisecond-level failover state machine',
        'Auto-switch threshold comparator (default 10%)',
        'IEC 60601-1-8 medical alarm triage engine'
      ]
    },
    {
      id: 'prediction',
      title: '3. Oxygen Supply Prediction',
      subtitle: 'Boyle\'s Law Depletion Modeling',
      icon: TrendingUp,
      color: 'from-teal-500/20 to-emerald-500/10 border-teal-500/40 text-teal-400',
      description: 'Calculates exact remaining runtimes based on instantaneous cylinder pressure, water-volume capacity, and patient flow demand. Displays transparent mathematical formulas.',
      techDetails: [
        'V_gas = P_bar × V_water (Liters NTP)',
        'T_duration = V_gas / Q_flow (Minutes)',
        'Continuous extrapolation of threshold crossing timestamps'
      ]
    },
    {
      id: 'manager',
      title: '4. Primary/Backup Supply Manager',
      subtitle: 'Automated Dual-Cylinder Solenoid Failover',
      icon: Cylinder,
      color: 'from-indigo-500/20 to-violet-500/10 border-indigo-500/40 text-indigo-400',
      description: 'Monitors differential pressures across Primary (A-1) and Secondary (B-2) manifolds. Automatically energizes backup solenoid valves without clinical delivery interruption.',
      techDetails: [
        'Dual solenoid valve interlock (V-1 & V-2)',
        'Zero-drop continuous manifold flow maintenance',
        'One-click technician cylinder refill simulation'
      ]
    },
    {
      id: 'reserve',
      title: '5. Reserve Buffer Manager',
      subtitle: 'Conceptual 5-Minute Continuity Bridge',
      icon: ShieldAlert,
      color: 'from-amber-500/20 to-orange-500/10 border-amber-500/40 text-amber-400',
      description: 'The flagship OXYSYNC innovation: a 12.5-liter buffer conceptually designed to bridge the critical supply gap during physical cylinder replacement or supply line severance.',
      techDetails: [
        '12.5L capacity = 5.0 min at 2.5 L/min design target',
        'Autonomous failsafe inline check-valve actuation',
        'Automatic bleed-valve recharge when supply is restored'
      ]
    },
    {
      id: 'caregiver',
      title: '6. Alert & Caregiver Interface',
      subtitle: 'Telemetry Broadcast & Remote Alerts',
      icon: Bell,
      color: 'from-fuchsia-500/20 to-purple-500/10 border-fuchsia-500/40 text-fuchsia-400',
      description: 'Translates technical mechatronic sensor data into reassuring, plain-language advisories for family members and hospital attendants via browser push notifications and alarms.',
      techDetails: [
        'Web Audio API synthesizer (sine & triangle alarm waves)',
        'Browser Push Notification API integration',
        'Emergency countdown timers and cylinder replacement prompts'
      ]
    }
  ];

  const activeNodeData = architectureNodes.find(n => n.id === selectedNode) || architectureNodes[1];

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-2">
      
      {/* Hero Header for Exhibition Judges */}
      <div className="text-center space-y-3 py-6 px-4 bg-gradient-to-b from-[#0e172a] to-[#070b14] rounded-3xl border border-cyan-500/30 shadow-2xl relative overflow-hidden">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold">
          <Sparkles className="w-3.5 h-3.5" />
          COLLEGE ENGINEERING EXHIBITION SHOWCASE
        </div>

        <div className="flex items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 to-teal-400 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Activity className="w-7 h-7 text-slate-950 font-black" />
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">OXYSYNC 2.0</h1>
        </div>

        <p className="text-base sm:text-lg text-cyan-300 font-semibold tracking-wide">
          Intelligent Oxygen. Continuous Care.
        </p>
        <p className="max-w-2xl mx-auto text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
          A next-generation healthcare mechatronics concept solving unexpected oxygen cylinder exhaustion through predictive depletion telemetry, automated dual-cylinder failover, and a conceptual 5-minute failsafe reserve bridge.
        </p>

        {/* Status pill strip */}
        <div className="pt-2 flex items-center justify-center gap-3 flex-wrap text-xs font-mono">
          <span className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
            Active Supply: <strong className="text-cyan-400 uppercase">{activeSource}</strong>
          </span>
          <span className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
            Primary: <strong className="text-cyan-400">{primaryCylinder.percentRemaining}%</strong>
          </span>
          <span className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
            Backup: <strong className="text-teal-400">{secondaryCylinder.percentRemaining}%</strong>
          </span>
          <span className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
            5-Min Buffer: <strong className="text-amber-400">{reserveBuffer.remainingSeconds}s</strong>
          </span>
          <span className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
            Patient SpO₂: <strong className={vitals.spo2 < 90 ? 'text-red-400' : 'text-emerald-400'}>{vitals.spo2}%</strong>
          </span>
        </div>
      </div>

      {/* System Architecture Diagram (Exact Requested Flow) */}
      <div className="bg-[#080d1a] p-6 rounded-3xl border border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-cyan-400" />
              Complete End-to-End System Architecture
            </h2>
            <p className="text-xs text-slate-400">
              Click any architecture node below to inspect its mechatronic signal flow, math, and verification criteria.
            </p>
          </div>
          <span className="text-xs font-mono text-cyan-400">
            6 Connected Subsystems
          </span>
        </div>

        {/* Architecture Node Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {architectureNodes.map((node, index) => {
            const Icon = node.icon;
            const isSelected = selectedNode === node.id;
            return (
              <button
                key={node.id}
                onClick={() => setSelectedNode(node.id)}
                className={`p-4 rounded-2xl border text-left transition-all duration-200 relative ${
                  isSelected
                    ? `bg-gradient-to-br ${node.color} shadow-lg ring-1 ring-cyan-400`
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-cyan-400" />
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">STAGE 0{index + 1}</span>
                </div>

                <div className="font-bold text-xs text-white">{node.title}</div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">{node.subtitle}</div>

                <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-cyan-300">
                  <span>{isSelected ? '● Inspected' : 'Click to inspect'}</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Interactive Node Detail Inspector Panel */}
        <div className="p-5 rounded-2xl bg-[#060a14] border border-cyan-500/30 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Info className="w-4 h-4 text-cyan-400" />
              Subsystem Inspector: {activeNodeData.title}
            </h3>
            <span className="text-xs font-mono text-cyan-300 px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800">
              {activeNodeData.subtitle}
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            {activeNodeData.description}
          </p>

          <div className="space-y-1.5 pt-1">
            <div className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wide">
              Technical Specifications & Control Principles:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {activeNodeData.techDetails.map((detail, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] font-mono text-slate-300 flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                  <span>{detail}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Live Exhibition Interactive Demonstration Widget */}
      <div className="bg-[#080d1a] p-6 rounded-3xl border border-slate-800 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <MonitorPlay className="w-5 h-5 text-cyan-400" />
              Live Interactive Exhibition Demonstration Controls
            </h2>
            <p className="text-xs text-slate-400">
              Trigger key mechatronic transitions live in front of exhibition judges.
            </p>
          </div>

          <button
            onClick={resetSimulation}
            className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Reset To Baseline</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          <button
            onClick={() => triggerScenario('normal')}
            className="p-3.5 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/50 text-left transition-all"
          >
            <div className="text-xs font-bold text-white">1. Normal Stable Operation</div>
            <p className="text-[11px] text-slate-400 mt-1">Both cylinders ready. Primary delivering 2.5 L/min at 135 bar.</p>
          </button>

          <button
            onClick={() => triggerScenario('auto_switch')}
            className="p-3.5 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-teal-500/50 text-left transition-all"
          >
            <div className="text-xs font-bold text-white">2. Automatic Backup Switching</div>
            <p className="text-[11px] text-slate-400 mt-1">Primary hits 10% threshold; valve transitions smoothly to backup.</p>
          </button>

          <button
            onClick={() => triggerScenario('reserve_active')}
            className="p-3.5 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-red-500/50 text-left transition-all"
          >
            <div className="text-xs font-bold text-white">3. Reserve Buffer Engagement</div>
            <p className="text-[11px] text-slate-400 mt-1">Simulates both supplies exhausted; 5-min reserve countdown begins.</p>
          </button>

          <button
            onClick={() => triggerScenario('restoration')}
            className="p-3.5 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/50 text-left transition-all"
          >
            <div className="text-xs font-bold text-white">4. Supply Restoration & Refill</div>
            <p className="text-[11px] text-slate-400 mt-1">Fresh 150-bar cylinder connected; reserve buffer recharges automatically.</p>
          </button>

        </div>
      </div>

    </div>
  );
};
