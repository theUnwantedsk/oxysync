import React from 'react';
import { useTelemetry } from '../context/TelemetryContext';
import { Gauge, Clock, Cpu, AlertTriangle } from 'lucide-react';

export const OxygenSupplySection: React.FC = () => {
  const { supply, setSourceType, prescription } = useTelemetry();

  const isCylinder = supply.sourceType === 'cylinder';
  const hoursLeft = Math.floor(supply.remainingRuntimeMinutes / 60);
  const minutesLeft = supply.remainingRuntimeMinutes % 60;

  // Derive status colors
  let pressureColor = 'text-emerald-400';
  let runtimeColor = 'text-cyan-300';
  let tankBorder = 'border-slate-800';

  if (isCylinder) {
    if (supply.remainingRuntimeMinutes <= 15) {
      pressureColor = 'text-rose-400';
      runtimeColor = 'text-rose-400 animate-pulse';
      tankBorder = 'border-rose-500/40 bg-rose-500/5';
    } else if (supply.remainingRuntimeMinutes <= 35) {
      pressureColor = 'text-amber-400';
      runtimeColor = 'text-amber-300';
      tankBorder = 'border-amber-500/30 bg-amber-500/5';
    }
  }

  return (
    <div className={`bg-[#0b1424] border ${tankBorder} rounded-2xl p-5 shadow-xl transition-colors`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
            <Gauge className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Oxygen Supply Telemetry
            </h2>
            <p className="text-xs text-slate-400">
              Flow Rate, Reservoir Pressure & Depletion Physics
            </p>
          </div>
        </div>

        {/* Source selector: Cylinder vs Concentrator */}
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
          <button
            onClick={() => setSourceType('cylinder')}
            className={`px-3 py-1 rounded-md font-semibold transition-colors ${
              isCylinder 
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Pressurized Cylinder
          </button>
          <button
            onClick={() => setSourceType('concentrator')}
            className={`px-3 py-1 rounded-md font-semibold transition-colors ${
              !isCylinder 
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Oxygen Concentrator
          </button>
        </div>
      </div>

      {/* Grid of Supply Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Metric 1: Current Flow Rate & Mechatronic Valve */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-slate-400 tracking-wider">DELIVERY FLOW RATE</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                prescription.titrationMode === 'auto'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
              }`}>
                {prescription.titrationMode.toUpperCase()} TITRATION
              </span>
            </div>

            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-4xl sm:text-5xl font-extrabold font-mono tracking-tight text-emerald-400">
                {supply.flowRate.toFixed(1)}
              </span>
              <span className="text-sm font-bold text-slate-400">L/min</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                <span>Servo Valve Actuator:</span>
              </span>
              <span className="font-mono text-cyan-300 font-bold">{supply.valvePositionPercent}% Open</span>
            </div>

            {/* Stepper indicator bar */}
            <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
              <div 
                className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(5, supply.valvePositionPercent))}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>0 L/min</span>
              <span>Prescribed: {prescription.minAllowedFlow}-{prescription.maxAllowedFlow} L/min</span>
              <span>10 L/min</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Cylinder / Source Pressure */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-slate-400 tracking-wider">
                {isCylinder ? 'CYLINDER TANK PRESSURE' : 'CONCENTRATOR DELIVERY'}
              </span>
              <span className="text-xs font-bold text-slate-400 font-mono">
                {isCylinder ? `${supply.pressureBar} BAR` : 'CONSTANT'}
              </span>
            </div>

            <div className="flex items-baseline gap-2 mt-2">
              <span className={`text-4xl sm:text-5xl font-extrabold font-mono tracking-tight ${pressureColor}`}>
                {isCylinder ? supply.pressurePsi : '45'}
              </span>
              <span className="text-sm font-bold text-slate-400">PSI</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80">
            {isCylinder ? (
              <>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                  <span>Tank Gas Volume:</span>
                  <span className="font-mono text-slate-200 font-semibold">{supply.remainingGasLiters} L / 680 L</span>
                </div>

                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      supply.cylinderPercent > 30 
                        ? 'bg-emerald-400' 
                        : supply.cylinderPercent > 15 
                        ? 'bg-amber-400' 
                        : 'bg-rose-500 animate-pulse'
                    }`}
                    style={{ width: `${supply.cylinderPercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>Empty (0 PSI)</span>
                  <span>{supply.cylinderPercent}% Full</span>
                  <span>Full (2000 PSI)</span>
                </div>
              </>
            ) : (
              <div className="text-xs text-slate-400 py-2">
                <span className="text-emerald-400 font-semibold">Continuous Generation:</span> Powered molecular sieve concentrator delivers continuous medical oxygen with no pressure tank limits.
              </div>
            )}
          </div>
        </div>

        {/* Metric 3: Remaining Runtime Estimation */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-slate-400 tracking-wider">ESTIMATED RUNTIME</span>
              <Clock className="w-4 h-4 text-cyan-400" />
            </div>

            <div className="mt-2">
              {isCylinder ? (
                <div className="flex items-baseline gap-2">
                  <span className={`text-4xl sm:text-5xl font-extrabold font-mono tracking-tight ${runtimeColor}`}>
                    {hoursLeft}h {minutesLeft.toString().padStart(2, '0')}m
                  </span>
                  <span className="text-xs font-bold text-slate-400">left</span>
                </div>
              ) : (
                <div className="text-3xl font-extrabold text-cyan-300 font-mono tracking-tight">
                  Continuous
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80">
            {isCylinder ? (
              <div>
                <p className="text-xs text-slate-400 mb-2 leading-relaxed">
                  Based on current flow ({supply.flowRate} L/min) and Boyle&apos;s cylinder depletion model.
                </p>
                {supply.remainingRuntimeMinutes <= 35 && (
                  <div className="p-2 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>Low tank! Prepare standby cylinder now.</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-slate-400">
                Mains powered (230V / 50Hz) or Backup Battery. Unlimited runtime as long as electrical supply is active.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
