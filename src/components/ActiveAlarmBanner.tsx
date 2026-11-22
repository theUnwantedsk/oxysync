import React from 'react';
import { AlertTriangle, AlertCircle, Check, BellOff, X } from 'lucide-react';
import { useTelemetry } from '../context/TelemetryContext';

export const ActiveAlarmBanner: React.FC = () => {
  const { alerts, acknowledgeAlert, clearAllAlerts, snoozeAlarms, snoozeRemaining } = useTelemetry();

  const unacknowledged = alerts.filter(a => !a.acknowledged);
  if (unacknowledged.length === 0) return null;

  const topAlert = unacknowledged[0];
  const isCritical = topAlert.severity === 'critical';

  return (
    <div className={`w-full border-b transition-all duration-300 py-2.5 px-4 z-30 shadow-lg ${
      isCritical
        ? 'bg-red-950/90 border-red-500/80 text-red-100 shadow-red-950/50'
        : 'bg-amber-950/85 border-amber-500/80 text-amber-100 shadow-amber-950/50'
    }`}>
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
            isCritical ? 'bg-red-600 text-white animate-pulse' : 'bg-amber-600 text-slate-950'
          }`}>
            {isCritical ? <AlertCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] uppercase font-black px-1.5 py-0.5 rounded ${
                isCritical ? 'bg-red-500 text-white' : 'bg-amber-400 text-slate-950'
              }`}>
                {topAlert.severity} [SIMULATED]
              </span>
              <span className="font-bold text-sm tracking-wide text-white">{topAlert.title}</span>
              <span className="text-xs opacity-75 font-mono">({topAlert.timestamp})</span>
            </div>
            <p className="text-xs opacity-90 text-slate-200 mt-0.5">{topAlert.message}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs shrink-0 w-full md:w-auto justify-end">
          {snoozeRemaining > 0 ? (
            <span className="px-2 py-1 rounded bg-black/40 border border-white/20 font-mono text-[11px]">
              Snoozed {snoozeRemaining}s
            </span>
          ) : (
            <button
              onClick={snoozeAlarms}
              className="px-2.5 py-1 rounded bg-black/40 hover:bg-black/60 border border-white/20 flex items-center gap-1 transition-colors"
            >
              <BellOff className="w-3.5 h-3.5" />
              <span>Snooze (2m)</span>
            </button>
          )}

          <button
            onClick={() => acknowledgeAlert(topAlert.id)}
            className="px-3 py-1 rounded font-semibold bg-white text-slate-950 hover:bg-slate-200 flex items-center gap-1 transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Acknowledge</span>
          </button>

          {unacknowledged.length > 1 && (
            <button
              onClick={clearAllAlerts}
              title="Acknowledge and Clear All Active Alerts"
              className="px-2.5 py-1 rounded bg-black/40 hover:bg-black/60 border border-white/20 flex items-center gap-1 transition-colors text-slate-300 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear All ({unacknowledged.length})</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
