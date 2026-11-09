import React from 'react';
import { useTelemetry } from '../context/TelemetryContext';
import { X, AlertCircle, ShieldAlert, CheckCircle2, Download, Trash2 } from 'lucide-react';

interface AlertHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AlertHistoryModal: React.FC<AlertHistoryModalProps> = ({ isOpen, onClose }) => {
  const { alerts, acknowledgeAlert, clearAllAlerts } = useTelemetry();

  if (!isOpen) return null;

  const handleExportCSV = () => {
    if (alerts.length === 0) return;
    const headers = ['Timestamp', 'Severity', 'Type', 'Title', 'Message', 'Acknowledged'];
    const rows = alerts.map(a => [
      `"${a.timestamp}"`,
      `"${a.severity}"`,
      `"${a.type}"`,
      `"${a.title.replace(/"/g, '""')}"`,
      `"${a.message.replace(/"/g, '""')}"`,
      a.acknowledged ? 'Yes' : 'No'
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `oxysync_alarms_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0b1424] border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative flex flex-col max-h-[85vh]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800 pr-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Alarm & Safety Incident Audit</h2>
              <p className="text-xs text-slate-400">Timestamped Record of Medical Alarms & Failovers</p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-between mb-3 text-xs">
          <span className="text-slate-400">
            Total Logged Events: <strong className="text-white">{alerts.length}</strong>
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              disabled={alerts.length === 0}
              className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-medium flex items-center gap-1.5 transition-colors disabled:opacity-40"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={clearAllAlerts}
              disabled={alerts.length === 0}
              className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 font-medium flex items-center gap-1.5 transition-colors disabled:opacity-40"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Log</span>
            </button>
          </div>
        </div>

        {/* List of Alerts */}
        <div className="overflow-y-auto space-y-2.5 flex-1 pr-1">
          {alerts.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-60" />
              No clinical safety alarms recorded. Patient status is stable.
            </div>
          ) : (
            alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-3.5 rounded-xl border flex items-start justify-between gap-3 ${
                  alert.severity === 'critical'
                    ? 'bg-rose-950/20 border-rose-500/40 text-rose-200'
                    : alert.severity === 'warning'
                    ? 'bg-amber-950/20 border-amber-500/40 text-amber-200'
                    : 'bg-slate-900 border-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {alert.severity === 'critical' ? (
                    <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs">{alert.title}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-black/40 text-slate-400">
                        {alert.timestamp}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                      {alert.message}
                    </p>
                  </div>
                </div>

                {!alert.acknowledged ? (
                  <button
                    onClick={() => acknowledgeAlert(alert.id)}
                    className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-white font-semibold text-[11px] shrink-0"
                  >
                    Ack
                  </button>
                ) : (
                  <span className="text-[11px] text-emerald-400 flex items-center gap-1 shrink-0 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Resolved</span>
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
