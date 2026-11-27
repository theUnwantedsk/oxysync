import React, { useState } from 'react';
import { Heart, Clock, Bell, AlertTriangle, CheckCircle2, Volume2, Send, Smartphone, Info } from 'lucide-react';
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
      sendDemoNotification(
        'Notifications Enabled',
        'Caregiver alerts will appear on your desktop or mobile screen.'
      );
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
        cardTone: 'border-l-4 border-l-emerald-500',
        badgeTone: 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-950/60 dark:border-emerald-800',
        status: 'Normal'
      };
    }
    if (vitals.spo2 >= 90) {
      return {
        title: 'Mild Desaturation Observed',
        description: 'Oxygen saturation has dipped slightly. Check nasal cannula fit and monitor closely.',
        cardTone: 'border-l-4 border-l-amber-500',
        badgeTone: 'text-amber-800 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-950/60 dark:border-amber-800',
        status: 'Caution'
      };
    }
    return {
      title: 'Urgent: Patient Desaturation Detected',
      description: 'SpO₂ has dropped below 90%. Verify cannula connection immediately and adjust flow.',
      cardTone: 'border-l-4 border-l-red-600 bg-red-50/50 dark:bg-red-950/30',
      badgeTone: 'text-red-700 bg-red-50 border-red-200 dark:text-red-300 dark:bg-red-950/60 dark:border-red-800',
      status: 'Critical'
    };
  };

  const summary = getPatientSummary();

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="clinical-card p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-[var(--text-primary)] tracking-tight">
            Caregiver &amp; Attendant Summary
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Plain-language status view designed for family caregivers and ward attendants
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!notifGranted ? (
            <button
              onClick={handleEnableNotifications}
              className="clinical-btn-primary px-3.5 py-1.5 text-xs inline-flex items-center gap-1.5"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Enable Browser Push Alerts</span>
            </button>
          ) : (
            <button
              onClick={handleTestAlert}
              className="clinical-btn-secondary px-3 py-1.5 text-xs inline-flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
              <span>Test Push Alert</span>
            </button>
          )}

          <button
            onClick={() => audioAlert.playWarningBeep()}
            className="clinical-btn-secondary p-1.5"
            title="Test audible alert chime"
          >
            <Volume2 className="w-4 h-4 text-[var(--accent-primary)]" />
          </button>
        </div>
      </div>

      {/* Patient Status Summary */}
      <div className={`clinical-card p-5 sm:p-6 ${summary.cardTone}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--surface-well)] border border-[var(--border-subtle)] flex items-center justify-center shrink-0">
              <Heart className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${summary.badgeTone}`}>
                {summary.status}
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] mt-1">{summary.title}</h2>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">{summary.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-5 font-mono tabular-nums shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[var(--border-subtle)]">
            <div>
              <div className="text-[11px] text-[var(--text-muted)]">SpO₂</div>
              <div className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">{vitals.spo2}%</div>
            </div>
            <div className="border-l border-[var(--border-subtle)] pl-5">
              <div className="text-[11px] text-[var(--text-muted)]">Pulse</div>
              <div className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
                {vitals.pulseRate} <span className="text-xs font-normal text-[var(--text-muted)]">BPM</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Availability & Advisories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="clinical-card p-5 space-y-4">
          <div className="flex items-center justify-between text-xs">
            <h3 className="font-semibold text-[var(--text-primary)] inline-flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[var(--accent-primary)]" />
              Oxygen Supply Headroom
            </h3>
            <span className="font-mono text-[var(--accent-primary)] font-semibold capitalize">
              Feed: {activeSource}
            </span>
          </div>

          <div className="clinical-well p-4 tabular-nums">
            <div className="text-xs text-[var(--text-muted)]">Estimated Combined Runtime</div>
            <div className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mt-1">
              {Math.floor(predictions.totalSystemMinutes / 60)}h {predictions.totalSystemMinutes % 60}m
            </div>
            <div className="text-xs font-mono text-[var(--text-muted)] mt-1">
              At continuous {predictions.flowRateLpm.toFixed(1)} L/min delivery
            </div>
          </div>

          <div className="space-y-3 text-xs tabular-nums">
            <div>
              <div className="flex justify-between text-[var(--text-secondary)] mb-1">
                <span>Primary Cylinder (A-1)</span>
                <span className="font-mono font-semibold text-[var(--text-primary)]">
                  {primaryCylinder.percentRemaining}% ({Math.floor(primaryCylinder.remainingMinutes / 60)}h{' '}
                  {primaryCylinder.remainingMinutes % 60}m)
                </span>
              </div>
              <div className="w-full h-2 bg-[var(--border-subtle)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-600 dark:bg-cyan-400 transition-[width] duration-700 ease-out rounded-full"
                  style={{ width: `${primaryCylinder.percentRemaining}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[var(--text-secondary)] mb-1">
                <span>Backup Cylinder (B-2)</span>
                <span className="font-mono font-semibold text-[var(--text-primary)]">
                  {secondaryCylinder.percentRemaining}% ({Math.floor(secondaryCylinder.remainingMinutes / 60)}h{' '}
                  {secondaryCylinder.remainingMinutes % 60}m)
                </span>
              </div>
              <div className="w-full h-2 bg-[var(--border-subtle)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-teal-600 dark:bg-teal-400 transition-[width] duration-700 ease-out rounded-full"
                  style={{ width: `${secondaryCylinder.percentRemaining}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[var(--text-secondary)] mb-1">
                <span>5-Min Reserve Buffer</span>
                <span className="font-mono font-semibold text-[var(--text-primary)]">
                  {reserveBuffer.percentRemaining}% ({Math.floor(reserveBuffer.remainingSeconds / 60)}:
                  {(reserveBuffer.remainingSeconds % 60).toString().padStart(2, '0')})
                </span>
              </div>
              <div className="w-full h-2 bg-[var(--border-subtle)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 transition-[width] duration-700 ease-out rounded-full"
                  style={{ width: `${reserveBuffer.percentRemaining}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="clinical-card p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3 text-xs">
              <h3 className="font-semibold text-[var(--text-primary)] inline-flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                Active Attendant Advisories
              </h3>
              <span className="font-mono text-[var(--text-muted)] tabular-nums">
                {alerts.length} logged
              </span>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {alerts.length === 0 ? (
                <div className="clinical-well py-8 text-center text-[var(--text-muted)] text-xs flex flex-col items-center justify-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span>No action required. System operating normally.</span>
                </div>
              ) : (
                alerts.map((al) => (
                  <div key={al.id} className="clinical-well p-3 text-xs space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-[var(--text-primary)] inline-flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            al.severity === 'critical' ? 'bg-red-600' : 'bg-amber-500'
                          }`}
                        />
                        {al.title}
                      </span>
                      <span className="font-mono text-[11px] text-[var(--text-muted)] tabular-nums">
                        {al.timestamp}
                      </span>
                    </div>
                    <p className="text-[var(--text-secondary)] leading-relaxed">{al.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="clinical-well p-3 text-xs text-[var(--text-muted)] flex items-start gap-2">
            <Info className="w-4 h-4 text-[var(--accent-primary)] shrink-0 mt-0.5" />
            <span>
              Failover transitions automatically to Backup (B-2) at 10% and engages the 5-minute reserve if both cylinders empty.
            </span>
          </div>
        </div>
      </div>

      {/* Caregiver Notification History */}
      <div className="clinical-card p-5 space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)] text-xs">
          <h3 className="font-semibold text-[var(--text-primary)] inline-flex items-center gap-1.5">
            <Bell className="w-4 h-4 text-[var(--accent-primary)]" />
            Notification Timeline
          </h3>
          <span className="font-mono text-[var(--text-muted)] tabular-nums">
            {caregiverNotifications.length} events
          </span>
        </div>

        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {caregiverNotifications.map((n) => (
            <div
              key={n.id}
              className="clinical-well p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div>
                <div className="flex items-center flex-wrap gap-2">
                  <span className="font-semibold text-[var(--text-primary)]">{n.title}</span>
                  <span className="font-mono text-[11px] text-[var(--text-muted)] tabular-nums">
                    {n.timestamp}
                  </span>
                </div>
                <p className="text-[var(--text-secondary)] mt-0.5">{n.body}</p>
              </div>
              <span className="font-mono text-[11px] text-[var(--text-muted)] shrink-0">
                {n.actionRequired}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
