import React, { useState } from 'react';
import { 
  HeartHandshake, 
  Heart, 
  Clock, 
  Bell, 
  AlertTriangle, 
  CheckCircle2, 
  Volume2, 
  Send, 
  Smartphone, 
  Info
} from 'lucide-react';
import { useTelemetry } from '../../context/TelemetryContext';
import { audioAlert } from '../../services/audioAlert';

export const CaregiverView: React.FC = () => {
  const {
    vitals,
    primaryCylinder,
    secondaryCylinder,
    reserveBuffer,
    activeSource,
    predictions,
    caregiverNotifications,
    requestBrowserNotification,
    sendDemoNotification,
    alerts
  } = useTelemetry();

  const [notifGranted, setNotifGranted] = useState<boolean>(() => {
    return 'Notification' in window && Notification.permission === 'granted';
  });

  const handleEnableNotifications = async () => {
    const granted = await requestBrowserNotification();
    setNotifGranted(granted);
    if (granted) {
      sendDemoNotification('Notifications Enabled', 'Caregiver alerts will appear on your desktop/mobile screen.');
    }
  };

  const handleTestAlert = () => {
    sendDemoNotification(
      'Primary Supply Low (12%)',
      'OXYSYNC will auto-switch to Backup Cylinder soon. Please prepare a replacement.'
    );
    audioAlert.playWarningBeep();
  };

  const getPatientSummary = () => {
    if (vitals.spo2 >= 95) {
      return {
        title: 'Patient Breathing Comfortably',
        description: 'Oxygen saturation is within safe resting targets. All vitals are stable.',
        color: 'border-emerald-500/40 bg-emerald-950/20 text-emerald-400',
        badge: 'STATUS: NORMAL & COMFORTABLE'
      };
    }
    if (vitals.spo2 >= 90) {
      return {
        title: 'Caution: Mild Desaturation',
        description: 'Oxygen saturation has dipped slightly. Monitor patient and check nasal cannula positioning.',
        color: 'border-amber-500/40 bg-amber-950/20 text-amber-400',
        badge: 'STATUS: ATTENTION ADVISED'
      };
    }
    return {
      title: 'URGENT: Patient Desaturation Detected',
      description: 'SpO₂ has dropped below 90%. Verify cannula fit immediately and consider flow rate titration.',
      color: 'border-red-500/60 bg-red-950/30 text-red-400 animate-pulse',
      badge: 'STATUS: CLINICAL INTERVENTION REQUIRED'
    };
  };

  const summary = getPatientSummary();

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-[#0c1220]/80 rounded-2xl border border-slate-800 p-5 shadow-xl backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
              <HeartHandshake className="w-4 h-4 text-rose-400" />
            </div>
            <h1 className="text-xl font-bold text-white">Caregiver & Attendant Interface</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/20">
              SIMULATED TELEMETRY
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Simplified, high-contrast operational overview designed for family caregivers, attendants, and home health aides.
          </p>
        </div>

        {/* Demo Browser Notification Controls */}
        <div className="flex items-center gap-2">
          {!notifGranted ? (
            <button
              onClick={handleEnableNotifications}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-slate-950 flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/20"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Enable Browser Push Demo</span>
            </button>
          ) : (
            <button
              onClick={handleTestAlert}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 flex items-center gap-1.5 transition-all"
            >
              <Send className="w-3.5 h-3.5 text-cyan-400" />
              <span>Send Demo Push Alert</span>
            </button>
          )}

          <button
            onClick={() => audioAlert.playWarningBeep()}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white"
            title="Test Caregiver Alert Sound Chime"
          >
            <Volume2 className="w-4 h-4 text-cyan-400" />
          </button>
        </div>
      </div>

      {/* Large Patient Status Card */}
      <div className={`p-6 rounded-2xl border transition-all ${summary.color} shadow-xl`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              <Heart className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider opacity-80">
                {summary.badge}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-0.5">{summary.title}</h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">{summary.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-right font-mono shrink-0">
            <div>
              <div className="text-xs opacity-75">Simulated SpO₂</div>
              <div className="text-3xl font-black text-white">{vitals.spo2}%</div>
            </div>
            <div className="border-l border-white/20 pl-4">
              <div className="text-xs opacity-75">Pulse Rate</div>
              <div className="text-3xl font-black text-white">{vitals.pulseRate} <span className="text-sm font-normal">BPM</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* 2 Column Section: Supply Availability & Plain English Warnings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Total Supply Availability Card */}
        <div className="p-5 rounded-2xl bg-[#080d1a] border border-slate-800 space-y-4 shadow-lg">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              Oxygen Supply Availability
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300">
              ACTIVE: {activeSource.toUpperCase()}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80">
            <div className="text-xs text-slate-400 font-mono">TOTAL ESTIMATED RUNTIME:</div>
            <div className="text-3xl sm:text-4xl font-black text-white mt-1">
              {Math.floor(predictions.totalSystemMinutes / 60)} Hours {predictions.totalSystemMinutes % 60} Minutes
            </div>
            <div className="text-xs text-slate-400 mt-2 font-mono">
              At continuous {predictions.flowRateLpm.toFixed(1)} L/min consumption
            </div>
          </div>

          {/* Quick status progress bars */}
          <div className="space-y-2 text-xs">
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Primary Cylinder (A-1)</span>
                <span className="font-mono font-bold text-cyan-300">{primaryCylinder.percentRemaining}% ({Math.floor(primaryCylinder.remainingMinutes / 60)}h {primaryCylinder.remainingMinutes % 60}m)</span>
              </div>
              <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-400 transition-all duration-300" style={{ width: `${primaryCylinder.percentRemaining}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Backup Cylinder (B-2)</span>
                <span className="font-mono font-bold text-teal-300">{secondaryCylinder.percentRemaining}% ({Math.floor(secondaryCylinder.remainingMinutes / 60)}h {secondaryCylinder.remainingMinutes % 60}m)</span>
              </div>
              <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                <div className="h-full bg-teal-400 transition-all duration-300" style={{ width: `${secondaryCylinder.percentRemaining}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>5-Minute Emergency Reserve Buffer</span>
                <span className="font-mono font-bold text-amber-300">{reserveBuffer.percentRemaining}% ({Math.floor(reserveBuffer.remainingSeconds / 60)}:{(reserveBuffer.remainingSeconds % 60).toString().padStart(2, '0')})</span>
              </div>
              <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                <div className="h-full bg-amber-400 transition-all duration-300" style={{ width: `${reserveBuffer.percentRemaining}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Active Plain-Language Warnings & Recommended Action */}
        <div className="p-5 rounded-2xl bg-[#080d1a] border border-slate-800 space-y-4 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Active Attendant Advisories
              </h3>
              <span className="text-[10px] font-mono text-slate-500">
                {alerts.length} Warnings Active
              </span>
            </div>

            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {alerts.length === 0 ? (
                <div className="p-5 text-center text-slate-400 font-mono text-xs flex flex-col items-center justify-center gap-2 bg-slate-950/60 rounded-xl border border-slate-800">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  <span>No action needed. System is operating normally.</span>
                </div>
              ) : (
                alerts.map((al) => (
                  <div key={al.id} className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${al.severity === 'critical' ? 'bg-red-400 animate-ping' : 'bg-amber-400'}`} />
                        {al.title}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">{al.timestamp}</span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">{al.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <span>
              OXYSYNC automatically engages the backup supply when the primary cylinder reaches 10%. If both cylinders become depleted, the 5-Minute Reserve Buffer will bridge the transition.
            </span>
          </div>
        </div>

      </div>

      {/* Caregiver Notification History Stream */}
      <div className="p-5 rounded-2xl bg-[#080d1a] border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Bell className="w-4 h-4 text-cyan-400" />
            Caregiver Notification History (Browser & In-App Telemetry)
          </h3>
          <span className="text-[10px] font-mono text-slate-500">{caregiverNotifications.length} Events</span>
        </div>

        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {caregiverNotifications.map((n) => (
            <div key={n.id} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                    n.severity === 'critical' ? 'bg-red-500/20 text-red-300 border border-red-500/40' : (n.severity === 'warning' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40')
                  }`}>
                    {n.severity}
                  </span>
                  <span className="font-bold text-white">{n.title}</span>
                  <span className="text-[10px] font-mono text-slate-500">{n.timestamp}</span>
                </div>
                <p className="text-slate-300 text-[11px] mt-1">{n.body}</p>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                  {n.actionRequired}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
