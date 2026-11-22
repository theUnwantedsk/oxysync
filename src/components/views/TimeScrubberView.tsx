import React, { useState } from 'react';
import { 
  Clock, 
  FastForward, 
  RotateCcw, 
  Sliders, 
  Zap, 
  Timer, 
  Flame
} from 'lucide-react';
import { useTelemetry } from '../../context/TelemetryContext';
import { calculateStateAtTimelineOffset } from '../../services/physicsEngine';

export const TimeScrubberView: React.FC = () => {
  const {
    primaryCylinder,
    secondaryCylinder,
    reserveBuffer,
    settings,
    predictions,
    jumpTimeForwardMinutes,
    setSimulationSpeed,
    masterClockMs,
    therapyElapsedFormatted,
    resetSimulation
  } = useTelemetry();

  const [scrubMinutes, setScrubMinutes] = useState<number>(0);

  // Compute preview state at scrubMinutes offset
  const scrubbedState = calculateStateAtTimelineOffset(
    scrubMinutes,
    primaryCylinder.maxPressureBar * primaryCylinder.waterCapacityLiters,
    secondaryCylinder.maxPressureBar * secondaryCylinder.waterCapacityLiters,
    reserveBuffer.capacityLiters,
    settings.flowRateLpm,
    settings.switchingThresholdPercent
  );

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-[#0c1220]/80 rounded-2xl border border-slate-800 p-5 shadow-xl backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
              <Timer className="w-4 h-4 text-cyan-400" />
            </div>
            <h1 className="text-xl font-bold text-white">Precision Chronometer & Depletion Time-Machine</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
              TIME-WARP CONTROLLER
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Scrub forward in time, fast-forward simulation speed, and predict exact cylinder depletion moments with sub-second accuracy.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={resetSimulation}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Reset Clock</span>
          </button>
        </div>
      </div>

      {/* High-Precision Master Clocks Showcase */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* 1. Real-Time Clock with Milliseconds */}
        <div className="p-5 rounded-2xl bg-[#080d1a] border border-cyan-500/40 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-2">
            <span className="flex items-center gap-1.5 text-cyan-400 font-bold">
              <Clock className="w-4 h-4" />
              MASTER SYSTEM CLOCK
            </span>
            <span className="text-[10px] bg-cyan-950 px-1.5 py-0.5 rounded text-cyan-300">20 Hz RTC</span>
          </div>
          <div className="text-3xl sm:text-4xl font-black font-mono text-white tracking-tight">
            {masterClockMs || '18:45:00.00'}
          </div>
          <div className="mt-2 text-[11px] text-slate-400 font-mono">
            Synchronized to local system hardware clock
          </div>
        </div>

        {/* 2. Therapy Session Elapsed Chronometer */}
        <div className="p-5 rounded-2xl bg-[#080d1a] border border-teal-500/40 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-2">
            <span className="flex items-center gap-1.5 text-teal-400 font-bold">
              <Timer className="w-4 h-4" />
              THERAPY ELAPSED
            </span>
            <span className="text-[10px] bg-teal-950 px-1.5 py-0.5 rounded text-teal-300">ACTIVE SESSION</span>
          </div>
          <div className="text-3xl sm:text-4xl font-black font-mono text-cyan-300 tracking-tight">
            {therapyElapsedFormatted}
          </div>
          <div className="mt-2 text-[11px] text-slate-400 font-mono">
            Elapsed delivery since simulation started
          </div>
        </div>

        {/* 3. Total Depletion Precision Countdown */}
        <div className="p-5 rounded-2xl bg-[#080d1a] border border-amber-500/40 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-2">
            <span className="flex items-center gap-1.5 text-amber-400 font-bold">
              <Flame className="w-4 h-4" />
              TOTAL DEPLETION COUNTDOWN
            </span>
            <span className="text-[10px] bg-amber-950 px-1.5 py-0.5 rounded text-amber-300">ESTIMATED</span>
          </div>
          <div className="text-3xl sm:text-4xl font-black font-mono text-amber-300 tracking-tight">
            {predictions.formattedCountdown}
          </div>
          <div className="mt-2 text-[11px] text-slate-400 font-mono">
            Projected zero-pressure at {predictions.totalSystemDepletionTimeStr}
          </div>
        </div>

      </div>

      {/* Interactive Time-Machine Scrubber Slider */}
      <div className="bg-[#080d1a] p-6 rounded-3xl border border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-cyan-400" />
              Interactive Depletion Timeline Scrubber
            </h2>
            <p className="text-xs text-slate-400">
              Drag the scrubber to inspect simulated cylinder states at any future point in the therapy timeline.
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-slate-400">Inspecting:</span>
            <span className="px-3 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40">
              + {scrubMinutes} Minutes ({Math.floor(scrubMinutes / 60)}h {scrubMinutes % 60}m Ahead)
            </span>
          </div>
        </div>

        {/* Range Slider */}
        <div className="space-y-2">
          <input
            type="range"
            min="0"
            max="360"
            step="5"
            value={scrubMinutes}
            onChange={(e) => setScrubMinutes(parseInt(e.target.value, 10))}
            className="w-full accent-cyan-400 cursor-pointer h-3 bg-slate-800 rounded-lg"
          />
          <div className="flex justify-between text-[11px] font-mono text-slate-500">
            <span>Now (0m)</span>
            <span>+1 Hour</span>
            <span>+2 Hours (Auto-Switch Zone)</span>
            <span>+4 Hours</span>
            <span>+6 Hours (Depletion Zone)</span>
          </div>
        </div>

        {/* Scrubbed Prediction Preview Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
            <div className="text-slate-400 text-[10px]">PRIMARY AT +{scrubMinutes}m</div>
            <div className="text-2xl font-black text-white mt-1">{scrubbedState.primaryPercent}%</div>
            <div className="text-[10px] text-slate-500 mt-1">
              {scrubbedState.primaryPercent <= settings.switchingThresholdPercent ? 'TRIGGERED FAILOVER' : 'ACTIVE'}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
            <div className="text-slate-400 text-[10px]">BACKUP AT +{scrubMinutes}m</div>
            <div className="text-2xl font-black text-white mt-1">{scrubbedState.secondaryPercent}%</div>
            <div className="text-[10px] text-slate-500 mt-1">
              {scrubbedState.activeSrc === 'secondary' ? 'FEEDING' : (scrubbedState.secondaryPercent === 0 ? 'DEPLETED' : 'STANDBY')}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
            <div className="text-slate-400 text-[10px]">5-MIN RESERVE AT +{scrubMinutes}m</div>
            <div className={`text-2xl font-black mt-1 ${scrubbedState.activeSrc === 'reserve' ? 'text-red-400 animate-pulse' : 'text-white'}`}>
              {scrubbedState.reservePercent}%
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              {scrubbedState.activeSrc === 'reserve' ? 'DISCHARGING' : 'CHARGED (12.5L)'}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
            <div className="text-slate-400 text-[10px]">ACTIVE FEED AT +{scrubMinutes}m</div>
            <div className="text-xl font-black text-cyan-400 uppercase mt-1">
              {scrubbedState.activeSrc}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              {scrubbedState.activeSrc === 'none' ? 'CRITICAL EXHAUSTION' : 'NOMINAL DELIVERY'}
            </div>
          </div>

        </div>
      </div>

      {/* Time-Warp Controls & Fast-Forward Jumps */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Fast Time-Jump Buttons */}
        <div className="p-5 rounded-2xl bg-[#080d1a] border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <FastForward className="w-4 h-4 text-cyan-400" />
              Instant Time Jumps (Fast-Forward Simulation)
            </h3>
          </div>
          <p className="text-[11px] text-slate-400">
            Immediately advances the live physics simulation state forward in time to demonstrate depletion milestones.
          </p>

          <div className="grid grid-cols-4 gap-2 pt-1 font-mono">
            {[15, 30, 60, 120].map((mins) => (
              <button
                key={mins}
                onClick={() => jumpTimeForwardMinutes(mins)}
                className="py-2.5 px-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 hover:text-white transition-all active:scale-95"
              >
                +{mins} Mins
              </button>
            ))}
          </div>
        </div>

        {/* Continuous Simulation Clock Multipliers */}
        <div className="p-5 rounded-2xl bg-[#080d1a] border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              Continuous Time-Warp Multiplier
            </h3>
            <span className="font-mono text-xs font-bold text-amber-300 px-2 py-0.5 rounded bg-amber-950 border border-amber-800">
              {settings.simulationSpeed}x Live
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Select clock multiplier to accelerate Boyle's physics rate in real time without clicking jumps.
          </p>

          <div className="grid grid-cols-6 gap-1.5 pt-1 font-mono">
            {[0.5, 1, 5, 10, 30, 60].map((spd) => (
              <button
                key={spd}
                onClick={() => setSimulationSpeed(spd)}
                className={`py-2 rounded-xl text-xs font-bold transition-all ${
                  settings.simulationSpeed === spd
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
