import React, { useState } from 'react';
import { Clock, FastForward, RotateCcw, Sliders, Zap, Timer } from 'lucide-react';
import { useTelemetry } from '../../context/TelemetryContext';
import { calculateStateAtTimelineOffset } from '../../services/physicsEngine';
import { PrecisionClock } from '../PrecisionClock';

export const TimeScrubberView: React.FC = () => {
  const {
    primaryCylinder,
    secondaryCylinder,
    reserveBuffer,
    settings,
    predictions,
    jumpTimeForwardMinutes,
    setSimulationSpeed,
    therapyElapsedFormatted,
    resetSimulation
  } = useTelemetry();

  const [scrubMinutes, setScrubMinutes] = useState<number>(0);

  const scrubbedState = calculateStateAtTimelineOffset(
    scrubMinutes,
    primaryCylinder.maxPressureBar * primaryCylinder.waterCapacityLiters,
    secondaryCylinder.maxPressureBar * secondaryCylinder.waterCapacityLiters,
    reserveBuffer.capacityLiters,
    settings.flowRateLpm,
    settings.switchingThresholdPercent
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="clinical-card p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-[var(--text-primary)] tracking-tight">
            Depletion Time-Machine &amp; Chronometer
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Inspect future tank trajectories across time offsets or accelerate live simulation clock
          </p>
        </div>

        <button
          onClick={resetSimulation}
          className="clinical-btn-secondary px-3.5 py-1.5 text-xs inline-flex items-center gap-1.5 self-start md:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
          <span>Reset Clock</span>
        </button>
      </div>

      {/* 3 Chronometers */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="clinical-card p-5">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-2">
            <span className="font-semibold inline-flex items-center gap-1.5 text-[var(--text-primary)]">
              <Clock className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
              System Clock
            </span>
            <span className="font-mono text-[11px]">Local RTC</span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-[var(--text-primary)]">
            <PrecisionClock showCentiseconds />
          </div>
          <div className="mt-1.5 text-xs text-[var(--text-muted)]">
            Zero-lag hardware clock reference
          </div>
        </div>

        <div className="clinical-card p-5">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-2">
            <span className="font-semibold inline-flex items-center gap-1.5 text-[var(--text-primary)]">
              <Timer className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              Therapy Elapsed
            </span>
            <span className="font-mono text-[11px]">Active Session</span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-[var(--accent-primary)] tabular-nums">
            {therapyElapsedFormatted}
          </div>
          <div className="mt-1.5 text-xs text-[var(--text-muted)]">
            Cumulative simulated delivery time
          </div>
        </div>

        <div className="clinical-card p-5">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-2">
            <span className="font-semibold text-[var(--text-primary)]">Depletion Countdown</span>
            <span className="font-mono text-[11px]">Estimated</span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-amber-600 dark:text-amber-400 tabular-nums">
            {predictions.formattedCountdown}
          </div>
          <div className="mt-1.5 text-xs text-[var(--text-muted)] font-mono tabular-nums">
            Projected empty at {predictions.totalSystemDepletionTimeStr}
          </div>
        </div>
      </div>

      {/* Interactive Timeline Scrubber */}
      <div className="clinical-card p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--border-subtle)]">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-[var(--text-primary)] inline-flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[var(--accent-primary)]" />
              Future State Scrubber
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Preview cylinder capacities and switchover state ahead of current therapy time
            </p>
          </div>

          <span className="px-3 py-1 rounded-md bg-[var(--accent-soft)] border border-[var(--accent-border)] text-xs font-mono font-semibold text-[var(--accent-primary)] tabular-nums self-start sm:self-auto">
            +{scrubMinutes} min ({Math.floor(scrubMinutes / 60)}h {scrubMinutes % 60}m)
          </span>
        </div>

        <div className="space-y-2">
          <input
            type="range"
            min="0"
            max="360"
            step="5"
            value={scrubMinutes}
            onChange={(e) => setScrubMinutes(parseInt(e.target.value, 10))}
            className="clinical-slider"
          />
          <div className="flex justify-between text-[11px] font-mono text-[var(--text-muted)] tabular-nums">
            <span>Now (0m)</span>
            <span className="hidden sm:inline">+1 hr</span>
            <span>+2 hrs</span>
            <span className="hidden sm:inline">+4 hrs</span>
            <span>+6 hrs</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono tabular-nums">
          <div className="clinical-well p-3.5">
            <div className="text-[var(--text-muted)] text-[11px]">Primary (+{scrubMinutes}m)</div>
            <div className="text-2xl font-bold text-[var(--text-primary)] mt-1">
              {scrubbedState.primaryPercent}%
            </div>
            <div className="text-[11px] text-[var(--text-muted)] mt-1">
              {scrubbedState.primaryPercent <= settings.switchingThresholdPercent ? 'Failover Crossed' : 'Active'}
            </div>
          </div>

          <div className="clinical-well p-3.5">
            <div className="text-[var(--text-muted)] text-[11px]">Backup (+{scrubMinutes}m)</div>
            <div className="text-2xl font-bold text-[var(--text-primary)] mt-1">
              {scrubbedState.secondaryPercent}%
            </div>
            <div className="text-[11px] text-[var(--text-muted)] mt-1">
              {scrubbedState.activeSrc === 'secondary'
                ? 'Supplying'
                : scrubbedState.secondaryPercent === 0
                ? 'Depleted'
                : 'Standby'}
            </div>
          </div>

          <div className="clinical-well p-3.5">
            <div className="text-[var(--text-muted)] text-[11px]">5m Reserve (+{scrubMinutes}m)</div>
            <div
              className={`text-2xl font-bold mt-1 ${
                scrubbedState.activeSrc === 'reserve'
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-[var(--text-primary)]'
              }`}
            >
              {scrubbedState.reservePercent}%
            </div>
            <div className="text-[11px] text-[var(--text-muted)] mt-1">
              {scrubbedState.activeSrc === 'reserve' ? 'Discharging' : 'Charged (12.5 L)'}
            </div>
          </div>

          <div className="clinical-well p-3.5">
            <div className="text-[var(--text-muted)] text-[11px]">Active Feed (+{scrubMinutes}m)</div>
            <div className="text-xl font-bold text-[var(--accent-primary)] uppercase mt-1">
              {scrubbedState.activeSrc}
            </div>
            <div className="text-[11px] text-[var(--text-muted)] mt-1">
              {scrubbedState.activeSrc === 'none' ? 'Exhausted' : 'Continuous Flow'}
            </div>
          </div>
        </div>
      </div>

      {/* Time Jumps & Multipliers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="clinical-card p-5 space-y-3">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] inline-flex items-center gap-2">
            <FastForward className="w-4 h-4 text-[var(--accent-primary)]" />
            Instant Time Jumps
          </h3>
          <p className="text-xs text-[var(--text-muted)]">
            Advance live tank depletion forward immediately to demonstrate switchover milestones.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono">
            {[15, 30, 60, 120].map((mins) => (
              <button
                key={mins}
                onClick={() => jumpTimeForwardMinutes(mins)}
                className="clinical-btn-secondary py-2 px-2 text-xs font-semibold tabular-nums"
              >
                +{mins} min
              </button>
            ))}
          </div>
        </div>

        <div className="clinical-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] inline-flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              Clock Time-Warp Multiplier
            </h3>
            <span className="font-mono text-xs font-semibold text-[var(--accent-primary)] tabular-nums">
              {settings.simulationSpeed}× live
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            Scale continuous depletion speed dynamically during live observation.
          </p>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-1 font-mono">
            {[0.5, 1, 5, 10, 30, 60].map((spd) => {
              const active = settings.simulationSpeed === spd;
              return (
                <button
                  key={spd}
                  onClick={() => setSimulationSpeed(spd)}
                  className={`py-2 rounded-lg text-xs font-semibold tabular-nums border transition-colors duration-150 ${
                    active
                      ? 'clinical-btn-primary'
                      : 'clinical-btn-secondary'
                  }`}
                >
                  {spd}×
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
