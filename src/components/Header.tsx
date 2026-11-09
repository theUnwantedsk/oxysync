import React from 'react';
import { useTelemetry } from '../context/TelemetryContext';
import { 
  Activity, 
  Volume2, 
  VolumeX, 
  Zap, 
  Moon, 
  Lock, 
  FileText, 
  Wifi, 
  AlertCircle,
  Clock
} from 'lucide-react';

interface HeaderProps {
  onOpenPrescription: () => void;
  onOpenAlertHistory: () => void;
  onOpenReportExport: () => void;
  onToggleBedsideMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenPrescription,
  onOpenAlertHistory,
  onOpenReportExport,
  onToggleBedsideMode
}) => {
  const { 
    device, 
    isMuted, 
    toggleMute, 
    snoozeRemaining, 
    emergencyBoost,
    alerts,
    prescription
  } = useTelemetry();

  const unacknowledgedCount = alerts.filter(a => !a.acknowledged).length;

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-[#050a12]/90 backdrop-blur-md px-4 sm:px-6 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* Brand & Patient info */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-slate-950">
              <Activity className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-white">
                  Oxy<span className="text-cyan-400">Sync</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  CLINICAL v2.4
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Smart Oxygen Titration & Patient Telemetry
              </p>
            </div>
          </div>

          {/* Patient Card Pill */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-3 py-1.5 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping-slow" />
            <div className="text-left">
              <div className="text-xs font-semibold text-slate-200">
                John Doe <span className="text-slate-400 font-normal">(68y, M)</span>
              </div>
              <div className="text-[11px] text-slate-400">
                Bed 4B • COPD Stage III • SpO₂ Target: {prescription.targetSpo2Min}-{prescription.targetSpo2Max}%
              </div>
            </div>
          </div>
        </div>

        {/* Hardware Status & Quick Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap justify-end w-full md:w-auto">
          {/* ESP32 Telemetry Pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs">
            <Wifi className={`w-3.5 h-3.5 ${device.connected ? 'text-emerald-400' : 'text-rose-400'}`} />
            <span className="text-slate-300 font-mono text-[11px]">
              ESP32: {device.esp32Status.toUpperCase()}
            </span>
            <span className="text-[10px] text-slate-400">({device.batteryLevel}%)</span>
          </div>

          {/* Alert History Button */}
          <button
            onClick={onOpenAlertHistory}
            className="relative px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors"
            title="View Alarm History"
          >
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Alerts</span>
            {unacknowledgedCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-bold animate-pulse">
                {unacknowledgedCount}
              </span>
            )}
          </button>

          {/* Sound / Mute / Snooze */}
          <button
            onClick={toggleMute}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
              isMuted 
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20' 
                : snoozeRemaining > 0
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
            title={isMuted ? "Audio muted" : snoozeRemaining > 0 ? `Snoozed (${snoozeRemaining}s)` : "Audio active"}
          >
            {isMuted ? (
              <>
                <VolumeX className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Muted</span>
              </>
            ) : snoozeRemaining > 0 ? (
              <>
                <Clock className="w-3.5 h-3.5 animate-spin" />
                <span className="hidden sm:inline">{snoozeRemaining}s</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Audio</span>
              </>
            )}
          </button>

          {/* Doctor Prescription Gate */}
          <button
            onClick={onOpenPrescription}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 hover:text-cyan-400 flex items-center gap-1.5 transition-colors"
          >
            <Lock className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Rx Lock</span>
          </button>

          {/* Export Report */}
          <button
            onClick={onOpenReportExport}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors"
            title="Export Clinical Telemetry Report"
          >
            <FileText className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Report</span>
          </button>

          {/* Bedside Mode Toggle */}
          <button
            onClick={onToggleBedsideMode}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 hover:text-cyan-400 flex items-center gap-1.5 transition-colors"
            title="Bedside High-Contrast Mode"
          >
            <Moon className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden sm:inline">Bedside</span>
          </button>

          {/* Emergency 5L High-Flow Boost */}
          <button
            onClick={emergencyBoost}
            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-bold shadow-md shadow-rose-900/40 flex items-center gap-1.5 transition-transform active:scale-95"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>BOOST 5L</span>
          </button>
        </div>

      </div>
    </header>
  );
};
