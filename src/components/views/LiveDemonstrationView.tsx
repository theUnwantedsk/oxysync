import React from 'react';
import { RotateCcw, CheckCircle2, Clock } from 'lucide-react';
import { useTelemetry } from '../../context/TelemetryContext';
import { SCENARIO_DEFINITIONS } from '../../services/scenarioData';
import { EmergencyScenarioId } from '../../types/telemetry';

export const LiveDemonstrationView: React.FC = () => {
  const {
    activeScenario,
    lastScenarioUpdatedAt,
    triggerScenario,
    resetSimulation,
    primaryCylinder,
    secondaryCylinder,
    reserveBuffer,
    vitals,
    activeSource
  } = useTelemetry();

  const scenarioList = Object.values(SCENARIO_DEFINITIONS);

  const handleSelectScenario = (id: EmergencyScenarioId) => {
    triggerScenario(id);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="clinical-card p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-[var(--text-primary)] tracking-tight">
            Emergency Simulation Lab
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Inject deterministic supply and clinical scenarios to test solenoid failover and reserve continuity
          </p>
        </div>

        <button
          onClick={resetSimulation}
          className="clinical-btn-primary px-4 py-2 text-xs inline-flex items-center gap-2 self-start md:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset to Nominal</span>
        </button>
      </div>

      {/* 8 Scenario Selectors Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {scenarioList.map((sc) => {
          const isCurrent = activeScenario.id === sc.id;
          return (
            <button
              key={sc.id}
              onClick={() => handleSelectScenario(sc.id)}
              className={`p-4 rounded-xl border text-left transition-colors duration-150 flex flex-col justify-between ${
                isCurrent
                  ? 'bg-[var(--accent-soft)] border-[var(--accent-border)]'
                  : 'bg-[var(--surface-card)] hover:bg-[var(--surface-well)] border-[var(--border-subtle)]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-[11px] font-mono mb-1.5">
                  <span
                    className={`font-semibold tabular-nums ${
                      isCurrent ? 'text-[var(--accent-primary)]' : 'text-[var(--text-muted)]'
                    }`}
                  >
                    Scenario {sc.stepNumber}
                  </span>
                  <span className="text-[var(--text-muted)] capitalize">{sc.badge.toLowerCase()}</span>
                </div>

                <h3 className="text-xs sm:text-sm font-semibold text-[var(--text-primary)]">
                  {sc.title}
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-1 line-clamp-2 leading-relaxed">
                  {sc.subtitle}
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-[var(--border-subtle)] text-[11px] font-medium">
                <span className={isCurrent ? 'text-[var(--accent-primary)]' : 'text-[var(--text-muted)]'}>
                  {isCurrent ? 'Active Scenario' : 'Apply Scenario'}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Scenario Analysis */}
      <div className="clinical-card p-5 sm:p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-4 border-b border-[var(--border-subtle)]">
          <div>
            <div className="flex items-center flex-wrap gap-2">
              <span className="px-2 py-0.5 rounded bg-[var(--accent-soft)] text-[var(--accent-primary)] border border-[var(--accent-border)] text-xs font-mono font-semibold tabular-nums">
                #{activeScenario.stepNumber}
              </span>
              <h2 className="text-base font-bold text-[var(--text-primary)]">{activeScenario.title}</h2>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-1">{activeScenario.subtitle}</p>
          </div>

          <div className="inline-flex items-center gap-1.5 text-xs font-mono text-[var(--text-muted)] tabular-nums">
            <Clock className="w-3.5 h-3.5" />
            <span>Updated {lastScenarioUpdatedAt}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="clinical-well p-4 space-y-1.5">
            <div className="text-xs font-semibold text-[var(--text-primary)]">Observation</div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              {activeScenario.whatHappened}
            </p>
          </div>

          <div className="clinical-well p-4 space-y-1.5">
            <div className="text-xs font-semibold text-[var(--text-primary)]">Root Cause</div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              {activeScenario.whyItHappened}
            </p>
          </div>

          <div className="clinical-well p-4 space-y-1.5">
            <div className="text-xs font-semibold text-[var(--text-primary)]">Automated Action</div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              {activeScenario.systemResponse}
            </p>
          </div>
        </div>

        {/* Snapshot Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono tabular-nums">
          <div className="clinical-well p-3">
            <div className="text-[11px] text-[var(--text-muted)]">Primary A-1</div>
            <div className="text-base font-bold text-[var(--text-primary)] mt-0.5">
              {primaryCylinder.percentRemaining}%
            </div>
            <div className="text-[11px] text-[var(--text-muted)]">
              {primaryCylinder.currentPressureBar} bar · {activeSource === 'primary' ? 'Feeding' : 'Standby'}
            </div>
          </div>

          <div className="clinical-well p-3">
            <div className="text-[11px] text-[var(--text-muted)]">Backup B-2</div>
            <div className="text-base font-bold text-[var(--text-primary)] mt-0.5">
              {secondaryCylinder.percentRemaining}%
            </div>
            <div className="text-[11px] text-[var(--text-muted)]">
              {secondaryCylinder.currentPressureBar} bar · {activeSource === 'secondary' ? 'Feeding' : 'Standby'}
            </div>
          </div>

          <div className="clinical-well p-3">
            <div className="text-[11px] text-[var(--text-muted)]">5-Min Reserve</div>
            <div
              className={`text-base font-bold mt-0.5 ${
                activeSource === 'reserve' ? 'text-red-600 dark:text-red-400' : 'text-[var(--text-primary)]'
              }`}
            >
              {reserveBuffer.percentRemaining}% ({Math.floor(reserveBuffer.remainingSeconds / 60)}:
              {(reserveBuffer.remainingSeconds % 60).toString().padStart(2, '0')})
            </div>
            <div className="text-[11px] text-[var(--text-muted)]">
              {reserveBuffer.currentGasLiters.toFixed(1)} L · {activeSource === 'reserve' ? 'Discharging' : 'Primed'}
            </div>
          </div>

          <div className="clinical-well p-3">
            <div className="text-[11px] text-[var(--text-muted)]">Simulated Vitals</div>
            <div
              className={`text-base font-bold mt-0.5 ${
                vitals.spo2 < 90
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-emerald-700 dark:text-emerald-400'
              }`}
            >
              SpO₂ {vitals.spo2}% · {vitals.pulseRate} BPM
            </div>
            <div className="text-[11px] text-[var(--text-muted)] capitalize">
              Status: {vitals.patientStatus}
            </div>
          </div>
        </div>

        {/* Sequence */}
        <div className="space-y-2.5 pt-2 border-t border-[var(--border-subtle)]">
          <div className="text-xs font-semibold text-[var(--text-primary)]">
            Verification Sequence ({activeScenario.sequenceSteps.length} steps)
          </div>
          <div className="space-y-2">
            {activeScenario.sequenceSteps.map((step, idx) => (
              <div
                key={idx}
                className="clinical-well p-3 flex items-start gap-3 text-xs"
              >
                <span className="font-mono text-[11px] font-semibold text-[var(--accent-primary)] tabular-nums shrink-0 mt-0.5">
                  0{idx + 1}
                </span>
                <p className="flex-1 text-[var(--text-secondary)] font-mono leading-relaxed">{step}</p>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
