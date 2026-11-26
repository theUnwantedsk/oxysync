import React from 'react';
import { 
  GitBranch, 
  RefreshCw, 
  Sliders, 
  AlertTriangle,
  Play
} from 'lucide-react';
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

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-[#0c1220]/80 rounded-2xl border border-slate-800 p-5 shadow-xl backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
              <GitBranch className="w-4 h-4 text-cyan-400" />
            </div>
            <h1 className="text-xl font-bold text-white">Smart Supply Manifold & Flow Path</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/20">
              SIMULATED VALVE LOGIC
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time visual schematic of dual-cylinder automated failover, solenoid valves, and 5-minute failsafe reserve bridge.
          </p>
        </div>

        {/* Disclaimer Card */}
        <div className="px-3.5 py-2 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2 font-mono">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
          <span>Software simulation only. Does not imply physical electromechanical valve actuation.</span>
        </div>
      </div>

      {/* Main Interactive Manifold SVG Schematic */}
      <div className="bg-[#060a14] rounded-2xl border border-slate-800 p-6 shadow-2xl relative overflow-hidden">
        
        {/* Schematic Canvas Subheader */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-800/80 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-mono text-slate-400">ACTIVE FEED:</span>
            <span className="px-3 py-1 rounded-full font-bold uppercase tracking-wider text-xs bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
              {activeSource === 'primary' ? 'Primary Cylinder (A-1)' : (activeSource === 'secondary' ? 'Secondary Cylinder (B-2)' : (activeSource === 'reserve' ? '5-Min Reserve Buffer' : 'None (Depleted)'))}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => switchActiveSource('primary', 'Manual Manifold Toggle')}
              disabled={activeSource === 'primary' || primaryCylinder.percentRemaining <= 0}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
                activeSource === 'primary' 
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20' 
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 disabled:opacity-40'
              }`}
            >
              <Play className="w-3 h-3" /> Select Primary
            </button>

            <button
              onClick={() => switchActiveSource('secondary', 'Manual Manifold Toggle')}
              disabled={activeSource === 'secondary' || secondaryCylinder.percentRemaining <= 0}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
                activeSource === 'secondary' 
                  ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20' 
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 disabled:opacity-40'
              }`}
            >
              <Play className="w-3 h-3" /> Select Secondary
            </button>

            <button
              onClick={() => refillCylinder('all')}
              className="px-3 py-1.5 rounded-lg font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5 text-cyan-400" /> Refill All
            </button>
          </div>
        </div>

        {/* SVG Diagram */}
        <div data-dark-surface="true" className="w-full overflow-x-auto rounded-xl bg-[#060a14] p-2 border border-slate-800">
          <svg viewBox="0 0 1000 500" className="w-full min-w-[800px] h-auto select-none">
            <defs>
              {/* Pipe glow filter */}
              <filter id="cyanGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="redGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Background grid */}
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#0e172a" strokeWidth="1" />
            </pattern>
            <rect width="1000" height="500" fill="url(#grid)" />

            {/* ================= PIPING NETWORK ================= */}
            
            {/* Primary Pipe Line (From Primary Cyl to Manifold) */}
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

            {/* Secondary Pipe Line (From Secondary Cyl to Manifold) */}
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

            {/* Central Manifold Junction */}
            <rect x="380" y="215" width="40" height="70" rx="8" fill="#0f172a" stroke="#334155" strokeWidth="2" />
            <text x="400" y="254" textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="monospace" fontWeight="bold">MANIFOLD</text>

            {/* Pipe from Manifold to Regulator */}
            <path
              d="M 420 250 L 520 250"
              fill="none"
              stroke={(isPrimaryFlowing || isSecondaryFlowing) ? '#06b6d4' : '#1e293b'}
              strokeWidth="6"
              strokeLinecap="round"
              filter={(isPrimaryFlowing || isSecondaryFlowing) ? 'url(#cyanGlow)' : undefined}
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

            {/* Pipe to & from 5-Minute Reserve Buffer */}
            {/* Recharge line (Bleed from manifold to buffer) */}
            <path
              d="M 470 250 L 470 120 L 570 120"
              fill="none"
              stroke={reserveBuffer.isRefilling ? '#38bdf8' : '#1e293b'}
              strokeWidth="4"
              strokeDasharray={reserveBuffer.isRefilling ? '4 4' : undefined}
            />
            {/* Reserve Discharge Line into main stream */}
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

            {/* Pressure Regulator Unit */}
            <g transform="translate(520, 220)">
              <rect width="60" height="60" rx="8" fill="#0f172a" stroke="#0ea5e9" strokeWidth="2" />
              <text x="30" y="28" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="bold">REGULATOR</text>
              <text x="30" y="44" textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="monospace">3.5 Bar</text>
            </g>

            {/* Pipe from Regulator to MFC */}
            <path
              d="M 580 250 L 680 250"
              fill="none"
              stroke={(isPrimaryFlowing || isSecondaryFlowing) ? '#06b6d4' : '#1e293b'}
              strokeWidth="6"
            />

            {/* Delivery Junction (Meeting with Reserve Buffer) */}
            <circle cx="710" cy="250" r="10" fill="#0f172a" stroke="#334155" strokeWidth="2" />

            {/* Pipe to Mass Flow Controller (MFC) */}
            <path
              d="M 720 250 L 780 250"
              fill="none"
              stroke={(isPrimaryFlowing || isSecondaryFlowing || isReserveFlowing) ? '#22d3ee' : '#1e293b'}
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
              <text x="35" y="28" textAnchor="middle" fill="#34d399" fontSize="10" fontWeight="bold">MASS FLOW</text>
              <text x="35" y="44" textAnchor="middle" fill="#ffffff" fontSize="11" fontFamily="monospace" fontWeight="bold">
                {settings.flowRateLpm.toFixed(1)} L/M
              </text>
            </g>

            {/* Delivery Cannula Pipe to Patient */}
            <path
              d="M 850 250 L 940 250"
              fill="none"
              stroke={(isPrimaryFlowing || isSecondaryFlowing || isReserveFlowing) ? '#22d3ee' : '#1e293b'}
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

            {/* Patient Cannula Delivery Icon / Endpoint */}
            <g transform="translate(940, 220)">
              <rect width="50" height="60" rx="10" fill="#0369a1" stroke="#38bdf8" strokeWidth="2" />
              <text x="25" y="28" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold">PATIENT</text>
              <text x="25" y="44" textAnchor="middle" fill="#e0f2fe" fontSize="9" fontFamily="monospace">CANNULA</text>
            </g>

            {/* ================= COMPONENT UNITS ================= */}

            {/* 1. PRIMARY CYLINDER TANK (Top Left) */}
            <g transform="translate(50, 60)">
              {/* Cylinder Body */}
              <rect width="110" height="120" rx="16" fill="#091224" stroke={isPrimaryFlowing ? '#06b6d4' : '#334155'} strokeWidth="2" />
              {/* Valve Neck */}
              <rect x="95" y="50" width="25" height="20" rx="4" fill="#1e293b" stroke="#06b6d4" strokeWidth="1.5" />
              <text x="55" y="30" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold">PRIMARY (A-1)</text>
              <text x="55" y="52" textAnchor="middle" fill="#38bdf8" fontSize="18" fontWeight="black">{primaryCylinder.percentRemaining}%</text>
              <text x="55" y="72" textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="monospace">{primaryCylinder.currentPressureBar} Bar</text>
              <text x="55" y="88" textAnchor="middle" fill="#64748b" fontSize="9" fontFamily="monospace">{primaryCylinder.remainingMinutes} min</text>
              
              {/* Valve Status Badge */}
              <rect x="15" y="98" width="80" height="16" rx="4" fill={isPrimaryFlowing ? '#065f46' : '#1e293b'} />
              <text x="55" y="110" textAnchor="middle" fill={isPrimaryFlowing ? '#34d399' : '#64748b'} fontSize="9" fontWeight="bold">
                {isPrimaryFlowing ? 'SOLENOID OPEN' : 'ISOLATED'}
              </text>
            </g>

            {/* Solenoid Valve 1 (Primary) */}
            <g transform="translate(260, 105)">
              <polygon points="0,0 30,15 0,30" fill={isPrimaryFlowing ? '#06b6d4' : '#334155'} />
              <polygon points="30,0 0,15 30,30" fill={isPrimaryFlowing ? '#06b6d4' : '#334155'} />
              <text x="15" y="-5" textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="monospace">VALVE V-1</text>
            </g>

            {/* 2. SECONDARY CYLINDER TANK (Bottom Left) */}
            <g transform="translate(50, 320)">
              {/* Cylinder Body */}
              <rect width="110" height="120" rx="16" fill="#091224" stroke={isSecondaryFlowing ? '#14b8a6' : '#334155'} strokeWidth="2" />
              {/* Valve Neck */}
              <rect x="95" y="50" width="25" height="20" rx="4" fill="#1e293b" stroke="#14b8a6" strokeWidth="1.5" />
              <text x="55" y="30" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold">BACKUP (B-2)</text>
              <text x="55" y="52" textAnchor="middle" fill="#2dd4bf" fontSize="18" fontWeight="black">{secondaryCylinder.percentRemaining}%</text>
              <text x="55" y="72" textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="monospace">{secondaryCylinder.currentPressureBar} Bar</text>
              <text x="55" y="88" textAnchor="middle" fill="#64748b" fontSize="9" fontFamily="monospace">{secondaryCylinder.remainingMinutes} min</text>
              
              {/* Valve Status Badge */}
              <rect x="15" y="98" width="80" height="16" rx="4" fill={isSecondaryFlowing ? '#065f46' : '#1e293b'} />
              <text x="55" y="110" textAnchor="middle" fill={isSecondaryFlowing ? '#34d399' : '#64748b'} fontSize="9" fontWeight="bold">
                {isSecondaryFlowing ? 'SOLENOID OPEN' : 'STANDBY CLOSED'}
              </text>
            </g>

            {/* Solenoid Valve 2 (Secondary) */}
            <g transform="translate(260, 365)">
              <polygon points="0,0 30,15 0,30" fill={isSecondaryFlowing ? '#14b8a6' : '#334155'} />
              <polygon points="30,0 0,15 30,30" fill={isSecondaryFlowing ? '#14b8a6' : '#334155'} />
              <text x="15" y="-5" textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="monospace">VALVE V-2</text>
            </g>

            {/* 3. FIVE-MINUTE RESERVE BUFFER (Top Center) */}
            <g transform="translate(550, 60)">
              <rect width="110" height="110" rx="14" fill="#130d1d" stroke={isReserveFlowing ? '#ef4444' : (reserveBuffer.percentRemaining < 100 ? '#f59e0b' : '#06b6d4')} strokeWidth="2" filter={isReserveFlowing ? 'url(#redGlow)' : undefined} />
              <text x="55" y="24" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold">5-MIN RESERVE</text>
              <text x="55" y="46" textAnchor="middle" fill={isReserveFlowing ? '#f87171' : '#38bdf8'} fontSize="18" fontWeight="black">
                {Math.floor(reserveBuffer.remainingSeconds / 60)}:{(reserveBuffer.remainingSeconds % 60).toString().padStart(2, '0')}
              </text>
              <text x="55" y="66" textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="monospace">
                {reserveBuffer.percentRemaining}% ({reserveBuffer.currentGasLiters.toFixed(1)}L)
              </text>
              <rect x="15" y="80" width="80" height="18" rx="4" fill={isReserveFlowing ? '#991b1b' : (reserveBuffer.isRefilling ? '#075985' : '#1e293b')} />
              <text x="55" y="93" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">
                {isReserveFlowing ? 'EMERGENCY FEED' : (reserveBuffer.isRefilling ? 'REFILLING...' : 'CHARGED')}
              </text>
            </g>

          </svg>
        </div>

        {/* Legend */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400" />
              Primary Supply Circuit
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-teal-400 shadow-sm shadow-teal-400" />
              Secondary Backup Circuit
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-500 shadow-sm shadow-red-500 animate-pulse" />
              5-Min Emergency Reserve Buffer
            </span>
          </div>

          <span className="font-mono text-[11px] text-slate-500">
            Flow Direction: Tanks → Manifold → Regulator (3.5 Bar) → Mass Flow Controller → Cannula
          </span>
        </div>
      </div>

      {/* Threshold & Failover Configuration Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Switching Threshold Slider */}
        <div className="p-4 rounded-xl bg-[#0c1220]/80 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <label className="font-bold text-slate-200 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              Auto-Switch Threshold Trigger
            </label>
            <span className="font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              {settings.switchingThresholdPercent}% of Full Capacity
            </span>
          </div>
          <input
            type="range"
            min="5"
            max="25"
            step="1"
            value={settings.switchingThresholdPercent}
            onChange={(e) => setSwitchingThreshold(parseInt(e.target.value, 10))}
            className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
          />
          <p className="text-[11px] text-slate-400">
            When Primary Cylinder drops to {settings.switchingThresholdPercent}% (approx. {(settings.switchingThresholdPercent * 1.5).toFixed(0)} Bar), the OXYSYNC Control Engine immediately energizes Valve V-2 and secures Valve V-1.
          </p>
        </div>

        {/* Patient Delivery Rate */}
        <div className="p-4 rounded-xl bg-[#0c1220]/80 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <label className="font-bold text-slate-200 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-teal-400" />
              Delivered Flow Rate
            </label>
            <span className="font-mono font-bold px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
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
            className="w-full accent-teal-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
          />
          <p className="text-[11px] text-slate-400">
            Regulates the simulated mass flow delivery through the patient nasal cannula. Higher consumption rates accelerate cylinder depletion curves proportionately.
          </p>
        </div>

      </div>
    </div>
  );
};
