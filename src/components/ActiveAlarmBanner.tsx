import React from 'react';
import { useTelemetry } from '../context/TelemetryContext';
import { AlertTriangle, BellOff, CheckCircle2, ShieldAlert } from 'lucide-react';

export const ActiveAlarmBanner: React.FC = () => {
  const { alerts, snoozeAlarms, snoozeRemaining, acknowledgeAlert } = useTelemetry();

  // Find most severe unacknowledged alert
  const activeAlert = alerts.find(a => !a.acknowledged);

  if (!activeAlert) return null;

  const isCritical = activeAlert.severity === 'critical';

  return (
    <div className={`w-full py-2.5 px-4 transition-all duration-300 border-b ${
      isCritical 
        ? 'bg-rose-950/90 border-rose-600 text-rose-100 animate-pulse' 
        : 'bg-amber-950/80 border-amber-600 text-amber-100'
    }`}>
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-left w-full sm:w-auto">
          {isCritical ? (
            <ShieldAlert className="w-6 h-6 text-rose-400 shrink-0 animate-bounce" />
          ) : (
            <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0" />
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                isCritical ? 'bg-rose-500 text-white' : 'bg-amber-500 text-slate-950'
              }`}>
                {activeAlert.severity} PRIORITY
              </span>
              <span className="font-bold text-sm tracking-tight">{activeAlert.title}</span>
            </div>
            <p className="text-xs opacity-90 mt-0.5">{activeAlert.message}</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
          <button
            onClick={snoozeAlarms}
            disabled={snoozeRemaining > 0}
            className="px-3 py-1.5 rounded-lg bg-black/40 hover:bg-black/60 border border-white/20 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <BellOff className="w-3.5 h-3.5" />
            <span>{snoozeRemaining > 0 ? `Snoozed (${snoozeRemaining}s)` : 'Snooze 2m'}</span>
          </button>
          
          <button
            onClick={() => acknowledgeAlert(activeAlert.id)}
            className="px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Acknowledge</span>
          </button>
        </div>
      </div>
    </div>
  );
};
