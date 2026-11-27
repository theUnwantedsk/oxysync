import React from 'react';
import { RefreshCw, Sliders, Play } from 'lucide-react';
import { useTelemetry } from '../../context/TelemetryContext';

export const SupplyPathView: React.FC = () => {
  const {
    primaryCylinder,
    secondaryCylinder,
    reserveBuffer,
    activeSource,
    switchActiveSource,
    refillCylinder,
    settings,
    setFlowRate,
    setSwitchingThreshold
  } = useTelemetry();

  const isPrimaryFlowing = activeSource === 'primary' && primaryCylinder.currentPressureBar > 0;
  const isSecondaryFlowing = activeSource === 'secondary' && secondaryCylinder.currentPressureBar > 0;
  const isReserveFlowing = activeSource === 'reserve' && reserveBuffer.currentGasLiters > 0;

  const activeLabel =
    activeSource === 'primary'
      ? 'Primary Cylinder (A-1)'
      : activeSource === 'secondary'
      ? 'Backup Cylinder (B-2)'
      : activeSource === 'reserve'
      ? '5-Min Reserve Buffer'
      : 'Depleted';

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="clinical-card p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-[var(--text-primary)] tracking-tight">
            Smart Supply Manifold &amp; Flow Schematic
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Simulated pneumatic routing across dual-cylinder solenoids and the 5-minute inline reserve bridge
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={() => switchActiveSource('primary', 'Manual Manifold Toggle')}
            disabled={activeSource === 'primary' || primaryCylinder.percentRemaining <= 0}
            className={`px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 transition-colors duration-150 ${
              activeSource === 'primary'
                ? 'clinical-btn-primary'
                : 'clinical-btn-secondary disabled:opacity-45'
            }`}
          >
            <Play className="w-3 h-3" />
            <span>Select Primary</span>
          </button>

          <button
            onClick={() => switchActiveSource('secondary', 'Manual Manifold Toggle')}
            disabled={activeSource === 'secondary' || secondaryCylinder.percentRemaining <= 0}
            className={`px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 transition-colors duration-150 ${
              activeSource === 'secondary'
                ? 'clinical-btn-primary'
                : 'clinical-btn-secondary disabled:opacity-45'
            }`}
          >
            <Play className="w-3 h-3" />
            <span>Select Backup</span>
          </button>

          <button
            onClick={() => refillCylinder('all')}
            className="clinical-btn-secondary px-3 py-1.5 inline-flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
            <span>Refill All</span>
          </button>
        </div>
      </div>

      {/* Schematic Frame */}
      <div className="clinical-card p-4 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[var(--text-muted)]">Active Feed:</span>
            <span className="px-2.5 py-0.5 rounded-md font-semibold bg-[var(--accent-soft)] text-[var(--accent-primary)] border border-[var(--accent-border)]">
              {activeLabel}
            </span>
          </div>
          <span className="text-[11px] font-mono text-[var(--text-muted)]">
            Tanks → Manifold → 3.5 Bar Regulator → Mass Flow Controller → Cannula
          </span>
        </div>

        {/* High-contrast Schematic Diagram Surface */}
        <div
          data-dark-surface="true"
          className="w-full overflow-x-auto rounded-xl bg-[#060a14] p-2 border border-slate-800"
        >
          <svg viewBox="0 0 1000 500" className="w-full min-w-[780px] h-auto select-none">
            <defs>
              <filter id="cyanGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="redGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#0e172a" strokeWidth="1" />
            </pattern>
            <rect width="1000" height="500" fill="url(#grid)" />

            {/* Primary Pipe */}
            <path
              d="M 170 120 L 400 120 L 400 230"
              fill="none"
              stroke={isPrimaryFlowing ? '#06b6d4' : '#1e293b'}
              strokeWidth="6"
              strokeLinecap="round"
              filter={isPrimaryFlowing ? 'url(#cyanGlow)' : undefined}
            />
            {isPrimaryFlowing && (
              <path
                d="M 170 120 L 400 120 L 400 230"
                fill="none"
                stroke="#ffffff"
                strokeWidth="3"
                strokeDasharray="8 12"
                className="animate-[dash_1s_linear_infinite]"
              />
            )}

            {/* Secondary Pipe */}
            <path
              d="M 170 380 L 400 380 L 400 270"
              fill="none"
              stroke={isSecondaryFlowing ? '#14b8a6' : '#1e293b'}
              strokeWidth="6"
              strokeLinecap="round"
              filter={isSecondaryFlowing ? 'url(#cyanGlow)' : undefined}
            />
            {isSecondaryFlowing && (
              <path
                d="M 170 380 L 400 380 L 400 270"
                fill="none"
                stroke="#ffffff"
                strokeWidth="3"
                strokeDasharray="8 12"
                className="animate-[dash_1s_linear_infinite]"
              />
            )}

            {/* Manifold */}
            <rect x="380" y="215" width="40" height="70" rx="8" fill="#0f172a" stroke="#334155" strokeWidth="2" />
            <text x="400" y="254" textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="monospace" fontWeight="bold">
              MANIFOLD
            </text>

            {/* Manifold to Regulator */}
            <path
              d="M 420 250 L 520 250"
              fill="none"
              stroke={isPrimaryFlowing || isSecondaryFlowing ? '#06b6d4' : '#1e293b'}
              strokeWidth="6"
              strokeLinecap="round"
              filter={isPrimaryFlowing || isSecondaryFlowing ? 'url(#cyanGlow)' : undefined}
            />
            {(isPrimaryFlowing || isSecondaryFlowing) && (
              <path
                d="M 420 250 L 520 250"
                fill="none"
                stroke="#ffffff"
                strokeWidth="3"
                strokeDasharray="8 12"
                className="animate-[dash_1s_linear_infinite]"
              />
            )}

            {/* Reserve Bleed Line */}
            <path
              d="M 470 250 L 470 120 L 570 120"
              fill="none"
              stroke={reserveBuffer.isRefilling ? '#38bdf8' : '#1e293b'}
              strokeWidth="4"
              strokeDasharray={reserveBuffer.isRefilling ? '4 4' : undefined}
            />

            {/* Reserve Discharge Line */}
            <path
              d="M 640 120 L 710 120 L 710 230"
              fill="none"
              stroke={isReserveFlowing ? '#ef4444' : '#1e293b'}
              strokeWidth="6"
              strokeLinecap="round"
              filter={isReserveFlowing ? 'url(#redGlow)' : undefined}
            />
            {isReserveFlowing && (
              <path
                d="M 640 120 L 710 120 L 710 230"
                fill="none"
                stroke="#ffffff"
                strokeWidth="3"
                strokeDasharray="8 12"
                className="animate-[dash_1s_linear_infinite]"
              />
            )}

            {/* Regulator */}
            <g transform="translate(520, 220)">
              <rect width="60" height="60" rx="8" fill="#0f172a" stroke="#0ea5e9" strokeWidth="2" />
              <text x="30" y="28" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="bold">
                REGULATOR
              </text>
              <text x="30" y="44" textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="monospace">
                3.5 Bar
              </text>
            </g>

            {/* Downstream to MFC */}
            <path
              d="M 580 250 L 680 250"
              fill="none"
              stroke={isPrimaryFlowing || isSecondaryFlowing ? '#06b6d4' : '#1e293b'}
              strokeWidth="6"
            />
            <circle cx="710" cy="250" r="10" fill="#0f172a" stroke="#334155" strokeWidth="2" />
            <path
              d="M 720 250 L 780 250"
              fill="none"
              stroke={isPrimaryFlowing || isSecondaryFlowing || isReserveFlowing ? '#22d3ee' : '#1e293b'}
              strokeWidth="6"
            />
            {(isPrimaryFlowing || isSecondaryFlowing || isReserveFlowing) && (
              <path
                d="M 720 250 L 780 250"
                fill="none"
                stroke="#ffffff"
                strokeWidth="3"
                strokeDasharray="8 12"
                className="animate-[dash_1s_linear_infinite]"
              />
            )}

            {/* Mass Flow Controller */}
            <g transform="translate(780, 220)">
              <rect width="70" height="60" rx="8" fill="#0f172a" stroke="#10b981" strokeWidth="2" />
              <text x="35" y="28" textAnchor="middle" fill="#34d399" fontSize="10" fontWeight="bold">
                MASS FLOW
              </text>
              <text x="35" y="44" textAnchor="middle" fill="#ffffff" fontSize="11" fontFamily="monospace" fontWeight="bold">
                {settings.flowRateLpm.toFixed(1)} L/M
              </text>
            </g>

            {/* Delivery Cannula */}
            <path
              d="M 850 250 L 940 250"
              fill="none"
              stroke={isPrimaryFlowing || isSecondaryFlowing || isReserveFlowing ? '#22d3ee' : '#1e293b'}
              strokeWidth="6"
            />
            {(isPrimaryFlowing || isSecondaryFlowing || isReserveFlowing) && (
              <path
                d="M 850 250 L 940 250"
                fill="none"
                stroke="#ffffff"
                strokeWidth="3"
                strokeDasharray="8 12"
                className="animate-[dash_1s_linear_infinite]"
              />
            )}

            {/* Patient Endpoint */}
            <g transform="translate(940, 220)">
              <rect width="50" height="60" rx="10" fill="#0369a1" stroke="#38bdf8" strokeWidth="2" />
              <text x="25" y="28" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold">
                PATIENT
              </text>
              <text x="25" y="44" textAnchor="middle" fill="#e0f2fe" fontSize="9" fontFamily="monospace">
                CANNULA
              </text>
            </g>

            {/* Primary Cylinder */}
            <g transform="translate(50, 60)">
              <rect width="110" height="120" rx="14" fill="#091224" stroke={isPrimaryFlowing ? '#06b6d4' : '#334155'} strokeWidth="2" />
              <rect x="95" y="50" width="25" height="20" rx="4" fill="#1e293b" stroke="#06b6d4" strokeWidth="1.5" />
              <text x="55" y="30" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold">
                PRIMARY (A-1)
              </text>
              <text x="55" y="52" textAnchor="middle" fill="#38bdf8" fontSize="18" fontWeight="bold">
                {primaryCylinder.percentRemaining}%
              </text>
              <text x="55" y="72" textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="monospace">
                {primaryCylinder.currentPressureBar} Bar
              </text>
              <text x="55" y="88" textAnchor="middle" fill="#64748b" fontSize="9" fontFamily="monospace">
                {primaryCylinder.remainingMinutes} min
              </text>
              <rect x="15" y="98" width="80" height="16" rx="4" fill={isPrimaryFlowing ? '#065f46' : '#1e293b'} />
              <text x="55" y="110" textAnchor="middle" fill={isPrimaryFlowing ? '#34d399' : '#94a3b8'} fontSize="9" fontWeight="bold">
                {isPrimaryFlowing ? 'SOLENOID OPEN' : 'ISOLATED'}
              </text>
            </g>

            {/* Valve 1 */}
            <g transform="translate(260, 105)">
              <polygon points="0,0 30,15 0,30" fill={isPrimaryFlowing ? '#06b6d4' : '#334155'} />
              <polygon points="30,0 0,15 30,30" fill={isPrimaryFlowing ? '#06b6d4' : '#334155'} />
              <text x="15" y="-5" textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="monospace">
                VALVE V-1
              </text>
            </g>

            {/* Backup Cylinder */}
            <g transform="translate(50, 320)">
              <rect width="110" height="120" rx="14" fill="#091224" stroke={isSecondaryFlowing ? '#14b8a6' : '#334155'} strokeWidth="2" />
              <rect x="95" y="50" width="25" height="20" rx="4" fill="#1e293b" stroke="#14b8a6" strokeWidth="1.5" />
              <text x="55" y="30" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold">
                BACKUP (B-2)
              </text>
              <text x="55" y="52" textAnchor="middle" fill="#2dd4bf" fontSize="18" fontWeight="bold">
                {secondaryCylinder.percentRemaining}%
              </text>
              <text x="55" y="72" textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="monospace">
                {secondaryCylinder.currentPressureBar} Bar
              </text>
              <text x="55" y="88" textAnchor="middle" fill="#64748b" fontSize="9" fontFamily="monospace">
                {secondaryCylinder.remainingMinutes} min
              </text>
              <rect x="15" y="98" width="80" height="16" rx="4" fill={isSecondaryFlowing ? '#065f46' : '#1e293b'} />
              <text x="55" y="110" textAnchor="middle" fill={isSecondaryFlowing ? '#34d399' : '#94a3b8'} fontSize="9" fontWeight="bold">
                {isSecondaryFlowing ? 'SOLENOID OPEN' : 'STANDBY'}
              </text>
            </g>

            {/* Valve 2 */}
            <g transform="translate(260, 365)">
              <polygon points="0,0 30,15 0,30" fill={isSecondaryFlowing ? '#14b8a6' : '#334155'} />
              <polygon points="30,0 0,15 30,30" fill={isSecondaryFlowing ? '#14b8a6' : '#334155'} />
              <text x="15" y="-5" textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="monospace">
                VALVE V-2
              </text>
            </g>

            {/* Reserve Buffer */}
            <g transform="translate(550, 60)">
              <rect
                width="110"
                height="110"
                rx="14"
                fill="#130d1d"
                stroke={isReserveFlowing ? '#ef4444' : reserveBuffer.percentRemaining < 100 ? '#f59e0b' : '#06b6d4'}
                strokeWidth="2"
                filter={isReserveFlowing ? 'url(#redGlow)' : undefined}
              />
              <text x="55" y="24" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold">
                5-MIN RESERVE
              </text>
              <text x="55" y="46" textAnchor="middle" fill={isReserveFlowing ? '#f87171' : '#38bdf8'} fontSize="18" fontWeight="bold">
                {Math.floor(reserveBuffer.remainingSeconds / 60)}:
                {(reserveBuffer.remainingSeconds % 60).toString().padStart(2, '0')}
              </text>
              <text x="55" y="66" textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="monospace">
                {reserveBuffer.percentRemaining}% ({reserveBuffer.currentGasLiters.toFixed(1)}L)
              </text>
              <rect
                x="15"
                y="80"
                width="80"
                height="18"
                rx="4"
                fill={isReserveFlowing ? '#991b1b' : reserveBuffer.isRefilling ? '#075985' : '#1e293b'}
              />
              <text x="55" y="93" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">
                {isReserveFlowing ? 'EMERGENCY FEED' : reserveBuffer.isRefilling ? 'REFILLING' : 'CHARGED'}
              </text>
            </g>
          </svg>
        </div>

        {/* Clean Legend */}
        <div className="flex flex-wrap items-center gap-5 text-xs text-[var(--text-secondary)]">
          <span className="inline-flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
            Primary Circuit
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
            Backup Circuit
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
            Emergency Reserve
          </span>
        </div>
      </div>

      {/* Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="clinical-card p-5 space-y-3">
          <div className="flex items-center justify-between text-xs tabular-nums">
            <label
              htmlFor="manifold-thresh-slider"
              className="font-semibold text-[var(--text-primary)] inline-flex items-center gap-1.5"
            >
              <Sliders className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
              Auto-Switch Threshold
            </label>
            <span className="font-mono font-bold text-[var(--accent-primary)]">
              {settings.switchingThresholdPercent}% Capacity
            </span>
          </div>
          <input
            id="manifold-thresh-slider"
            type="range"
            min="5"
            max="25"
            step="1"
            value={settings.switchingThresholdPercent}
            onChange={(e) => setSwitchingThreshold(parseInt(e.target.value, 10))}
            className="clinical-slider"
          />
          <p className="text-xs text-[var(--text-muted)] tabular-nums">
            Switches automatically from A-1 to B-2 at {settings.switchingThresholdPercent}% (approx.{' '}
            {(settings.switchingThresholdPercent * 1.5).toFixed(0)} Bar).
          </p>
        </div>

        <div className="clinical-card p-5 space-y-3">
          <div className="flex items-center justify-between text-xs tabular-nums">
            <label
              htmlFor="manifold-flow-slider"
              className="font-semibold text-[var(--text-primary)] inline-flex items-center gap-1.5"
            >
              <Sliders className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              Cannula Flow Rate
            </label>
            <span className="font-mono font-bold text-teal-600 dark:text-teal-400">
              {settings.flowRateLpm.toFixed(1)} L/min
            </span>
          </div>
          <input
            id="manifold-flow-slider"
            type="range"
            min="0.5"
            max="15.0"
            step="0.5"
            value={settings.flowRateLpm}
            onChange={(e) => setFlowRate(parseFloat(e.target.value))}
            className="clinical-slider"
          />
          <p className="text-xs text-[var(--text-muted)]">
            Adjusts volumetric delivery and recalculates tank depletion rates proportionally.
          </p>
        </div>
      </div>
    </div>
  );
};
