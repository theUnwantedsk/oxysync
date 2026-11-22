import React from 'react';
import { Cylinder, ShieldAlert, ArrowRightLeft, RefreshCw, Unplug, Plug, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import { useTelemetry } from '../../context/TelemetryContext';

export const OxygenSupplyPanel: React.FC = () => {
  const {
    primaryCylinder,
    secondaryCylinder,
    reserveBuffer,
    activeSource,
    switchActiveSource,
    refillCylinder,
    toggleCylinderConnection,
    settings
  } = useTelemetry();

  const getCylinderColor = (percent: number, isActive: boolean, connected: boolean) => {
    if (!connected) return { border: 'border-slate-800', bar: 'bg-slate-700', text: 'text-slate-500' };
    if (isActive) {
      if (percent > 20) return { border: 'border-cyan-500/60 shadow-lg shadow-cyan-500/10', bar: 'bg-cyan-400', text: 'text-cyan-400' };
      if (percent > 10) return { border: 'border-amber-500/60 shadow-lg shadow-amber-500/10', bar: 'bg-amber-400', text: 'text-amber-400' };
      return { border: 'border-red-500/70 shadow-lg shadow-red-500/20 animate-pulse', bar: 'bg-red-500', text: 'text-red-400' };
    }
    return { border: 'border-slate-800', bar: 'bg-slate-600', text: 'text-slate-400' };
  };

  const primaryColors = getCylinderColor(primaryCylinder.percentRemaining, activeSource === 'primary', primaryCylinder.connected);
  const secondaryColors = getCylinderColor(secondaryCylinder.percentRemaining, activeSource === 'secondary', secondaryCylinder.connected);

  return (
    <div className="bg-[#0c1220]/80 rounded-2xl border border-slate-800 p-5 shadow-xl backdrop-blur-md space-y-5">
      {/* Panel Header & Manual Switching Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center">
            <Cylinder className="w-4 h-4 text-teal-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Oxygen Supply Management
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                AUTO-FAILOVER: {settings.switchingThresholdPercent}% THRESHOLD
              </span>
            </h2>
            <p className="text-xs text-slate-400">Dual-cylinder failover and 5-minute failsafe reserve buffer telemetry</p>
          </div>
        </div>

        {/* Global Refill & Source Selector */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => refillCylinder('all')}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 flex items-center gap-1.5 transition-all"
            title="Simulate connecting fresh, full 150-bar cylinders"
          >
            <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Refill All Supplies</span>
          </button>
        </div>
      </div>

      {/* 3 Supply Source Cards Grid: Primary, Secondary, Reserve Buffer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* 1. PRIMARY CYLINDER */}
        <div className={`p-4 rounded-xl bg-[#080d1a] border transition-all duration-200 relative flex flex-col justify-between ${primaryColors.border}`}>
          {activeSource === 'primary' && (
            <div className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full text-[10px] font-black bg-cyan-500 text-slate-950 uppercase tracking-wider flex items-center gap-1 shadow-md">
              <CheckCircle2 className="w-3 h-3" /> ACTIVE FEED
            </div>
          )}

          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <Cylinder className="w-4 h-4 text-cyan-400" />
                Primary Cylinder (A-1)
              </span>
              <span className="font-mono text-[10px]">
                {primaryCylinder.connected ? 'CONNECTED' : 'DISCONNECTED'}
              </span>
            </div>

            {/* Percentage & Gauge */}
            <div className="flex items-baseline justify-between mt-1 mb-2">
              <div>
                <span className="text-3xl font-black text-white">{primaryCylinder.percentRemaining}%</span>
                <span className="text-xs text-slate-400 ml-1.5 font-mono">({Math.round(primaryCylinder.remainingGasLiters)}L Gas)</span>
              </div>
              <div className="text-right font-mono">
                <div className="text-sm font-bold text-slate-200">{primaryCylinder.currentPressureBar} bar</div>
                <div className="text-[10px] text-slate-400">{primaryCylinder.pressurePsi} PSI</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <div
                className={`h-full transition-all duration-500 ${primaryColors.bar}`}
                style={{ width: `${primaryCylinder.percentRemaining}%` }}
              />
            </div>

            {/* Runtime Estimate */}
            <div className="mt-3 flex items-center justify-between text-xs text-slate-300 font-mono bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
              <span className="flex items-center gap-1 text-slate-400 text-[11px]">
                <Clock className="w-3 h-3 text-cyan-400" /> Estimated Runtime:
              </span>
              <span className="font-bold text-white">
                {Math.floor(primaryCylinder.remainingMinutes / 60)}h {primaryCylinder.remainingMinutes % 60}m
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-2">
            <button
              disabled={activeSource === 'primary' || !primaryCylinder.connected || primaryCylinder.percentRemaining <= 0}
              onClick={() => switchActiveSource('primary', 'Manual Switch to Primary Cylinder')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                activeSource === 'primary'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 cursor-default'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed'
              }`}
            >
              <ArrowRightLeft className="w-3 h-3" />
              <span>{activeSource === 'primary' ? 'Supplying' : 'Switch To'}</span>
            </button>

            <button
              onClick={() => refillCylinder('primary')}
              title="Refill Primary to 150 bar"
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => toggleCylinderConnection('primary')}
              title={primaryCylinder.connected ? 'Disconnect Cylinder' : 'Connect Cylinder'}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white"
            >
              {primaryCylinder.connected ? <Unplug className="w-3.5 h-3.5 text-amber-400" /> : <Plug className="w-3.5 h-3.5 text-emerald-400" />}
            </button>
          </div>
        </div>

        {/* 2. SECONDARY CYLINDER (BACKUP) */}
        <div className={`p-4 rounded-xl bg-[#080d1a] border transition-all duration-200 relative flex flex-col justify-between ${secondaryColors.border}`}>
          {activeSource === 'secondary' && (
            <div className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full text-[10px] font-black bg-teal-500 text-slate-950 uppercase tracking-wider flex items-center gap-1 shadow-md">
              <CheckCircle2 className="w-3 h-3" /> ACTIVE FEED
            </div>
          )}

          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <Cylinder className="w-4 h-4 text-teal-400" />
                Secondary Cylinder (B-2)
              </span>
              <span className="font-mono text-[10px]">
                {secondaryCylinder.connected ? 'STANDBY READY' : 'DISCONNECTED'}
              </span>
            </div>

            {/* Percentage & Gauge */}
            <div className="flex items-baseline justify-between mt-1 mb-2">
              <div>
                <span className="text-3xl font-black text-white">{secondaryCylinder.percentRemaining}%</span>
                <span className="text-xs text-slate-400 ml-1.5 font-mono">({Math.round(secondaryCylinder.remainingGasLiters)}L Gas)</span>
              </div>
              <div className="text-right font-mono">
                <div className="text-sm font-bold text-slate-200">{secondaryCylinder.currentPressureBar} bar</div>
                <div className="text-[10px] text-slate-400">{secondaryCylinder.pressurePsi} PSI</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <div
                className={`h-full transition-all duration-500 ${secondaryColors.bar}`}
                style={{ width: `${secondaryCylinder.percentRemaining}%` }}
              />
            </div>

            {/* Runtime Estimate */}
            <div className="mt-3 flex items-center justify-between text-xs text-slate-300 font-mono bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
              <span className="flex items-center gap-1 text-slate-400 text-[11px]">
                <Clock className="w-3 h-3 text-teal-400" /> Estimated Runtime:
              </span>
              <span className="font-bold text-white">
                {Math.floor(secondaryCylinder.remainingMinutes / 60)}h {secondaryCylinder.remainingMinutes % 60}m
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-2">
            <button
              disabled={activeSource === 'secondary' || !secondaryCylinder.connected || secondaryCylinder.percentRemaining <= 0}
              onClick={() => switchActiveSource('secondary', 'Manual Switch to Secondary Backup Cylinder')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                activeSource === 'secondary'
                  ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30 cursor-default'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed'
              }`}
            >
              <ArrowRightLeft className="w-3 h-3" />
              <span>{activeSource === 'secondary' ? 'Supplying' : 'Switch To'}</span>
            </button>

            <button
              onClick={() => refillCylinder('secondary')}
              title="Refill Secondary to 150 bar"
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => toggleCylinderConnection('secondary')}
              title={secondaryCylinder.connected ? 'Disconnect Cylinder' : 'Connect Cylinder'}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white"
            >
              {secondaryCylinder.connected ? <Unplug className="w-3.5 h-3.5 text-amber-400" /> : <Plug className="w-3.5 h-3.5 text-emerald-400" />}
            </button>
          </div>
        </div>

        {/* 3. FIVE-MINUTE RESERVE BUFFER (The Original OXYSYNC Concept) */}
        <div className={`p-4 rounded-xl bg-[#080d1a] border transition-all duration-200 relative flex flex-col justify-between ${
          activeSource === 'reserve'
            ? 'border-red-500/80 shadow-lg shadow-red-500/20 animate-pulse bg-red-950/20'
            : (reserveBuffer.percentRemaining < 100 ? 'border-amber-500/40' : 'border-slate-800')
        }`}>
          {activeSource === 'reserve' && (
            <div className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full text-[10px] font-black bg-red-500 text-white uppercase tracking-wider flex items-center gap-1 shadow-md animate-bounce">
              <ShieldAlert className="w-3 h-3" /> EMERGENCY RESERVE ACTIVE
            </div>
          )}

          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <ShieldAlert className={`w-4 h-4 ${activeSource === 'reserve' ? 'text-red-400' : 'text-cyan-400'}`} />
                5-Min Reserve Buffer
              </span>
              <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${
                reserveBuffer.isRefilling ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-400'
              }`}>
                {reserveBuffer.isRefilling ? 'REFILLING' : 'PRIMED'}
              </span>
            </div>

            {/* Countdown / Percentage */}
            <div className="flex items-baseline justify-between mt-1 mb-2">
              <div>
                <span className="text-3xl font-black text-white">{reserveBuffer.percentRemaining}%</span>
                <span className="text-xs text-slate-400 ml-1.5 font-mono">({reserveBuffer.currentGasLiters.toFixed(1)}L / {reserveBuffer.capacityLiters}L)</span>
              </div>
              <div className="text-right font-mono">
                <div className={`text-sm font-bold ${activeSource === 'reserve' ? 'text-red-400 animate-pulse text-base' : 'text-slate-200'}`}>
                  {Math.floor(reserveBuffer.remainingSeconds / 60)}:{(reserveBuffer.remainingSeconds % 60).toString().padStart(2, '0')}
                </div>
                <div className="text-[10px] text-slate-400">Target: 05:00 min</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <div
                className={`h-full transition-all duration-500 ${
                  activeSource === 'reserve'
                    ? 'bg-red-500'
                    : (reserveBuffer.percentRemaining > 50 ? 'bg-cyan-400' : 'bg-amber-400')
                }`}
                style={{ width: `${reserveBuffer.percentRemaining}%` }}
              />
            </div>

            {/* Validation Disclaimer Notice */}
            <div className="mt-3 p-2 rounded-lg bg-slate-950/80 border border-slate-800/80 text-[10px] text-slate-400 leading-tight">
              <div className="flex items-start gap-1">
                <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Original Concept:</strong> 5-min duration is a design target providing temporary continuity during cylinder swap. Requires physical clinical validation.
                </span>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-2">
            <button
              onClick={() => switchActiveSource('reserve', 'Manual Activation of 5-Min Reserve Buffer', 'emergency_failover')}
              disabled={activeSource === 'reserve' || reserveBuffer.percentRemaining <= 0}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                activeSource === 'reserve'
                  ? 'bg-red-500/20 text-red-400 border border-red-500/40 cursor-default'
                  : 'bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/50'
              }`}
            >
              <ShieldAlert className="w-3 h-3" />
              <span>{activeSource === 'reserve' ? 'Discharging Reserve' : 'Engage Reserve Buffer'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
