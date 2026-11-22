import React, { useRef, useEffect } from 'react';
import { Heart, Activity, Wind, Gauge, ShieldAlert, Sliders } from 'lucide-react';
import { useTelemetry } from '../../context/TelemetryContext';

export const PatientMonitoringCard: React.FC = () => {
  const { vitals, settings, setFlowRate } = useTelemetry();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Draw 60 FPS live PPG Plethysmograph waveform
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // Draw medical grid lines
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.8)';
      ctx.lineWidth = 1;
      const gridSize = 20;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw PPG waveform
      const data = vitals.plethWaveform;
      if (data.length > 1) {
        ctx.beginPath();
        const step = width / (data.length - 1);

        for (let i = 0; i < data.length; i++) {
          const x = i * step;
          // Invert y so 1 is top, 0 is bottom
          const y = height - (data[i] * (height * 0.75) + height * 0.12);
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }

        // Glow effect
        ctx.shadowBlur = 8;
        ctx.shadowColor = vitals.spo2 < 90 ? '#ef4444' : '#06b6d4';
        ctx.strokeStyle = vitals.spo2 < 90 ? '#ef4444' : '#22d3ee';
        ctx.lineWidth = 2.2;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Current sweep head marker
        const lastIdx = data.length - 1;
        const lastX = lastIdx * step;
        const lastY = height - (data[lastIdx] * (height * 0.75) + height * 0.12);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(lastX, lastY, 3.5, 0, 2 * Math.PI);
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [vitals.plethWaveform, vitals.spo2]);

  const getSpo2Color = (spo2: number) => {
    if (spo2 >= 95) return 'text-emerald-400 border-emerald-500/40 bg-emerald-950/20';
    if (spo2 >= 90) return 'text-amber-400 border-amber-500/40 bg-amber-950/20';
    return 'text-red-400 border-red-500/50 bg-red-950/30 animate-pulse';
  };

  const getStatusBadge = () => {
    switch (vitals.patientStatus) {
      case 'stable':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">STABLE</span>;
      case 'borderline':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">BORDERLINE</span>;
      case 'hypoxemic':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-500/20 text-orange-400 border border-orange-500/30">HYPOXEMIC</span>;
      case 'critical':
        return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse">CRITICAL DESATURATION</span>;
    }
  };

  return (
    <div className="bg-[#0c1220]/80 rounded-2xl border border-slate-800 p-5 shadow-xl backdrop-blur-md space-y-5">
      {/* Panel Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Patient Monitoring Panel
              {getStatusBadge()}
            </h2>
            <p className="text-xs text-slate-400">Continuous physiological telemetry & titration interface</p>
          </div>
        </div>

        {/* Permanent Simulation Banner */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-950/40 border border-amber-500/30 text-[11px] text-amber-300 font-mono">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>SIMULATED MEASUREMENTS ONLY — NOT FOR CLINICAL USE</span>
        </div>
      </div>

      {/* Main Vitals Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* SpO2 Card */}
        <div className={`p-4 rounded-xl border transition-all ${getSpo2Color(vitals.spo2)}`}>
          <div className="flex items-center justify-between text-xs opacity-80 mb-1">
            <span className="font-semibold tracking-wider">SpO₂ SATURATION</span>
            <span className="font-mono text-[10px]">SIM</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl sm:text-4xl font-black tracking-tight">{vitals.spo2}</span>
            <span className="text-sm font-semibold opacity-70">%</span>
          </div>
          <div className="mt-2 text-[11px] opacity-75 font-medium flex items-center justify-between">
            <span>Target: 94-98%</span>
            <span>{vitals.spo2 < 90 ? 'HYPOXEMIC' : 'NOMINAL'}</span>
          </div>
        </div>

        {/* Heart Rate Card */}
        <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-950/20 text-rose-300">
          <div className="flex items-center justify-between text-xs opacity-80 mb-1">
            <span className="font-semibold tracking-wider flex items-center gap-1">
              <Heart className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
              PULSE RATE
            </span>
            <span className="font-mono text-[10px]">SIM</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl sm:text-4xl font-black tracking-tight text-white">{vitals.pulseRate}</span>
            <span className="text-sm font-semibold opacity-70">BPM</span>
          </div>
          <div className="mt-2 text-[11px] opacity-75 font-medium flex items-center justify-between">
            <span>Rhythm: Normal Sinus</span>
            <span>{vitals.pulseRate > 100 ? 'Tachycardia' : 'Stable'}</span>
          </div>
        </div>

        {/* Respiratory Rate Card */}
        <div className="p-4 rounded-xl border border-cyan-500/30 bg-cyan-950/20 text-cyan-300">
          <div className="flex items-center justify-between text-xs opacity-80 mb-1">
            <span className="font-semibold tracking-wider flex items-center gap-1">
              <Wind className="w-3.5 h-3.5 text-cyan-400" />
              RESPIRATION
            </span>
            <span className="font-mono text-[10px]">SIM</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl sm:text-4xl font-black tracking-tight text-white">{vitals.respiratoryRate}</span>
            <span className="text-sm font-semibold opacity-70">br/min</span>
          </div>
          <div className="mt-2 text-[11px] opacity-75 font-medium flex items-center justify-between">
            <span>Ref: 12-20</span>
            <span>Spontaneous</span>
          </div>
        </div>

        {/* Perfusion Index Card */}
        <div className="p-4 rounded-xl border border-teal-500/30 bg-teal-950/20 text-teal-300">
          <div className="flex items-center justify-between text-xs opacity-80 mb-1">
            <span className="font-semibold tracking-wider flex items-center gap-1">
              <Gauge className="w-3.5 h-3.5 text-teal-400" />
              PERFUSION INDEX
            </span>
            <span className="font-mono text-[10px]">SIM</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl sm:text-4xl font-black tracking-tight text-white">{vitals.perfusionIndex}</span>
            <span className="text-sm font-semibold opacity-70">%</span>
          </div>
          <div className="mt-2 text-[11px] opacity-75 font-medium flex items-center justify-between">
            <span>Signal Quality: Good</span>
            <span>Finger Probe</span>
          </div>
        </div>

      </div>

      {/* Waveform & Flow Rate Control Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* PPG Pleth Waveform Canvas */}
        <div className="lg:col-span-2 bg-[#060a14] p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="flex items-center gap-1.5 font-semibold text-cyan-300">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              Live Plethysmograph Waveform (PPG) [SIMULATED]
            </span>
            <span className="font-mono text-[11px] text-slate-500">60 FPS Real-Time Render</span>
          </div>
          <div className="relative w-full h-28 bg-[#04070e] rounded-lg overflow-hidden border border-slate-900">
            <canvas
              ref={canvasRef}
              width={640}
              height={112}
              className="w-full h-full block"
            />
          </div>
        </div>

        {/* Configurable Flow Rate Slider & Presets */}
        <div className="bg-[#080d1a] p-4 rounded-xl border border-slate-800 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              Oxygen Flow Rate
            </label>
            <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
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
            className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
          />

          {/* Quick preset buttons */}
          <div className="grid grid-cols-5 gap-1 pt-1">
            {[1.0, 2.0, 2.5, 4.0, 6.0].map((rate) => (
              <button
                key={rate}
                onClick={() => setFlowRate(rate)}
                className={`py-1 rounded text-[11px] font-mono font-semibold transition-all ${
                  settings.flowRateLpm === rate
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                }`}
              >
                {rate}L
              </button>
            ))}
          </div>

          <p className="text-[10px] text-slate-400 leading-tight">
            Adjusting flow rate dynamically recalculates remaining cylinder duration in real time.
          </p>
        </div>

      </div>
    </div>
  );
};
