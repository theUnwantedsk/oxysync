import React from 'react';
import { Cylinder, ShieldAlert, ArrowRightLeft, RefreshCw, Unplug, Plug, Clock } from 'lucide-react';
import { useTelemetry } from '../../context/TelemetryContext';

export const OxygenSupplyPanel: React.FC = () => {
  const {
    primaryCylinder,
    secondaryCylinder,
    reserveBuffer,
    activeSource,
    switchActiveSource,
    refillCylinder,
    toggleCylinderConnection,
    settings
  } = useTelemetry();

  const getCylinderMeta = (percent: number, isActive: boolean, connected: boolean) => {
    if (!connected) {
      return {
        border: 'border-[var(--border-subtle)] opacity-75',
        bar: 'bg-slate-400',
        pill: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
        statusText: 'Disconnected'
      };
    }
    if (isActive) {
      if (percent <= 10) {
        return {
          border: 'border-red-400 dark:border-red-700',
          bar: 'bg-red-600',
          pill: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800',
          statusText: 'Active · Critical'
        };
      }
      if (percent <= 20) {
        return {
          border: 'border-amber-400 dark:border-amber-700',
          bar: 'bg-amber-500',
          pill: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
          statusText: 'Active · Low'
        };
      }
      return {
        border: 'border-cyan-500/70 dark:border-cyan-600/70',
        bar: 'bg-cyan-600 dark:bg-cyan-400',
        pill: 'bg-cyan-50 text-cyan-800 border-cyan-200 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-800',
        statusText: 'Active Feed'
      };
    }
    return {
      border: 'border-[var(--border-subtle)]',
      bar: 'bg-teal-600 dark:bg-teal-400',
      pill: 'bg-[var(--surface-card)] text-[var(--text-muted)] border-[var(--border-subtle)]',
      statusText: percent > 0 ? 'Standby Ready' : 'Empty'
    };
  };

  const primaryMeta = getCylinderMeta(
    primaryCylinder.percentRemaining,
    activeSource === 'primary',
    primaryCylinder.connected
  );
  const secondaryMeta = getCylinderMeta(
    secondaryCylinder.percentRemaining,
    activeSource === 'secondary',
    secondaryCylinder.connected
  );

  const isReserveActive = activeSource === 'reserve';

  return (
    <section className="clinical-card p-4 sm:p-6 space-y-5">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--border-subtle)]">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)] tracking-tight">
            Oxygen Supply &amp; Failover Redundancy
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5 tabular-nums">
            Dual-cylinder manifold with automatic switchover at {settings.switchingThresholdPercent}% and 5-minute safety reserve
          </p>
        </div>

        <button
          onClick={() => refillCylinder('all')}
          className="clinical-btn-secondary px-3 py-1.5 text-xs inline-flex items-center gap-1.5 self-start sm:self-auto"
          title="Restore all cylinders and reserve buffer to 150 bar"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
          <span>Refill All Supplies</span>
        </button>
      </div>

      {/* 3 Supply Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. Primary Cylinder */}
        <div
          className={`clinical-well p-4 flex flex-col justify-between border transition-colors duration-200 ${primaryMeta.border}`}
        >
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs font-semibold text-[var(--text-primary)] inline-flex items-center gap-1.5">
                <Cylinder className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                Primary Cylinder (A-1)
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${primaryMeta.pill}`}>
                {primaryMeta.statusText}
              </span>
            </div>

            <div className="flex items-baseline justify-between mb-2">
              <div className="tabular-nums">
                <span className="text-3xl font-bold font-mono text-[var(--text-primary)]">
                  {primaryCylinder.percentRemaining}%
                </span>
                <span className="text-xs text-[var(--text-muted)] ml-1.5 font-mono">
                  {Math.round(primaryCylinder.remainingGasLiters)} L
                </span>
              </div>
              <div className="text-right font-mono tabular-nums">
                <div className="text-sm font-semibold text-[var(--text-primary)]">
                  {primaryCylinder.currentPressureBar} bar
                </div>
                <div className="text-[11px] text-[var(--text-muted)]">{primaryCylinder.pressurePsi} PSI</div>
              </div>
            </div>

            <div className="w-full h-2 bg-[var(--border-subtle)] rounded-full overflow-hidden">
              <div
                className={`h-full transition-[width] duration-700 ease-out rounded-full ${primaryMeta.bar}`}
                style={{ width: `${primaryCylinder.percentRemaining}%` }}
              />
            </div>

            <div className="mt-3 flex items-center justify-between text-xs font-mono text-[var(--text-secondary)] pt-2.5 border-t border-[var(--border-subtle)] tabular-nums">
              <span className="inline-flex items-center gap-1 text-[var(--text-muted)]">
                <Clock className="w-3.5 h-3.5" />
                Runtime
              </span>
              <span className="font-semibold text-[var(--text-primary)]">
                {Math.floor(primaryCylinder.remainingMinutes / 60)}h {primaryCylinder.remainingMinutes % 60}m
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] flex items-center gap-2">
            <button
              disabled={activeSource === 'primary' || !primaryCylinder.connected || primaryCylinder.percentRemaining <= 0}
              onClick={() => switchActiveSource('primary', 'Manual Switch to Primary Cylinder')}
              className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors duration-150 ${
                activeSource === 'primary'
                  ? 'bg-[var(--accent-soft)] text-[var(--accent-primary)] border border-[var(--accent-border)] cursor-default'
                  : 'clinical-btn-secondary disabled:opacity-45 disabled:cursor-not-allowed'
              }`}
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>{activeSource === 'primary' ? 'Supplying' : 'Switch To'}</span>
            </button>

            <button
              onClick={() => refillCylinder('primary')}
              title="Refill Primary Cylinder"
              className="clinical-btn-secondary p-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => toggleCylinderConnection('primary')}
              title={primaryCylinder.connected ? 'Disconnect Primary Cylinder' : 'Connect Primary Cylinder'}
              className="clinical-btn-secondary p-1.5"
            >
              {primaryCylinder.connected ? (
                <Unplug className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              ) : (
                <Plug className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              )}
            </button>
          </div>
        </div>

        {/* 2. Secondary Cylinder */}
        <div
          className={`clinical-well p-4 flex flex-col justify-between border transition-colors duration-200 ${secondaryMeta.border}`}
        >
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs font-semibold text-[var(--text-primary)] inline-flex items-center gap-1.5">
                <Cylinder className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                Backup Cylinder (B-2)
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${secondaryMeta.pill}`}>
                {secondaryMeta.statusText}
              </span>
            </div>

            <div className="flex items-baseline justify-between mb-2">
              <div className="tabular-nums">
                <span className="text-3xl font-bold font-mono text-[var(--text-primary)]">
                  {secondaryCylinder.percentRemaining}%
                </span>
                <span className="text-xs text-[var(--text-muted)] ml-1.5 font-mono">
                  {Math.round(secondaryCylinder.remainingGasLiters)} L
                </span>
              </div>
              <div className="text-right font-mono tabular-nums">
                <div className="text-sm font-semibold text-[var(--text-primary)]">
                  {secondaryCylinder.currentPressureBar} bar
                </div>
                <div className="text-[11px] text-[var(--text-muted)]">{secondaryCylinder.pressurePsi} PSI</div>
              </div>
            </div>

            <div className="w-full h-2 bg-[var(--border-subtle)] rounded-full overflow-hidden">
              <div
                className={`h-full transition-[width] duration-700 ease-out rounded-full ${secondaryMeta.bar}`}
                style={{ width: `${secondaryCylinder.percentRemaining}%` }}
              />
            </div>

            <div className="mt-3 flex items-center justify-between text-xs font-mono text-[var(--text-secondary)] pt-2.5 border-t border-[var(--border-subtle)] tabular-nums">
              <span className="inline-flex items-center gap-1 text-[var(--text-muted)]">
                <Clock className="w-3.5 h-3.5" />
                Runtime
              </span>
              <span className="font-semibold text-[var(--text-primary)]">
                {Math.floor(secondaryCylinder.remainingMinutes / 60)}h {secondaryCylinder.remainingMinutes % 60}m
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] flex items-center gap-2">
            <button
              disabled={activeSource === 'secondary' || !secondaryCylinder.connected || secondaryCylinder.percentRemaining <= 0}
              onClick={() => switchActiveSource('secondary', 'Manual Switch to Backup Cylinder')}
              className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors duration-150 ${
                activeSource === 'secondary'
                  ? 'bg-[var(--accent-soft)] text-[var(--accent-primary)] border border-[var(--accent-border)] cursor-default'
                  : 'clinical-btn-secondary disabled:opacity-45 disabled:cursor-not-allowed'
              }`}
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>{activeSource === 'secondary' ? 'Supplying' : 'Switch To'}</span>
            </button>

            <button
              onClick={() => refillCylinder('secondary')}
              title="Refill Backup Cylinder"
              className="clinical-btn-secondary p-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => toggleCylinderConnection('secondary')}
              title={secondaryCylinder.connected ? 'Disconnect Backup Cylinder' : 'Connect Backup Cylinder'}
              className="clinical-btn-secondary p-1.5"
            >
              {secondaryCylinder.connected ? (
                <Unplug className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              ) : (
                <Plug className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              )}
            </button>
          </div>
        </div>

        {/* 3. Five-Minute Reserve Buffer */}
        <div
          className={`clinical-well p-4 flex flex-col justify-between border transition-colors duration-200 ${
            isReserveActive
              ? 'border-red-500 bg-red-50/70 dark:bg-red-950/35'
              : reserveBuffer.percentRemaining < 100
              ? 'border-amber-400 dark:border-amber-700'
              : 'border-[var(--border-subtle)]'
          }`}
        >
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs font-semibold text-[var(--text-primary)] inline-flex items-center gap-1.5">
                <ShieldAlert
                  className={`w-4 h-4 ${
                    isReserveActive ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'
                  }`}
                />
                5-Min Reserve Buffer
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                  isReserveActive
                    ? 'bg-red-600 text-white border-red-600'
                    : reserveBuffer.isRefilling
                    ? 'bg-cyan-50 text-cyan-800 border-cyan-200 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-800'
                    : 'bg-[var(--surface-card)] text-[var(--text-muted)] border-[var(--border-subtle)]'
                }`}
              >
                {isReserveActive ? 'Emergency Feed' : reserveBuffer.isRefilling ? 'Recharging' : 'Primed'}
              </span>
            </div>

            <div className="flex items-baseline justify-between mb-2">
              <div className="tabular-nums">
                <span className="text-3xl font-bold font-mono text-[var(--text-primary)]">
                  {reserveBuffer.percentRemaining}%
                </span>
                <span className="text-xs text-[var(--text-muted)] ml-1.5 font-mono">
                  {reserveBuffer.currentGasLiters.toFixed(1)} / {reserveBuffer.capacityLiters} L
                </span>
              </div>
              <div className="text-right font-mono tabular-nums">
                <div
                  className={`text-sm font-bold ${
                    isReserveActive ? 'text-red-700 dark:text-red-400' : 'text-[var(--text-primary)]'
                  }`}
                >
                  {Math.floor(reserveBuffer.remainingSeconds / 60)}:
                  {(reserveBuffer.remainingSeconds % 60).toString().padStart(2, '0')}
                </div>
                <div className="text-[11px] text-[var(--text-muted)]">Target 05:00</div>
              </div>
            </div>

            <div className="w-full h-2 bg-[var(--border-subtle)] rounded-full overflow-hidden">
              <div
                className={`h-full transition-[width] duration-700 ease-out rounded-full ${
                  isReserveActive
                    ? 'bg-red-600'
                    : reserveBuffer.percentRemaining > 50
                    ? 'bg-amber-500'
                    : 'bg-orange-500'
                }`}
                style={{ width: `${reserveBuffer.percentRemaining}%` }}
              />
            </div>

            <p className="mt-3 pt-2.5 border-t border-[var(--border-subtle)] text-[11px] text-[var(--text-muted)] leading-relaxed">
              Temporary bridge buffer designed to maintain continuous delivery during physical tank replacement.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-[var(--border-subtle)]">
            <button
              onClick={() => switchActiveSource('reserve', 'Manual Activation of 5-Min Reserve Buffer', 'emergency_failover')}
              disabled={isReserveActive || reserveBuffer.percentRemaining <= 0}
              className={`w-full py-1.5 px-2.5 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors duration-150 ${
                isReserveActive
                  ? 'bg-red-600 text-white cursor-default'
                  : 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 dark:bg-red-950/50 dark:hover:bg-red-900/60 dark:text-red-300 dark:border-red-800/60 disabled:opacity-45'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{isReserveActive ? 'Discharging Reserve' : 'Engage Reserve Buffer'}</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
