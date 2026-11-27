import React, { useRef, useEffect } from 'react';
import { Sliders, Volume2, VolumeX, Clock } from 'lucide-react';
import { useTelemetry } from '../../context/TelemetryContext';
import { PrecisionClock } from '../PrecisionClock';

export const BedsideMonitorCard: React.FC = () => {
  const {
    vitals,
    settings,
    setFlowRate,
    togglePulseOximeterSound,
    therapyElapsedFormatted
  } = useTelemetry();

  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const vitalsRef = useRef(vitals);
  const sweepSpeedRef = useRef(settings.sweepSpeedMmPerSec);
  const sweepXRef = useRef(0);

  vitalsRef.current = vitals;
  sweepSpeedRef.current = settings.sweepSpeedMmPerSec;

  // High-DPI 60 FPS delta-time oscilloscope canvas (ECG Lead II + PPG Pleth)
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrapper = canvasContainerRef.current;
    if (!canvas || !wrapper) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let cssWidth = wrapper.clientWidth || 780;
    let cssHeight = wrapper.clientHeight || 192;

    const updateSize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cssWidth = wrapper.clientWidth || 780;
      cssHeight = wrapper.clientHeight || 192;
      canvas.width = Math.round(cssWidth * dpr);
      canvas.height = Math.round(cssHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    updateSize();

    const observer = new ResizeObserver(updateSize);
    observer.observe(wrapper);

    let animId = 0;
    let lastTime = performance.now();

    const render = (now: number) => {
      const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;

      const width = cssWidth;
      const height = cssHeight;
      const curVitals = vitalsRef.current;

      // Phosphor dark instrumentation surface
      ctx.fillStyle = '#050a14';
      ctx.fillRect(0, 0, width, height);

      // Subtle 15px medical calibration grid
      ctx.strokeStyle = '#0e1b30';
      ctx.lineWidth = 1;
      const gridStep = 18;
      ctx.beginPath();
      for (let x = 0; x < width; x += gridStep) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = 0; y < height; y += gridStep) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      // Divider between Lead II and Pleth channels
      ctx.strokeStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(0, height * 0.49);
      ctx.lineTo(width, height * 0.49);
      ctx.stroke();

      // Channel 1: Lead II ECG
      const ecgData = curVitals.ecgWaveform;
      const ecgHeight = height * 0.44;
      const ecgBaseline = ecgHeight * 0.62;
      const step = width / Math.max(1, ecgData.length - 1);

      ctx.beginPath();
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 1.9;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      for (let i = 0; i < ecgData.length; i++) {
        const x = i * step;
        const y = ecgBaseline - (ecgData[i] - 0.5) * (ecgHeight * 0.82);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      ctx.fillStyle = '#34d399';
      ctx.font = '600 10px "JetBrains Mono", monospace';
      ctx.fillText('ECG LEAD II · 1.0 mV/cm', 12, 17);

      // Channel 2: PPG Plethysmograph
      const plethData = curVitals.plethWaveform;
      const plethTop = height * 0.53;
      const plethHeight = height * 0.43;
      const plethColor = curVitals.spo2 < 90 ? '#f87171' : '#22d3ee';

      ctx.beginPath();
      ctx.strokeStyle = plethColor;
      ctx.lineWidth = 2.0;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      for (let i = 0; i < plethData.length; i++) {
        const x = i * step;
        const y = plethTop + (1 - plethData[i]) * plethHeight * 0.74 + plethHeight * 0.1;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      ctx.fillStyle = plethColor;
      ctx.font = '600 10px "JetBrains Mono", monospace';
      ctx.fillText(`PLETH PPG · SpO2 ${curVitals.spo2}%`, 12, height * 0.58);

      // Delta-time smooth sweep head
      const pxPerSec = (sweepSpeedRef.current / 25) * 140;
      sweepXRef.current = (sweepXRef.current + pxPerSec * dt) % width;
      const sweepX = sweepXRef.current;

      const sweepGrad = ctx.createLinearGradient(sweepX - 24, 0, sweepX + 4, 0);
      sweepGrad.addColorStop(0, 'rgba(5, 10, 20, 0)');
      sweepGrad.addColorStop(0.75, 'rgba(5, 10, 20, 0.85)');
      sweepGrad.addColorStop(1, 'rgba(5, 10, 20, 0.96)');
      ctx.fillStyle = sweepGrad;
      ctx.fillRect(Math.max(0, sweepX - 24), 0, 28, height);

      ctx.strokeStyle = 'rgba(248, 250, 252, 0.28)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(sweepX, 0);
      ctx.lineTo(sweepX, height);
      ctx.stroke();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animId);
      observer.disconnect();
    };
  }, []);

  const clampedSpo2 = Math.max(70, Math.min(100, vitals.spo2));
  const qrsToneHz = Math.round(400 + Math.pow((clampedSpo2 - 70) / 30, 1.4) * 500);

  const getSpo2Meta = (spo2: number) => {
    if (spo2 >= 95) {
      return {
        accent: 'border-l-emerald-500',
        badge: 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-950/60 dark:border-emerald-800',
        status: 'Nominal'
      };
    }
    if (spo2 >= 90) {
      return {
        accent: 'border-l-amber-500',
        badge: 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-950/60 dark:border-amber-800',
        status: 'Borderline'
      };
    }
    return {
      accent: 'border-l-red-600',
      badge: 'text-red-700 bg-red-50 border-red-200 dark:text-red-300 dark:bg-red-950/60 dark:border-red-800',
      status: 'Hypoxemic'
    };
  };

  const spo2Meta = getSpo2Meta(vitals.spo2);

  return (
    <section className="clinical-card p-4 sm:p-6 space-y-5">
      {/* Header Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-[var(--border-subtle)]">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-[var(--text-primary)] tracking-tight">
            Bedside Patient Telemetry
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Simulated Lead II ECG, pulse oximetry, and volumetric cannula titration
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2 text-xs">
          <div className="clinical-well px-3 py-1.5 flex items-center gap-2 font-mono">
            <Clock className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            <span className="text-[var(--text-muted)] text-[11px]">RTC</span>
            <PrecisionClock showCentiseconds className="font-semibold text-[var(--text-primary)]" />
          </div>

          <div className="clinical-well px-3 py-1.5 flex items-center gap-2 font-mono">
            <span className="text-[var(--text-muted)] text-[11px]">Elapsed</span>
            <span className="font-semibold text-[var(--accent-primary)] tabular-nums">
              {therapyElapsedFormatted}
            </span>
          </div>

          <button
            onClick={togglePulseOximeterSound}
            className="clinical-btn-secondary px-3 py-1.5 text-xs inline-flex items-center gap-1.5 tabular-nums"
            title="Toggle pulse oximeter tone (pitch tracks SpO2)"
          >
            {settings.pulseOximeterBeepEnabled ? (
              <Volume2 className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            )}
            <span>
              {settings.pulseOximeterBeepEnabled ? `QRS Tone · ${qrsToneHz} Hz` : 'QRS Muted'}
            </span>
          </button>
        </div>
      </div>

      {/* Primary Vitals KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* SpO2 */}
        <div className={`clinical-well border-l-4 ${spo2Meta.accent} p-3.5 sm:p-4 min-w-0`}>
          <div className="flex items-center justify-between gap-1.5 text-xs text-[var(--text-muted)] mb-2 flex-wrap">
            <span className="font-semibold truncate">SpO₂</span>
            <span className={`px-1.5 py-0.5 rounded text-[11px] font-medium border ${spo2Meta.badge}`}>
              {spo2Meta.status}
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl sm:text-4xl font-bold font-mono text-[var(--text-primary)] tabular-nums">
              {vitals.spo2}
            </span>
            <span className="text-sm font-medium text-[var(--text-muted)]">%</span>
          </div>
          <div className="text-[11px] text-[var(--text-muted)] font-mono mt-2">Target 94–98%</div>
        </div>

        {/* Heart Rate */}
        <div className="clinical-well border-l-4 border-l-rose-500 p-3.5 sm:p-4 min-w-0">
          <div className="flex items-center justify-between gap-1.5 text-xs text-[var(--text-muted)] mb-2">
            <span className="font-semibold truncate">Heart Rate</span>
            <span className="hidden sm:inline text-[11px] font-mono shrink-0">
              {vitals.pulseRate > 100 ? 'Elevated' : 'Sinus'}
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl sm:text-4xl font-bold font-mono text-[var(--text-primary)] tabular-nums">
              {vitals.pulseRate}
            </span>
            <span className="text-sm font-medium text-[var(--text-muted)]">BPM</span>
          </div>
          <div className="text-[11px] text-[var(--text-muted)] font-mono mt-2">Lead II Optical</div>
        </div>

        {/* Respiratory Rate */}
        <div className="clinical-well border-l-4 border-l-cyan-600 p-3.5 sm:p-4 min-w-0">
          <div className="flex items-center justify-between gap-1.5 text-xs text-[var(--text-muted)] mb-2">
            <span className="font-semibold truncate">Resp. Rate</span>
            <span className="hidden sm:inline text-[11px] font-mono shrink-0">Spontaneous</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl sm:text-4xl font-bold font-mono text-[var(--text-primary)] tabular-nums">
              {vitals.respiratoryRate}
            </span>
            <span className="text-sm font-medium text-[var(--text-muted)]">br/min</span>
          </div>
          <div className="text-[11px] text-[var(--text-muted)] font-mono mt-2">Normal 12–20</div>
        </div>

        {/* Perfusion Index */}
        <div className="clinical-well border-l-4 border-l-teal-600 p-3.5 sm:p-4 min-w-0">
          <div className="flex items-center justify-between gap-1.5 text-xs text-[var(--text-muted)] mb-2">
            <span className="font-semibold truncate">Perfusion Index</span>
            <span className="hidden sm:inline text-[11px] font-mono shrink-0">Strong</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl sm:text-4xl font-bold font-mono text-[var(--text-primary)] tabular-nums">
              {vitals.perfusionIndex}
            </span>
            <span className="text-sm font-medium text-[var(--text-muted)]">%</span>
          </div>
          <div className="text-[11px] text-[var(--text-muted)] font-mono mt-2">Optical Signal</div>
        </div>
      </div>

      {/* Oscilloscope CRT + Flow Titration Rack */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div
          data-dark-surface="true"
          className="lg:col-span-8 bg-[#050a14] p-3.5 rounded-xl border border-slate-800 space-y-2.5"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-400">
            <div className="flex items-center gap-4">
              <span className="text-emerald-400 font-medium">● Lead II ECG</span>
              <span className="text-cyan-400 font-medium">● Pleth PPG</span>
            </div>
            <div className="flex items-center gap-3 tabular-nums">
              <span>Sweep {settings.sweepSpeedMmPerSec} mm/s</span>
              <span className="text-slate-600">·</span>
              <span>Simulated Harness</span>
            </div>
          </div>

          <div ref={canvasContainerRef} className="w-full h-48 rounded-lg overflow-hidden bg-[#050a14]">
            <canvas ref={canvasRef} className="w-full h-full block" />
          </div>
        </div>

        {/* Flow Control Column */}
        <div className="lg:col-span-4 clinical-well p-4 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="bedside-flow-slider"
                className="text-xs font-semibold text-[var(--text-primary)] inline-flex items-center gap-1.5"
              >
                <Sliders className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                Oxygen Flow Rate
              </label>
              <span className="text-sm font-mono font-bold text-[var(--accent-primary)] tabular-nums">
                {settings.flowRateLpm.toFixed(1)} L/min
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Adjusts cannula delivery and recalculates tank depletion curves.
            </p>
          </div>

          <input
            id="bedside-flow-slider"
            type="range"
            min="0.5"
            max="15.0"
            step="0.5"
            value={settings.flowRateLpm}
            onChange={(e) => setFlowRate(parseFloat(e.target.value))}
            className="clinical-slider"
          />

          <div className="grid grid-cols-4 gap-1.5">
            {[1.0, 2.0, 2.5, 4.0, 6.0, 8.0, 10.0, 15.0].map((rate) => {
              const active = settings.flowRateLpm === rate;
              return (
                <button
                  key={rate}
                  onClick={() => setFlowRate(rate)}
                  className={`py-1.5 rounded-md text-[11px] font-mono tabular-nums transition-colors duration-150 border ${
                    active
                      ? 'bg-[var(--accent-primary)] text-white dark:text-slate-950 border-transparent font-semibold'
                      : 'bg-[var(--surface-card)] hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] border-[var(--border-subtle)]'
                  }`}
                >
                  {rate}L
                </button>
              );
            })}
          </div>

          <div className="text-[11px] font-mono text-[var(--text-muted)] pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between tabular-nums">
            <span>Mass Flow: {Math.round(settings.flowRateLpm * 1000)} SCCM</span>
            <span>Line: 1.05 Bar</span>
          </div>
        </div>
      </div>
    </section>
  );
};
