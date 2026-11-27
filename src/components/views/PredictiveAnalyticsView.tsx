import React, { useMemo } from 'react';
import { TrendingUp, Clock, Calculator, CheckCircle2, Calendar, Zap, ShieldAlert } from 'lucide-react';
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
      16,
      15
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
    <div className="space-y-5">
      {/* Header */}
      <div className="clinical-card p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-[var(--text-primary)] tracking-tight">
            Depletion Forecast &amp; Boyle&apos;s Law Modeling
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Analytical gas volume projection, switchover crossing time, and runtime headroom
          </p>
        </div>
        <span className="font-mono text-xs text-[var(--text-muted)]">
          V_gas = P × V_water · T = V / Q
        </span>
      </div>

      {/* 4 Forecast Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="clinical-card p-4">
          <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-muted)]">
            <Clock className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
            Combined Depletion
          </div>
          <div className="text-2xl font-bold font-mono text-[var(--text-primary)] mt-1 tabular-nums">
            {Math.floor(predictions.totalSystemMinutes / 60)}h {predictions.totalSystemMinutes % 60}m
          </div>
          <div className="mt-1.5 text-xs font-mono text-[var(--accent-primary)] tabular-nums">
            Empty at {predictions.totalSystemDepletionTimeStr}
          </div>
        </div>

        <div className="clinical-card p-4">
          <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-muted)]">
            <Zap className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            Primary Exhaustion
          </div>
          <div className="text-2xl font-bold font-mono text-[var(--text-primary)] mt-1 tabular-nums">
            {Math.floor(predictions.primaryDepletionMinutes / 60)}h {predictions.primaryDepletionMinutes % 60}m
          </div>
          <div className="mt-1.5 text-xs font-mono text-[var(--text-muted)] tabular-nums">
            Auto-switch {predictions.predictedSwitchTimeStr}
          </div>
        </div>

        <div className="clinical-card p-4">
          <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-muted)]">
            <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            Backup Exhaustion
          </div>
          <div className="text-2xl font-bold font-mono text-[var(--text-primary)] mt-1 tabular-nums">
            {Math.floor(predictions.secondaryDepletionMinutes / 60)}h {predictions.secondaryDepletionMinutes % 60}m
          </div>
          <div className="mt-1.5 text-xs font-mono text-[var(--text-muted)] tabular-nums">
            Empty at {predictions.secondaryDepletionTimeStr}
          </div>
        </div>

        <div className="clinical-card p-4">
          <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-muted)]">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            Reserve Bridge
          </div>
          <div className="text-2xl font-bold font-mono text-[var(--text-primary)] mt-1 tabular-nums">
            {Math.floor(predictions.reserveDepletionSeconds / 60)}m {predictions.reserveDepletionSeconds % 60}s
          </div>
          <div className="mt-1.5 text-xs font-mono text-amber-600 dark:text-amber-400 tabular-nums">
            Target 05:00 at {settings.flowRateLpm.toFixed(1)} L/min
          </div>
        </div>
      </div>

      {/* Forecast Trajectory Chart */}
      <div className="clinical-card p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border-subtle)]">
          <div>
            <h2 className="text-sm font-bold text-[var(--text-primary)] inline-flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[var(--accent-primary)]" />
              4-Hour Multi-Source Depletion Curve
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5 tabular-nums">
              Continuous depletion projection at {settings.flowRateLpm.toFixed(1)} L/min flow rate
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="text-xs text-[var(--text-muted)] shrink-0">Flow Rate</span>
            <input
              type="range"
              min="0.5"
              max="10.0"
              step="0.5"
              value={settings.flowRateLpm}
              onChange={(e) => setFlowRate(parseFloat(e.target.value))}
              className="clinical-slider w-28"
            />
            <span className="text-xs font-mono font-bold text-[var(--accent-primary)] tabular-nums shrink-0">
              {settings.flowRateLpm.toFixed(1)} L/m
            </span>
          </div>
        </div>

        <div className="w-full h-80 pt-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="primGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0891b2" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="#0891b2" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="secGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0d9488" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#0d9488" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="combGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
              <XAxis dataKey="timeLabel" stroke="var(--chart-axis)" fontSize={11} fontFamily="monospace" />
              <YAxis stroke="var(--chart-axis)" fontSize={11} fontFamily="monospace" unit="%" domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--chart-tooltip-bg)',
                  borderColor: 'var(--chart-tooltip-border)',
                  color: 'var(--chart-tooltip-text)',
                  borderRadius: '0.5rem',
                  fontSize: '12px'
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
              <Area
                type="monotone"
                dataKey="combinedPercent"
                name="Total System Oxygen (%)"
                stroke="#6366f1"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#combGrad)"
                isAnimationActive={false}
              />
              <Area
                type="monotone"
                dataKey="primaryPercent"
                name="Primary Cylinder (A-1)"
                stroke="#0891b2"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#primGrad)"
                isAnimationActive={false}
              />
              <Area
                type="monotone"
                dataKey="secondaryPercent"
                name="Backup Cylinder (B-2)"
                stroke="#0d9488"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#secGrad)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Equations & Assumptions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="clinical-card p-5 space-y-3">
          <div className="text-xs font-semibold text-[var(--text-primary)] inline-flex items-center gap-2">
            <Calculator className="w-4 h-4 text-[var(--accent-primary)]" />
            Governing Equations
          </div>

          <div className="clinical-well p-4 font-mono text-xs space-y-2 text-[var(--text-secondary)]">
            <div className="font-semibold text-[var(--accent-primary)]">1. Boyle&apos;s Gas Volume</div>
            <div className="pl-3">V_gas = P_cylinder (bar) × V_water (L)</div>
            <div className="pl-3 text-[11px] text-[var(--text-muted)]">150 bar × 4.4 L = 660 L NTP</div>

            <div className="font-semibold text-[var(--accent-primary)] pt-1">2. Remaining Duration</div>
            <div className="pl-3">T_remaining (min) = V_gas (L) / Q_flow (L/min)</div>
            <div className="pl-3 text-[11px] text-[var(--text-muted)]">660 L / 2.5 L/min = 264 min (4h 24m)</div>

            <div className="font-semibold text-[var(--accent-primary)] pt-1">3. Switchover Timestamp</div>
            <div className="pl-3">T_switch = Now + ((V_gas − V_threshold) / Q_flow)</div>
          </div>
        </div>

        <div className="clinical-card p-5 space-y-3">
          <div className="text-xs font-semibold text-[var(--text-primary)] inline-flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            Model Assumptions
          </div>

          <ul className="space-y-2 text-xs">
            {predictions.assumptions.map((ass, idx) => (
              <li
                key={idx}
                className="clinical-well p-2.5 flex items-start gap-2 font-mono text-[11px] text-[var(--text-secondary)]"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-teal-600 dark:bg-teal-400 mt-1.5 shrink-0" />
                <span>{ass}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
