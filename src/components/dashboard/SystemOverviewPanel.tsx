import React from 'react';
import { ArrowRightLeft, Bell, CheckCircle2, AlertCircle, Info } from 'lucide-react';
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

  const totalGasLiters = Math.round(
    primaryCylinder.remainingGasLiters +
      secondaryCylinder.remainingGasLiters +
      reserveBuffer.currentGasLiters
  );
  const lastSwitch = switchingHistory[0];

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800">
            Critical
          </span>
        );
      case 'warning':
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800">
            Warning
          </span>
        );
      default:
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-cyan-50 text-cyan-800 border border-cyan-200 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-800">
            Advisory
          </span>
        );
    }
  };

  return (
    <section className="clinical-card p-4 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[var(--border-subtle)]">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)] tracking-tight">
            System Overview &amp; Failover Log
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Combined gas reserve, operating state, and switching history
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-[var(--text-muted)]">Mode:</span>
          <span className="px-2.5 py-1 rounded-md text-xs font-mono font-semibold bg-[var(--accent-soft)] text-[var(--accent-primary)] border border-[var(--accent-border)] capitalize">
            {systemMode.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="clinical-well p-3.5">
          <div className="text-xs text-[var(--text-muted)] font-medium">Total Gas Available</div>
          <div className="flex items-baseline gap-1.5 mt-1 tabular-nums">
            <span className="text-2xl font-bold font-mono text-[var(--text-primary)]">{totalGasLiters}</span>
            <span className="text-xs text-[var(--text-muted)] font-mono">L NTP</span>
          </div>
          <div className="mt-1 text-[11px] text-[var(--text-muted)] font-mono tabular-nums">
            A-1: {primaryCylinder.percentRemaining}% · B-2: {secondaryCylinder.percentRemaining}%
          </div>
        </div>

        <div className="clinical-well p-3.5">
          <div className="text-xs text-[var(--text-muted)] font-medium">Combined Runtime</div>
          <div className="text-2xl font-bold font-mono text-[var(--text-primary)] mt-1 tabular-nums">
            {Math.floor(predictions.totalSystemMinutes / 60)}h {predictions.totalSystemMinutes % 60}m
          </div>
          <div className="mt-1 text-[11px] text-[var(--accent-primary)] font-mono tabular-nums">
            ETA {predictions.totalSystemDepletionTimeStr}
          </div>
        </div>

        <div className="clinical-well p-3.5">
          <div className="text-xs text-[var(--text-muted)] font-medium">Active Supply Path</div>
          <div className="text-xl font-bold text-[var(--text-primary)] capitalize mt-1">
            {activeSource}
          </div>
          <div className="mt-1 text-[11px] text-[var(--text-muted)] font-mono tabular-nums">
            Cannula: {predictions.flowRateLpm.toFixed(1)} L/min
          </div>
        </div>

        <div className="clinical-well p-3.5">
          <div className="text-xs text-[var(--text-muted)] font-medium">Latest Transition</div>
          <div className="text-sm font-semibold font-mono text-[var(--text-primary)] truncate mt-1 uppercase">
            {lastSwitch ? `${lastSwitch.fromSource} → ${lastSwitch.toSource}` : 'None'}
          </div>
          <div className="mt-1 text-[11px] text-[var(--text-muted)] truncate" title={lastSwitch?.reason}>
            {lastSwitch ? `${lastSwitch.timestamp} · ${lastSwitch.reason}` : 'Awaiting event'}
          </div>
        </div>
      </div>

      {/* Audit & Alerts Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="clinical-well p-4 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-[var(--text-primary)]">
            <span className="inline-flex items-center gap-1.5">
              <ArrowRightLeft className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
              Switching Audit Trail
            </span>
            <span className="text-[11px] font-mono text-[var(--text-muted)] tabular-nums">
              {switchingHistory.length} events
            </span>
          </div>

          <div className="space-y-2 max-h-52 overflow-y-auto pr-1 text-xs">
            {switchingHistory.map((ev) => (
              <div
                key={ev.id}
                className="p-2.5 rounded-lg bg-[var(--surface-card)] border border-[var(--border-subtle)] flex items-start justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <span className="font-semibold text-[var(--accent-primary)] uppercase">
                      {ev.fromSource} → {ev.toSource}
                    </span>
                    <span className="text-[var(--text-muted)] tabular-nums">{ev.timestamp}</span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">{ev.reason}</p>
                </div>
                <div className="text-right text-[11px] font-mono text-[var(--text-muted)] shrink-0 tabular-nums">
                  <div>A-1: {ev.primaryPercent}%</div>
                  <div>B-2: {ev.secondaryPercent}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="clinical-well p-4 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-[var(--text-primary)]">
            <span className="inline-flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              Active Clinical &amp; System Alerts
            </span>
            <span className="text-[11px] font-mono text-[var(--text-muted)] tabular-nums">
              {alerts.length} total
            </span>
          </div>

          <div className="space-y-2 max-h-52 overflow-y-auto pr-1 text-xs">
            {alerts.length === 0 ? (
              <div className="py-8 text-center text-[var(--text-muted)] text-xs flex flex-col items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span>All system parameters within nominal bounds.</span>
              </div>
            ) : (
              alerts.slice(0, 10).map((a) => (
                <div
                  key={a.id}
                  className="p-2.5 rounded-lg bg-[var(--surface-card)] border border-[var(--border-subtle)] flex items-start justify-between gap-2"
                >
                  <div className="flex items-start gap-2 min-w-0">
                    {a.severity === 'critical' ? (
                      <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                    ) : (
                      <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center flex-wrap gap-1.5">
                        {getSeverityBadge(a.severity)}
                        <span className="font-semibold text-[var(--text-primary)]">{a.title}</span>
                        <span className="text-[11px] font-mono text-[var(--text-muted)] tabular-nums">
                          {a.timestamp}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] mt-0.5">{a.message}</p>
                    </div>
                  </div>
                  {!a.acknowledged && (
                    <button
                      onClick={() => acknowledgeAlert(a.id)}
                      className="clinical-btn-secondary px-2 py-0.5 text-[11px] shrink-0"
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
    </section>
  );
};
