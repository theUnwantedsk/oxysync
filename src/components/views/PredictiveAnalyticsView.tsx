import React, { useMemo } from 'react';
import { 
  TrendingUp, 
  Clock, 
  Calculator, 
  CheckCircle2, 
  Info, 
  Calendar, 
  Zap, 
  ShieldAlert
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { useTelemetry } from '../../context/TelemetryContext';
import { generatePredictiveTrend } from '../../services/physicsEngine';

export const PredictiveAnalyticsView: React.FC = () => {
  const {
    primaryCylinder,
    secondaryCylinder,
    reserveBuffer,
    settings,
    predictions,
    setFlowRate
  } = useTelemetry();

  // Generate predictive consumption trend points for Recharts
  const chartData = useMemo(() => {
    return generatePredictiveTrend(
      primaryCylinder.remainingGasLiters,
      secondaryCylinder.remainingGasLiters,
      reserveBuffer.currentGasLiters,
      settings.flowRateLpm,
      settings.switchingThresholdPercent,
      primaryCylinder.maxPressureBar * primaryCylinder.waterCapacityLiters,
      secondaryCylinder.maxPressureBar * secondaryCylinder.waterCapacityLiters,
      reserveBuffer.capacityLiters,
      16, // 16 intervals
      15  // 15 min steps = 4 hours forecast
    );
  }, [
    primaryCylinder.remainingGasLiters,
    primaryCylinder.maxPressureBar,
    primaryCylinder.waterCapacityLiters,
    secondaryCylinder.remainingGasLiters,
    secondaryCylinder.maxPressureBar,
    secondaryCylinder.waterCapacityLiters,
    reserveBuffer.currentGasLiters,
    reserveBuffer.capacityLiters,
    settings.flowRateLpm,
    settings.switchingThresholdPercent
  ]);

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="bg-[#0c1220]/80 rounded-2xl border border-slate-800 p-5 shadow-xl backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-teal-400" />
            </div>
            <h1 className="text-xl font-bold text-white">Predictive Depletion Analytics</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
              DETERMINISTIC PHYSICS MODEL
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time calculations of gas consumption, threshold crossing times, and total supply runtime forecasts.
          </p>
        </div>

        {/* AI Disclaimer Badge */}
        <div className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 text-xs flex items-center gap-2 font-mono">
          <Info className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>Physics-based mathematical formulas (Boyle's Law), not black-box heuristic AI.</span>
        </div>
      </div>

      {/* 4 Prediction Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total System Depletion */}
        <div className="p-4 rounded-xl bg-[#080d1a] border border-cyan-500/30">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              Total Depletion Time
            </span>
          </div>
          <div className="text-2xl font-black text-white mt-1">
            {Math.floor(predictions.totalSystemMinutes / 60)}h {predictions.totalSystemMinutes % 60}m
          </div>
          <div className="mt-2 text-[11px] font-mono text-cyan-300">
            Projected: {predictions.totalSystemDepletionTimeStr}
          </div>
        </div>

        {/* Primary Cylinder Depletion */}
        <div className="p-4 rounded-xl bg-[#080d1a] border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-teal-400" />
              Primary Exhaustion
            </span>
          </div>
          <div className="text-2xl font-black text-white mt-1">
            {Math.floor(predictions.primaryDepletionMinutes / 60)}h {predictions.primaryDepletionMinutes % 60}m
          </div>
          <div className="mt-2 text-[11px] font-mono text-slate-400">
            Expected switch: {predictions.predictedSwitchTimeStr}
          </div>
        </div>

        {/* Secondary Cylinder Depletion */}
        <div className="p-4 rounded-xl bg-[#080d1a] border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              Backup Exhaustion
            </span>
          </div>
          <div className="text-2xl font-black text-white mt-1">
            {Math.floor(predictions.secondaryDepletionMinutes / 60)}h {predictions.secondaryDepletionMinutes % 60}m
          </div>
          <div className="mt-2 text-[11px] font-mono text-slate-400">
            Projected: {predictions.secondaryDepletionTimeStr}
          </div>
        </div>

        {/* Reserve Buffer Runtime */}
        <div className="p-4 rounded-xl bg-[#080d1a] border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              5-Min Reserve Bridge
            </span>
          </div>
          <div className="text-2xl font-black text-white mt-1">
            {Math.floor(predictions.reserveDepletionSeconds / 60)}m {predictions.reserveDepletionSeconds % 60}s
          </div>
          <div className="mt-2 text-[11px] font-mono text-amber-400">
            Target: 05:00 at {settings.flowRateLpm.toFixed(1)} L/min
          </div>
        </div>

      </div>

      {/* Recharts Forecast Chart */}
      <div className="bg-[#080d1a] p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              Multi-Source Oxygen Depletion Forecast (Next 4 Hours)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Simulated depletion trajectories based on steady {settings.flowRateLpm.toFixed(1)} L/min consumption rate.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 font-mono">Adjust Flow:</span>
            <input
              type="range"
              min="0.5"
              max="10.0"
              step="0.5"
              value={settings.flowRateLpm}
              onChange={(e) => setFlowRate(parseFloat(e.target.value))}
              className="accent-cyan-400 cursor-pointer h-2 bg-slate-800 rounded-lg w-28"
            />
            <span className="text-xs font-mono font-bold text-cyan-300">{settings.flowRateLpm.toFixed(1)} L/m</span>
          </div>
        </div>

        {/* Chart Container */}
        <div className="w-full h-80 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="primGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="secGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="combGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="timeLabel" stroke="#64748b" fontSize={11} fontFamily="monospace" />
              <YAxis stroke="#64748b" fontSize={11} fontFamily="monospace" unit="%" domain={[0, 100]} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#0f172a', 
                  borderColor: '#334155', 
                  borderRadius: '0.75rem', 
                  fontSize: '12px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
                }} 
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Area type="monotone" dataKey="combinedPercent" name="Total System Oxygen (%)" stroke="#818cf8" strokeWidth={2} fillOpacity={1} fill="url(#combGrad)" />
              <Area type="monotone" dataKey="primaryPercent" name="Primary Cylinder (A-1)" stroke="#06b6d4" strokeWidth={2.5} fillOpacity={1} fill="url(#primGrad)" />
              <Area type="monotone" dataKey="secondaryPercent" name="Backup Cylinder (B-2)" stroke="#14b8a6" strokeWidth={2} fillOpacity={1} fill="url(#secGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Transparent Formula & Physics Assumptions Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Mathematical Formulas Card */}
        <div className="p-5 rounded-2xl bg-[#080d1a] border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-cyan-300">
            <Calculator className="w-4 h-4 text-cyan-400" />
            <span>TRANSPARENT MATHEMATICAL MODEL</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 font-mono text-xs space-y-2 text-slate-300">
            <div className="text-cyan-400 font-bold">1. Boyle\'s Gas Volume:</div>
            <div className="pl-3 text-slate-200">V_gas = P_cylinder (bar) × V_water (Liters)</div>
            <div className="pl-3 text-[11px] text-slate-500">e.g. 150 bar × 4.4L = 660 Liters of gaseous oxygen</div>

            <div className="text-cyan-400 font-bold pt-1">2. Runtime Duration:</div>
            <div className="pl-3 text-slate-200">T_remaining (minutes) = V_gas (L) / Q_flow (L/min)</div>
            <div className="pl-3 text-[11px] text-slate-500">e.g. 660L / 2.5 L/min = 264 minutes (4h 24m)</div>

            <div className="text-cyan-400 font-bold pt-1">3. Auto-Switch Timestamp:</div>
            <div className="pl-3 text-slate-200">T_switch = Now + ((V_gas - V_threshold) / Q_flow)</div>
          </div>
        </div>

        {/* Physics Assumptions Card */}
        <div className="p-5 rounded-2xl bg-[#080d1a] border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-teal-300">
            <CheckCircle2 className="w-4 h-4 text-teal-400" />
            <span>PHYSICS & ENGINEERING ASSUMPTIONS</span>
          </div>

          <ul className="space-y-2 text-xs text-slate-300">
            {predictions.assumptions.map((ass, idx) => (
              <li key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1.5 shrink-0" />
                <span className="font-mono text-[11px]">{ass}</span>
              </li>
            ))}
          </ul>

          <p className="text-[10px] text-slate-500 leading-tight pt-1">
            Note: Clinical validation of pressure regulator droop, temperature compensation, and cylinder valve seating required before deploying in real medical hardware.
          </p>
        </div>

      </div>

    </div>
  );
};
