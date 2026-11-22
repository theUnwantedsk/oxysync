import React from 'react';
import { 
  ShieldCheck, 
  Clock, 
  ArrowRightLeft, 
  Bell, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  Flame, 
  Layers
} from 'lucide-react';
import { useTelemetry } from '../../context/TelemetryContext';

export const SystemOverviewPanel: React.FC = () => {
  const {
    systemMode,
    activeSource,
    primaryCylinder,
    secondaryCylinder,
    reserveBuffer,
    switchingHistory,
    alerts,
    predictions,
    acknowledgeAlert
  } = useTelemetry();

  const totalGasLiters = Math.round(primaryCylinder.remainingGasLiters + secondaryCylinder.remainingGasLiters + reserveBuffer.currentGasLiters);
  const lastSwitch = switchingHistory[0];

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">CRITICAL</span>;
      case 'warning':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">WARNING</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">ADVISORY</span>;
    }
  };

  return (
    <div className="bg-[#0c1220]/80 rounded-2xl border border-slate-800 p-5 shadow-xl backdrop-blur-md space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">
            <Layers className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              System Overview & Failover Audit
            </h2>
            <p className="text-xs text-slate-400">Continuous availability metrics, operating mode, and switching event log</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-400">MODE:</span>
          <span className="px-2.5 py-0.5 rounded text-xs font-black tracking-wide bg-gradient-to-r from-cyan-500/20 to-teal-500/20 text-cyan-300 border border-cyan-500/40 uppercase">
            {systemMode.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* Total Supply Availability */}
        <div className="p-3.5 rounded-xl bg-[#080d1a] border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-cyan-400" />
              Total Gas Available
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-white">{totalGasLiters}</span>
            <span className="text-xs text-slate-400 font-mono">Liters (NTP)</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400 font-mono">
            {Math.round((primaryCylinder.remainingGasLiters / (150 * primaryCylinder.waterCapacityLiters)) * 100)}% Prim · {Math.round((secondaryCylinder.remainingGasLiters / (150 * secondaryCylinder.waterCapacityLiters)) * 100)}% Sec
          </div>
        </div>

        {/* Depletion Forecast */}
        <div className="p-3.5 rounded-xl bg-[#080d1a] border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-teal-400" />
              Total System Runtime
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-white">
              {Math.floor(predictions.totalSystemMinutes / 60)}h {predictions.totalSystemMinutes % 60}m
            </span>
          </div>
          <div className="mt-1 text-[11px] text-cyan-400 font-mono">
            Depletion at {predictions.totalSystemDepletionTimeStr}
          </div>
        </div>

        {/* Active Supply Path */}
        <div className="p-3.5 rounded-xl bg-[#080d1a] border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Active Supply Feed
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-black text-white uppercase">{activeSource}</span>
            <span className="text-xs text-emerald-400 font-mono">(Valve Open)</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400 font-mono">
            Cannula: {predictions.flowRateLpm.toFixed(1)} L/min delivery
          </div>
        </div>

        {/* Last Switch Event */}
        <div className="p-3.5 rounded-xl bg-[#080d1a] border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold flex items-center gap-1">
              <ArrowRightLeft className="w-3.5 h-3.5 text-amber-400" />
              Last Switch Event
            </span>
          </div>
          <div className="text-xs font-bold text-white truncate">
            {lastSwitch ? `${lastSwitch.fromSource.toUpperCase()} → ${lastSwitch.toSource.toUpperCase()}` : 'None'}
          </div>
          <div className="mt-1 text-[11px] text-slate-400 font-mono truncate" title={lastSwitch?.reason}>
            {lastSwitch ? `${lastSwitch.timestamp} · ${lastSwitch.reason}` : 'Awaiting trigger'}
          </div>
        </div>

      </div>

      {/* Two Column Layout: Event History Stream & Active Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Switching Event History */}
        <div className="bg-[#080d1a] p-4 rounded-xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-200">
            <span className="flex items-center gap-1.5">
              <ArrowRightLeft className="w-3.5 h-3.5 text-cyan-400" />
              Switching Event Audit Trail
            </span>
            <span className="text-[10px] font-mono text-slate-500">{switchingHistory.length} Recorded</span>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1 text-xs">
            {switchingHistory.map((ev) => (
              <div key={ev.id} className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
                      {ev.fromSource.toUpperCase()} → {ev.toSource.toUpperCase()}
                    </span>
                    <span className="text-slate-300 font-mono text-[11px]">{ev.timestamp}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">{ev.reason}</p>
                </div>
                <div className="text-right text-[10px] font-mono text-slate-500 shrink-0">
                  <div>P: {ev.primaryPercent}%</div>
                  <div>S: {ev.secondaryPercent}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Alerts & System Notifications */}
        <div className="bg-[#080d1a] p-4 rounded-xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-200">
            <span className="flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-amber-400" />
              Active System & Clinical Alerts
            </span>
            <span className="text-[10px] font-mono text-slate-500">
              {alerts.length} Total
            </span>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1 text-xs">
            {alerts.length === 0 ? (
              <div className="p-6 text-center text-slate-500 font-mono text-xs flex flex-col items-center justify-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-emerald-500/60" />
                <span>All parameters nominal. No active system alerts.</span>
              </div>
            ) : (
              alerts.slice(0, 10).map((a) => (
                <div key={a.id} className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5">
                      {a.severity === 'critical' ? (
                        <AlertCircle className="w-4 h-4 text-red-400" />
                      ) : (
                        <Info className="w-4 h-4 text-amber-400" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        {getSeverityBadge(a.severity)}
                        <span className="font-bold text-slate-200">{a.title}</span>
                        <span className="text-[10px] font-mono text-slate-500">{a.timestamp}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">{a.message}</p>
                    </div>
                  </div>
                  {!a.acknowledged && (
                    <button
                      onClick={() => acknowledgeAlert(a.id)}
                      className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 shrink-0"
                    >
                      Ack
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
