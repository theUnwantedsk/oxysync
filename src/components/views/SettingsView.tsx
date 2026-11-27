import React from 'react';
import { RotateCcw, Volume2, Sliders, Clock, Cylinder, ShieldAlert, Zap, Info } from 'lucide-react';
import { useTelemetry } from '../../context/TelemetryContext';

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    setFlowRate,
    setSimulationSpeed,
    setSwitchingThreshold,
    resetSimulation
  } = useTelemetry();

  const handleResetSettings = () => {
    updateSettings({
      simulationSpeed: 1,
      switchingThresholdPercent: 10,
      flowRateLpm: 2.5,
      primaryWaterCapacity: 4.4,
      secondaryWaterCapacity: 4.4,
      reserveCapacityLiters: 12.5,
      soundEnabled: true,
      audioVolume: 0.8,
      autoSwitchEnabled: true
    });
    resetSimulation();
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Header */}
      <div className="clinical-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-[var(--text-primary)] tracking-tight">
            System Settings &amp; Calibration
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Configure simulation clock multiplier, tank water capacities, switchover threshold, and audio alerts
          </p>
        </div>

        <button
          onClick={handleResetSettings}
          className="clinical-btn-secondary px-3.5 py-1.5 text-xs inline-flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
          <span>Reset Defaults</span>
        </button>
      </div>

      {/* Speed */}
      <div className="clinical-card p-5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold text-[var(--text-primary)] inline-flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              Simulation Clock Multiplier
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Accelerate gas consumption to observe multi-hour transitions within minutes
            </p>
          </div>
          <span className="font-mono text-xs font-semibold text-[var(--accent-primary)] tabular-nums">
            {settings.simulationSpeed}×
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 font-mono">
          {[0.5, 1, 2, 5, 10].map((spd) => {
            const active = settings.simulationSpeed === spd;
            return (
              <button
                key={spd}
                onClick={() => setSimulationSpeed(spd)}
                className={`py-2 rounded-lg text-xs font-semibold tabular-nums transition-colors duration-150 ${
                  active ? 'clinical-btn-primary' : 'clinical-btn-secondary'
                }`}
              >
                {spd}× {spd === 1 ? '(Live)' : ''}
              </button>
            );
          })}
        </div>
      </div>

      {/* Auto-Switch Threshold */}
      <div className="clinical-card p-5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold text-[var(--text-primary)] inline-flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-[var(--accent-primary)]" />
              Failover Threshold
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Primary capacity percentage that triggers automatic changeover to Backup (B-2)
            </p>
          </div>
          <span className="font-mono text-xs font-semibold text-[var(--accent-primary)] tabular-nums">
            {settings.switchingThresholdPercent}%
          </span>
        </div>

        <input
          type="range"
          min="5"
          max="30"
          step="1"
          value={settings.switchingThresholdPercent}
          onChange={(e) => setSwitchingThreshold(parseInt(e.target.value, 10))}
          className="clinical-slider"
        />

        <div className="flex justify-between text-[11px] text-[var(--text-muted)] font-mono">
          <span>5% Aggressive</span>
          <span>10% Standard</span>
          <span>20% Conservative</span>
          <span>30% High Reserve</span>
        </div>
      </div>

      {/* Cannula Flow */}
      <div className="clinical-card p-5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold text-[var(--text-primary)] inline-flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              Cannula Flow Rate
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Continuous oxygen volumetric flow rate in liters per minute
            </p>
          </div>
          <span className="font-mono text-xs font-semibold text-teal-600 dark:text-teal-400 tabular-nums">
            {settings.flowRateLpm.toFixed(1)} L/min
          </span>
        </div>

        <input
          type="range"
          min="0.5"
          max="15.0"
          step="0.5"
          value={settings.flowRateLpm}
          onChange={(e) => setFlowRate(parseFloat(e.target.value))}
          className="clinical-slider"
        />

        <div className="flex justify-between text-[11px] text-[var(--text-muted)] font-mono">
          <span>0.5 L/m Low</span>
          <span>2.5 L/m Nasal</span>
          <span>6.0 L/m Mask</span>
          <span>15.0 L/m High Flow</span>
        </div>
      </div>

      {/* Capacities */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="clinical-card p-5 space-y-3">
          <div className="text-xs font-semibold text-[var(--text-primary)] inline-flex items-center gap-1.5">
            <Cylinder className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            Cylinder Water Capacity
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            Water volume for D/E (4.4 L = 660 L NTP) or M-Size (10.0 L = 1500 L NTP) tanks
          </p>

          <div className="grid grid-cols-2 gap-2 pt-1 font-mono">
            {[
              [4.4, '4.4 L (D/E)', '660 L @ 150 Bar'],
              [10.0, '10.0 L (M)', '1500 L @ 150 Bar']
            ].map(([cap, label, sub]) => {
              const active = settings.primaryWaterCapacity === cap;
              return (
                <button
                  key={String(cap)}
                  onClick={() =>
                    updateSettings({
                      primaryWaterCapacity: cap as number,
                      secondaryWaterCapacity: cap as number
                    })
                  }
                  className={`p-2.5 rounded-lg text-xs border text-left transition-colors duration-150 ${
                    active
                      ? 'bg-[var(--accent-soft)] border-[var(--accent-border)] text-[var(--text-primary)] font-semibold'
                      : 'clinical-well text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
                  }`}
                >
                  <div>{label}</div>
                  <div className="text-[10px] text-[var(--text-muted)]">{sub}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="clinical-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text-primary)] inline-flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              Reserve Buffer Volume
            </span>
            <span className="font-mono text-xs font-semibold text-amber-600 dark:text-amber-400 tabular-nums">
              {settings.reserveCapacityLiters.toFixed(1)} L
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            Internal buffer capacity bridging cylinder replacements
          </p>

          <input
            type="range"
            min="5.0"
            max="25.0"
            step="2.5"
            value={settings.reserveCapacityLiters}
            onChange={(e) => updateSettings({ reserveCapacityLiters: parseFloat(e.target.value) })}
            className="clinical-slider"
          />

          <div className="text-[11px] text-[var(--text-muted)] font-mono tabular-nums">
            Provides {(settings.reserveCapacityLiters / settings.flowRateLpm).toFixed(1)} min at{' '}
            {settings.flowRateLpm.toFixed(1)} L/min
          </div>
        </div>
      </div>

      {/* Audio */}
      <div className="clinical-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[var(--text-primary)] inline-flex items-center gap-1.5">
            <Volume2 className="w-4 h-4 text-[var(--accent-primary)]" />
            Medical Audio Alarms
          </span>
          <button
            onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors duration-150 ${
              settings.soundEnabled ? 'clinical-btn-primary' : 'clinical-btn-secondary'
            }`}
          >
            {settings.soundEnabled ? 'Sound Enabled' : 'Muted'}
          </button>
        </div>

        <div className="flex items-center gap-4 pt-1">
          <span className="text-xs text-[var(--text-muted)] font-mono">Volume</span>
          <input
            type="range"
            min="0.0"
            max="1.0"
            step="0.05"
            value={settings.audioVolume}
            onChange={(e) => updateSettings({ audioVolume: parseFloat(e.target.value) })}
            className="clinical-slider flex-1"
          />
          <span className="font-mono text-xs font-semibold text-[var(--text-primary)] w-12 text-right tabular-nums">
            {Math.round(settings.audioVolume * 100)}%
          </span>
        </div>

        <p className="text-xs text-[var(--text-muted)]">
          Generates Web Audio IEC 60601-1-8 alarm cadence locally in browser.
        </p>
      </div>

      <div className="clinical-well p-3.5 text-xs text-[var(--text-muted)] inline-flex items-center gap-2 w-full">
        <Info className="w-4 h-4 text-[var(--accent-primary)] shrink-0" />
        <span>Preferences persist automatically in browser LocalStorage.</span>
      </div>
    </div>
  );
};
