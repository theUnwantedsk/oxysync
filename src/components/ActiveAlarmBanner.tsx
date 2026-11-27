import React from 'react';
import { AlertTriangle, AlertCircle, Check, BellOff, X } from 'lucide-react';
import { useTelemetry } from '../context/TelemetryContext';

export const ActiveAlarmBanner: React.FC = () => {
  const { alerts, acknowledgeAlert, acknowledgeAllAlerts, snoozeAlarms, snoozeRemaining } = useTelemetry();

  const unacknowledged = alerts.filter((a) => !a.acknowledged);
  if (unacknowledged.length === 0) return null;

  const topAlert = unacknowledged[0];
  const isCritical = topAlert.severity === 'critical';

  return (
    <div
      role="alert"
      className={`w-full border-b border-l-4 transition-colors duration-200 py-2.5 px-4 ${
        isCritical
          ? 'bg-red-50 border-red-200 border-l-red-600 text-red-950 dark:bg-red-950/60 dark:border-red-900 dark:border-l-red-500 dark:text-red-100'
          : 'bg-amber-50 border-amber-200 border-l-amber-500 text-amber-950 dark:bg-amber-950/50 dark:border-amber-900 dark:border-l-amber-400 dark:text-amber-100'
      }`}
    >
      <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-2.5">
        <div className="flex items-start sm:items-center gap-2.5">
          {isCritical ? (
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5 sm:mt-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
          )}
          <div className="text-xs">
            <div className="flex items-center flex-wrap gap-2">
              <span className="font-semibold text-[var(--text-primary)]">{topAlert.title}</span>
              <span className="text-[11px] font-mono opacity-75 tabular-nums">{topAlert.timestamp}</span>
            </div>
            <p className="opacity-85 mt-0.5">{topAlert.message}</p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2 text-xs shrink-0 w-full md:w-auto justify-end">
          {snoozeRemaining > 0 ? (
            <span className="px-2 py-1 rounded-md border border-current/20 font-mono text-[11px] tabular-nums">
              Snoozed {snoozeRemaining}s
            </span>
          ) : (
            <button
              onClick={snoozeAlarms}
              className="clinical-btn-secondary px-2.5 py-1 text-xs inline-flex items-center gap-1"
            >
              <BellOff className="w-3.5 h-3.5" />
              <span>Snooze 2m</span>
            </button>
          )}

          <button
            onClick={() => acknowledgeAlert(topAlert.id)}
            className={`px-3 py-1 rounded-md text-xs font-semibold inline-flex items-center gap-1 transition-colors duration-150 ${
              isCritical
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-amber-600 hover:bg-amber-700 text-white'
            }`}
          >
            <Check className="w-3.5 h-3.5" />
            <span>Acknowledge</span>
          </button>

          {unacknowledged.length > 1 && (
            <button
              onClick={acknowledgeAllAlerts}
              title="Acknowledge all active alarms while keeping audit log"
              className="clinical-btn-secondary px-2.5 py-1 text-xs inline-flex items-center gap-1 tabular-nums"
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
