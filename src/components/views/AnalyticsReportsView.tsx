import React, { useState } from 'react';
import { Download, Printer, ArrowRightLeft, BarChart3, Clock, Flame, AlertCircle, X, Activity } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { useTelemetry } from '../../context/TelemetryContext';

export const AnalyticsReportsView: React.FC = () => {
  const {
    switchingHistory,
    alerts,
    primaryCylinder,
    secondaryCylinder,
    reserveBuffer,
    settings,
    vitals
  } = useTelemetry();

  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);

  const alertStats = [
    { severity: 'Critical', count: alerts.filter((a) => a.severity === 'critical').length },
    { severity: 'Warning', count: alerts.filter((a) => a.severity === 'warning').length },
    { severity: 'Advisory', count: alerts.filter((a) => a.severity === 'advisory').length }
  ];

  const supplyData = [
    { name: 'Primary (A-1)', liters: Math.round(primaryCylinder.remainingGasLiters) },
    { name: 'Backup (B-2)', liters: Math.round(secondaryCylinder.remainingGasLiters) },
    { name: '5-Min Reserve', liters: Math.round(reserveBuffer.currentGasLiters) }
  ];

  const handleExportCsv = () => {
    const headers = ['Timestamp', 'Type', 'Source', 'Details', 'PrimaryPct', 'BackupPct', 'ReservePct'];
    const rows: string[][] = [];

    switchingHistory.forEach((ev) => {
      rows.push([
        `"${ev.timestamp}"`,
        '"SWITCHING_EVENT"',
        `"${ev.fromSource} -> ${ev.toSource}"`,
        `"${ev.reason.replace(/"/g, '""')}"`,
        `"${ev.primaryPercent}%"`,
        `"${ev.secondaryPercent}%"`,
        `"${ev.reservePercent}%"`
      ]);
    });

    alerts.forEach((al) => {
      rows.push([
        `"${al.timestamp}"`,
        `"ALERT_${al.severity.toUpperCase()}"`,
        `"${al.type}"`,
        `"${al.title} - ${al.message.replace(/"/g, '""')}"`,
        `"${primaryCylinder.percentRemaining}%"`,
        `"${secondaryCylinder.percentRemaining}%"`,
        `"${reserveBuffer.percentRemaining}%"`
      ]);
    });

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `OXYSYNC_2.0_Audit_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="clinical-card p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-[var(--text-primary)] tracking-tight">
            Reports &amp; Compliance Audit Log
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Supply utilization breakdown, transition records, and RFC-4180 CSV export
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="clinical-btn-primary px-3.5 py-1.5 text-xs inline-flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setShowPrintModal(true)}
            className="clinical-btn-secondary px-3.5 py-1.5 text-xs inline-flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
            <span>Summary Dossier</span>
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 tabular-nums">
        <div className="clinical-card p-4">
          <div className="text-xs font-medium text-[var(--text-muted)] inline-flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
            Session Mode
          </div>
          <div className="text-xl font-bold text-[var(--text-primary)] mt-1">Active Telemetry</div>
          <div className="text-xs font-mono text-[var(--text-muted)] mt-1">
            Speed: {settings.simulationSpeed}×
          </div>
        </div>

        <div className="clinical-card p-4">
          <div className="text-xs font-medium text-[var(--text-muted)] inline-flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            Remaining Gas
          </div>
          <div className="text-2xl font-bold font-mono text-[var(--text-primary)] mt-1">
            {Math.round(
              primaryCylinder.remainingGasLiters +
                secondaryCylinder.remainingGasLiters +
                reserveBuffer.currentGasLiters
            )}{' '}
            L
          </div>
          <div className="text-xs font-mono text-[var(--text-muted)] mt-1">All sources combined</div>
        </div>

        <div className="clinical-card p-4">
          <div className="text-xs font-medium text-[var(--text-muted)] inline-flex items-center gap-1.5">
            <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            Switching Events
          </div>
          <div className="text-2xl font-bold font-mono text-[var(--text-primary)] mt-1">
            {switchingHistory.length}
          </div>
          <div className="text-xs font-mono text-[var(--text-muted)] mt-1">Recorded transitions</div>
        </div>

        <div className="clinical-card p-4">
          <div className="text-xs font-medium text-[var(--text-muted)] inline-flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            Alerts Logged
          </div>
          <div className="text-2xl font-bold font-mono text-[var(--text-primary)] mt-1">
            {alerts.length}
          </div>
          <div className="text-xs font-mono text-[var(--text-muted)] mt-1">
            {alerts.filter((a) => a.severity === 'critical').length} critical
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="clinical-card p-5 space-y-3">
          <div className="text-xs font-semibold text-[var(--text-primary)] inline-flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[var(--accent-primary)]" />
            Available Gas Volume (Liters)
          </div>
          <div className="w-full h-64 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={supplyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                <XAxis dataKey="name" stroke="var(--chart-axis)" fontSize={11} fontFamily="monospace" />
                <YAxis stroke="var(--chart-axis)" fontSize={11} fontFamily="monospace" unit="L" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--chart-tooltip-bg)',
                    borderColor: 'var(--chart-tooltip-border)',
                    color: 'var(--chart-tooltip-text)',
                    borderRadius: '0.5rem',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="liters" fill="#0891b2" radius={[5, 5, 0, 0]} name="Gas Volume (L)" isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="clinical-card p-5 space-y-3">
          <div className="text-xs font-semibold text-[var(--text-primary)] inline-flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            Alerts by Severity
          </div>
          <div className="w-full h-64 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={alertStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                <XAxis dataKey="severity" stroke="var(--chart-axis)" fontSize={11} fontFamily="monospace" />
                <YAxis stroke="var(--chart-axis)" fontSize={11} fontFamily="monospace" allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--chart-tooltip-bg)',
                    borderColor: 'var(--chart-tooltip-border)',
                    color: 'var(--chart-tooltip-text)',
                    borderRadius: '0.5rem',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="count" fill="#d97706" radius={[5, 5, 0, 0]} name="Alert Count" isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="clinical-card p-5 space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)] text-xs">
          <h3 className="font-semibold text-[var(--text-primary)] inline-flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-[var(--accent-primary)]" />
            Supply Switching Log
          </h3>
          <span className="font-mono text-[var(--text-muted)] tabular-nums">
            {switchingHistory.length} records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left tabular-nums">
            <thead className="text-[11px] font-mono text-[var(--text-muted)] border-b border-[var(--border-subtle)]">
              <tr>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Transition</th>
                <th className="py-2.5 px-3">Trigger</th>
                <th className="py-2.5 px-3">Reason</th>
                <th className="py-2.5 px-3 text-right">Primary</th>
                <th className="py-2.5 px-3 text-right">Backup</th>
                <th className="py-2.5 px-3 text-right">Reserve</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)] font-mono">
              {switchingHistory.map((ev) => (
                <tr key={ev.id} className="hover:bg-[var(--surface-well)] transition-colors">
                  <td className="py-2.5 px-3 text-[var(--text-secondary)]">{ev.timestamp}</td>
                  <td className="py-2.5 px-3 font-semibold text-[var(--accent-primary)] uppercase">
                    {ev.fromSource} → {ev.toSource}
                  </td>
                  <td className="py-2.5 px-3 text-[var(--text-muted)]">{ev.triggerType}</td>
                  <td className="py-2.5 px-3 font-sans text-[var(--text-primary)]">{ev.reason}</td>
                  <td className="py-2.5 px-3 text-right text-[var(--text-secondary)]">{ev.primaryPercent}%</td>
                  <td className="py-2.5 px-3 text-right text-[var(--text-secondary)]">{ev.secondaryPercent}%</td>
                  <td className="py-2.5 px-3 text-right text-[var(--text-secondary)]">{ev.reservePercent}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Printable Summary Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="clinical-card max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[var(--accent-primary)] flex items-center justify-center">
                  <Activity className="w-5 h-5 text-white dark:text-slate-950" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[var(--text-primary)]">
                    OXYSYNC 2.0 Demonstration Dossier
                  </h2>
                  <p className="text-xs text-[var(--text-muted)] font-mono">
                    {new Date().toLocaleString()} · Simulated Telemetry
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="clinical-btn-primary px-3 py-1.5 text-xs inline-flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="clinical-btn-secondary p-1.5"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="clinical-well p-4 space-y-1.5">
                <div className="font-semibold text-[var(--text-primary)]">1. Summary</div>
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  OXYSYNC 2.0 provides predictive gas depletion calculation via Boyle&apos;s Law, automatic dual-cylinder failover at a configurable threshold, and a 5-minute inline reserve continuity buffer.
                </p>
              </div>

              <div className="clinical-well p-4 space-y-1.5">
                <div className="font-semibold text-[var(--text-primary)]">2. Supply State</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-[var(--text-secondary)] tabular-nums">
                  <div>Primary (A-1): {primaryCylinder.percentRemaining}% ({primaryCylinder.currentPressureBar} bar)</div>
                  <div>Backup (B-2): {secondaryCylinder.percentRemaining}% ({secondaryCylinder.currentPressureBar} bar)</div>
                  <div>Reserve: {reserveBuffer.percentRemaining}% ({reserveBuffer.currentGasLiters.toFixed(1)} L)</div>
                </div>
              </div>

              <div className="clinical-well p-4 space-y-1.5">
                <div className="font-semibold text-[var(--text-primary)]">3. Simulated Patient Vitals</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-[var(--text-secondary)] tabular-nums">
                  <div>SpO₂: {vitals.spo2}%</div>
                  <div>Heart Rate: {vitals.pulseRate} BPM</div>
                  <div>Flow Rate: {settings.flowRateLpm.toFixed(1)} L/min</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
