import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  ArrowRightLeft, 
  BarChart3, 
  Clock, 
  Flame, 
  AlertCircle, 
  X,
  Activity
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from 'recharts';
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

  // Compute alert frequency breakdown
  const alertStats = [
    { severity: 'Critical', count: alerts.filter(a => a.severity === 'critical').length, fill: '#ef4444' },
    { severity: 'Warning', count: alerts.filter(a => a.severity === 'warning').length, fill: '#f59e0b' },
    { severity: 'Advisory', count: alerts.filter(a => a.severity === 'advisory').length, fill: '#06b6d4' }
  ];

  // Supply distribution breakdown
  const supplyData = [
    { name: 'Primary (A-1)', liters: Math.round(primaryCylinder.remainingGasLiters), max: 660, fill: '#06b6d4' },
    { name: 'Backup (B-2)', liters: Math.round(secondaryCylinder.remainingGasLiters), max: 660, fill: '#14b8a6' },
    { name: '5-Min Reserve', liters: Math.round(reserveBuffer.currentGasLiters), max: 12.5, fill: '#f59e0b' }
  ];

  // Export CSV Report
  const handleExportCsv = () => {
    const headers = ['Timestamp', 'Type', 'Source', 'Details', 'PrimaryPct', 'BackupPct', 'ReservePct'];
    const rows: string[][] = [];

    // Add switching events
    switchingHistory.forEach(ev => {
      rows.push([
        `"${ev.timestamp}"`,
        `"SWITCHING_EVENT"`,
        `"${ev.fromSource} -> ${ev.toSource}"`,
        `"${ev.reason.replace(/"/g, '""')}"`,
        `"${ev.primaryPercent}%"`,
        `"${ev.secondaryPercent}%"`,
        `"${ev.reservePercent}%"`
      ]);
    });

    // Add alerts
    alerts.forEach(al => {
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

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [
      headers.join(','),
      ...rows.map(e => e.join(','))
    ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `OXYSYNC_2.0_Demonstration_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-[#0c1220]/80 rounded-2xl border border-slate-800 p-5 shadow-xl backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">
              <FileText className="w-4 h-4 text-indigo-400" />
            </div>
            <h1 className="text-xl font-bold text-white">Analytics, Auditing & Reports</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
              AUDIT COMPLIANT
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Historical oxygen delivery statistics, cylinder switching logs, alert frequency, and exportable documentation.
          </p>
        </div>

        {/* Export & Print Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-slate-950 flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/20"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV Audit Report</span>
          </button>

          <button
            onClick={() => setShowPrintModal(true)}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 flex items-center gap-1.5 transition-all"
          >
            <Printer className="w-3.5 h-3.5 text-cyan-400" />
            <span>View Demonstration Dossier</span>
          </button>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#080d1a] border border-slate-800">
          <div className="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            Simulated Uptime
          </div>
          <div className="text-2xl font-black text-white mt-1">Active Session</div>
          <div className="text-[11px] text-slate-500 font-mono mt-1">Speed Multiplier: {settings.simulationSpeed}x</div>
        </div>

        <div className="p-4 rounded-xl bg-[#080d1a] border border-slate-800">
          <div className="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-teal-400" />
            Remaining Oxygen
          </div>
          <div className="text-2xl font-black text-white mt-1">
            {Math.round(primaryCylinder.remainingGasLiters + secondaryCylinder.remainingGasLiters + reserveBuffer.currentGasLiters)} L
          </div>
          <div className="text-[11px] text-teal-400 font-mono mt-1">Available across all tanks</div>
        </div>

        <div className="p-4 rounded-xl bg-[#080d1a] border border-slate-800">
          <div className="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
            <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-400" />
            Switching Events
          </div>
          <div className="text-2xl font-black text-white mt-1">{switchingHistory.length}</div>
          <div className="text-[11px] text-slate-500 font-mono mt-1">Failovers & Manual Toggles</div>
        </div>

        <div className="p-4 rounded-xl bg-[#080d1a] border border-slate-800">
          <div className="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
            Alerts Logged
          </div>
          <div className="text-2xl font-black text-white mt-1">{alerts.length}</div>
          <div className="text-[11px] text-slate-500 font-mono mt-1">{alerts.filter(a => a.severity === 'critical').length} Critical</div>
        </div>
      </div>

      {/* 2 Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Remaining Liters Chart */}
        <div className="p-5 rounded-2xl bg-[#080d1a] border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-200">
            <span className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              Current Oxygen Volume by Supply Source (Liters)
            </span>
          </div>
          <div className="w-full h-64 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={supplyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} fontFamily="monospace" />
                <YAxis stroke="#64748b" fontSize={11} fontFamily="monospace" unit="L" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }} 
                />
                <Bar dataKey="liters" fill="#06b6d4" radius={[6, 6, 0, 0]} name="Gas Volume (Liters)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alert Frequency Breakdown Chart */}
        <div className="p-5 rounded-2xl bg-[#080d1a] border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-200">
            <span className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              Alert Incident Frequency by Priority
            </span>
          </div>
          <div className="w-full h-64 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={alertStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="severity" stroke="#64748b" fontSize={11} fontFamily="monospace" />
                <YAxis stroke="#64748b" fontSize={11} fontFamily="monospace" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }} 
                />
                <Bar dataKey="count" fill="#f59e0b" radius={[6, 6, 0, 0]} name="Number of Alerts" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Detailed Switching Audit History Table */}
      <div className="p-5 rounded-2xl bg-[#080d1a] border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-cyan-400" />
            Cylinder Failover & Switching Audit Log
          </h3>
          <span className="text-[10px] font-mono text-slate-500">{switchingHistory.length} Records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-[10px] uppercase font-mono text-slate-400 border-b border-slate-800 bg-slate-950/40">
              <tr>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Transition</th>
                <th className="py-2.5 px-3">Trigger Type</th>
                <th className="py-2.5 px-3">Reason / Details</th>
                <th className="py-2.5 px-3 text-right">Primary %</th>
                <th className="py-2.5 px-3 text-right">Backup %</th>
                <th className="py-2.5 px-3 text-right">Reserve %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {switchingHistory.map((ev) => (
                <tr key={ev.id} className="hover:bg-slate-900/50">
                  <td className="py-2.5 px-3 text-slate-300">{ev.timestamp}</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                      {ev.fromSource.toUpperCase()} → {ev.toSource.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-400">{ev.triggerType}</td>
                  <td className="py-2.5 px-3 font-sans text-slate-200">{ev.reason}</td>
                  <td className="py-2.5 px-3 text-right text-slate-300">{ev.primaryPercent}%</td>
                  <td className="py-2.5 px-3 text-right text-slate-300">{ev.secondaryPercent}%</td>
                  <td className="py-2.5 px-3 text-right text-slate-300">{ev.reservePercent}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Printable Clinical Demonstration Report Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1220] border border-cyan-500/50 max-w-3xl w-full max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl p-6 space-y-6 text-slate-100">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
                  <Activity className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">OXYSYNC 2.0 Demonstration Dossier</h2>
                  <p className="text-xs text-slate-400 font-mono">Generated: {new Date().toLocaleString()} [SIMULATED]</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Dossier</span>
                </button>
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Dossier Content */}
            <div className="space-y-4 text-xs font-sans">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="font-bold text-cyan-400 uppercase tracking-wide">1. Executive Summary</div>
                <p className="text-slate-300 leading-relaxed">
                  OXYSYNC 2.0 demonstrates intelligent oxygen supply telemetry and automated failover. The system eliminates unexpected cylinder exhaustion emergencies by calculating remaining runtimes via Boyle\'s Law, executing automatic switching to backup cylinders, and engaging a conceptual 5-minute reserve buffer during supply transitions.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="font-bold text-teal-400 uppercase tracking-wide">2. Supply Status at Generation</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-slate-300">
                  <div>Primary (A-1): {primaryCylinder.percentRemaining}% ({primaryCylinder.currentPressureBar} bar)</div>
                  <div>Backup (B-2): {secondaryCylinder.percentRemaining}% ({secondaryCylinder.currentPressureBar} bar)</div>
                  <div>Reserve Buffer: {reserveBuffer.percentRemaining}% ({reserveBuffer.currentGasLiters.toFixed(1)}L)</div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="font-bold text-indigo-400 uppercase tracking-wide">3. Simulated Patient Telemetry</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-slate-300">
                  <div>SpO₂: {vitals.spo2}%</div>
                  <div>Pulse Rate: {vitals.pulseRate} BPM</div>
                  <div>Flow Delivery: {settings.flowRateLpm.toFixed(1)} L/min</div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="font-bold text-amber-400 uppercase tracking-wide">4. Engineering & Safety Notice</div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  IMPORTANT: This document summarizes a software simulation prototype. There is no connected clinical hardware. All values are generated by deterministic mathematics for evaluation and academic exhibition purposes.
                </p>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
