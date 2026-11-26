import React from 'react';
import { 
  PlayCircle, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Info, 
  ArrowRight,
  Layers
} from 'lucide-react';
import { useTelemetry } from '../../context/TelemetryContext';
import { SCENARIO_DEFINITIONS } from '../../services/scenarioData';
import { EmergencyScenarioId } from '../../types/telemetry';

export const LiveDemonstrationView: React.FC = () => {
  const {
    activeScenario,
    lastScenarioUpdatedAt,
    triggerScenario,
    resetSimulation,
    primaryCylinder,
    secondaryCylinder,
    reserveBuffer,
    vitals,
    activeSource
  } = useTelemetry();

  const scenarioList = Object.values(SCENARIO_DEFINITIONS);

  const handleSelectScenario = (id: EmergencyScenarioId) => {
    triggerScenario(id);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Reset Action */}
      <div className="bg-[#0c1220]/80 rounded-2xl border border-slate-800 p-5 shadow-xl backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
              <PlayCircle className="w-4 h-4 text-cyan-400" />
            </div>
            <h1 className="text-xl font-bold text-white">Live Demonstration & Emergency Simulation Lab</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
              8 TEST SCENARIOS
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Deterministic state injection testbed verifying failover logic, 5-minute reserve activation, and caregiver telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={resetSimulation}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-500 hover:to-teal-400 text-slate-950 flex items-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-95 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>RESET SIMULATION TO NOMINAL</span>
          </button>
        </div>
      </div>

      {/* 8 One-Click Scenario Selectors Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {scenarioList.map((sc) => {
          const isCurrent = activeScenario.id === sc.id;
          return (
            <button
              key={sc.id}
              onClick={() => handleSelectScenario(sc.id)}
              className={`p-3.5 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                isCurrent
                  ? 'bg-gradient-to-br from-cyan-950/60 to-slate-900 border-cyan-400 shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400/50'
                  : 'bg-[#080d1a] border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold ${
                    isCurrent ? 'bg-cyan-400 text-slate-950' : 'bg-slate-800 text-slate-400'
                  }`}>
                    SCENARIO #{sc.stepNumber}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">{sc.badge}</span>
                </div>

                <h3 className={`text-xs font-bold ${isCurrent ? 'text-white' : 'text-slate-200'}`}>
                  {sc.title}
                </h3>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {sc.subtitle}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono">
                <span className={isCurrent ? 'text-cyan-300 font-bold' : 'text-slate-500'}>
                  {isCurrent ? '● CURRENTLY ACTIVE' : 'Click to Inject'}
                </span>
                <ArrowRight className={`w-3 h-3 ${isCurrent ? 'text-cyan-400' : 'text-slate-600'}`} />
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Scenario Detailed Breakdown */}
      <div className="bg-[#0c1220]/90 rounded-2xl border border-cyan-500/40 p-6 shadow-2xl backdrop-blur-md space-y-6">
        
        {/* Scenario Header Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-cyan-500 text-slate-950">
                SCENARIO #{activeScenario.stepNumber}
              </span>
              <h2 className="text-lg font-black text-white">{activeScenario.title}</h2>
              <span className="px-2 py-0.5 rounded text-xs font-mono bg-slate-800 text-slate-300">
                {activeScenario.badge}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">{activeScenario.subtitle}</p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>State Mutated at {lastScenarioUpdatedAt}</span>
          </div>
        </div>

        {/* 3 Narrative Cards: What Happened / Why It Happened / System Response */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* 1. What Happened */}
          <div className="p-4 rounded-xl bg-[#080d1a] border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-cyan-300">
              <Info className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>1. WHAT HAPPENED</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              {activeScenario.whatHappened}
            </p>
          </div>

          {/* 2. Why It Happened */}
          <div className="p-4 rounded-xl bg-[#080d1a] border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>2. WHY IT HAPPENED</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              {activeScenario.whyItHappened}
            </p>
          </div>

          {/* 3. System Response */}
          <div className="p-4 rounded-xl bg-[#080d1a] border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>3. SYSTEM RESPONSE</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              {activeScenario.systemResponse}
            </p>
          </div>

        </div>

        {/* Current Supply & Clinical Configuration Snapshot */}
        <div className="p-4 rounded-xl bg-[#060a14] border border-slate-800 space-y-3">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            Current Live Application State Snapshot
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {/* Primary Status */}
            <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
              <div className="text-[10px] text-slate-400 font-mono">PRIMARY CYLINDER</div>
              <div className="text-base font-bold text-white mt-0.5">{primaryCylinder.percentRemaining}%</div>
              <div className="text-[10px] text-slate-400 font-mono">{primaryCylinder.currentPressureBar} bar · {activeSource === 'primary' ? 'FEEDING' : 'ISOLATED'}</div>
            </div>

            {/* Secondary Status */}
            <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
              <div className="text-[10px] text-slate-400 font-mono">BACKUP CYLINDER</div>
              <div className="text-base font-bold text-white mt-0.5">{secondaryCylinder.percentRemaining}%</div>
              <div className="text-[10px] text-slate-400 font-mono">{secondaryCylinder.currentPressureBar} bar · {activeSource === 'secondary' ? 'FEEDING' : 'STANDBY'}</div>
            </div>

            {/* Reserve Buffer Status */}
            <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
              <div className="text-[10px] text-slate-400 font-mono">5-MIN RESERVE BUFFER</div>
              <div className={`text-base font-bold mt-0.5 ${activeSource === 'reserve' ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                {reserveBuffer.percentRemaining}% ({Math.floor(reserveBuffer.remainingSeconds / 60)}:{(reserveBuffer.remainingSeconds % 60).toString().padStart(2, '0')})
              </div>
              <div className="text-[10px] text-slate-400 font-mono">{reserveBuffer.currentGasLiters.toFixed(1)}L · {activeSource === 'reserve' ? 'DISCHARGING' : 'PRIMED'}</div>
            </div>

            {/* Patient Vitals */}
            <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
              <div className="text-[10px] text-slate-400 font-mono">PATIENT VITALS [SIM]</div>
              <div className={`text-base font-bold mt-0.5 ${vitals.spo2 < 90 ? 'text-red-400' : 'text-emerald-400'}`}>
                SpO₂: {vitals.spo2}% · {vitals.pulseRate} BPM
              </div>
              <div className="text-[10px] text-slate-400 font-mono">Status: {vitals.patientStatus.toUpperCase()}</div>
            </div>
          </div>
        </div>

        {/* Step-by-Step Animated Sequence of Events */}
        <div className="p-4 rounded-xl bg-[#080d1a] border border-slate-800 space-y-4">
          <div className="flex items-center justify-between text-xs font-bold text-slate-200">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              Automated Mechatronic Execution Sequence ({activeScenario.sequenceSteps.length} Steps)
            </span>
            <span className="text-[10px] font-mono text-slate-400">Sequential Logic Progression</span>
          </div>

          <div className="space-y-2.5">
            {activeScenario.sequenceSteps.map((step, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 rounded-lg bg-slate-900/70 border border-slate-800 text-xs transition-all hover:border-cyan-500/40"
              >
                <div className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-mono font-black flex items-center justify-center shrink-0 text-[11px]">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <p className="text-slate-200 leading-relaxed font-mono">{step}</p>
                </div>
                <div className="shrink-0 text-emerald-400 flex items-center gap-1 font-mono text-[10px]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>VERIFIED</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
