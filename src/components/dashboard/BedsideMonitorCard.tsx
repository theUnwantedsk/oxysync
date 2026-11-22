import React, { useRef, useEffect } from 'react';
import { 
  Heart, 
  Activity, 
  Wind, 
  Gauge, 
  Sliders, 
  Volume2, 
  VolumeX,
  Radio,
  Clock
} from 'lucide-react';
import { useTelemetry } from '../../context/TelemetryContext';

export const BedsideMonitorCard: React.FC = () => {
  const { 
    vitals, 
    settings, 
    setFlowRate, 
    togglePulseOximeterSound,
    masterClockMs,
    therapyElapsedFormatted 
  } = useTelemetry();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Multi-Lead 60 FPS Oscilloscope Canvas with Medical Sweep Bar
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let sweepX = 0;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;

      // Draw dark phosphor medical CRT background
      ctx.fillStyle = '#030712';
      ctx.fillRect(0, 0, width, height);

      // Fine medical graph grid (1 mm / 5 mm scale)
      ctx.strokeStyle = '#0a1628';
      ctx.lineWidth = 1;
      const smallGrid = 15;
      for (let x = 0; x < width; x += smallGrid) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += smallGrid) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw Channel 1: Lead II ECG (Green Trace)
      const ecgData = vitals.ecgWaveform;
      const ecgHeight = height * 0.45;
      const ecgBaseline = ecgHeight * 0.6;

      ctx.beginPath();
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2.0;
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 6;

      const step = width / (ecgData.length - 1);
      for (let i = 0; i < ecgData.length; i++) {
        const x = i * step;
        const y = ecgBaseline - (ecgData[i] - 0.5) * (ecgHeight * 0.85);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Channel 1 Label
      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 10px monospace';
      ctx.fillText('LEAD II · 1.0 mV/cm', 12, 18);

      // Divider Line between ECG and Pleth
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, height * 0.48);
      ctx.lineTo(width, height * 0.48);
      ctx.stroke();

      // Draw Channel 2: Plethysmograph PPG (Cyan Trace)
      const plethData = vitals.plethWaveform;
      const plethTop = height * 0.52;
      const plethHeight = height * 0.45;

      ctx.beginPath();
      const plethColor = vitals.spo2 < 90 ? '#ef4444' : '#06b6d4';
      ctx.strokeStyle = plethColor;
      ctx.lineWidth = 2.2;
      ctx.shadowColor = plethColor;
      ctx.shadowBlur = 8;

      for (let i = 0; i < plethData.length; i++) {
        const x = i * step;
        const y = plethTop + (1 - plethData[i]) * plethHeight * 0.75 + plethHeight * 0.1;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Channel 2 Label
      ctx.fillStyle = plethColor;
      ctx.font = 'bold 10px monospace';
      ctx.fillText(`PPG PLETH · SpO₂ ${vitals.spo2}%`, 12, height * 0.54);

      // Erase Sweep Bar (Medical Phosphor Erase Head)
      sweepX = (sweepX + (settings.sweepSpeedMmPerSec / 25) * 4) % width;
      const sweepGradient = ctx.createLinearGradient(sweepX - 25, 0, sweepX + 5, 0);
      sweepGradient.addColorStop(0, 'rgba(3, 7, 18, 0)');
      sweepGradient.addColorStop(0.7, 'rgba(3, 7, 18, 0.85)');
      sweepGradient.addColorStop(1, 'rgba(3, 7, 18, 0.95)');
      ctx.fillStyle = sweepGradient;
      ctx.fillRect(Math.max(0, sweepX - 25), 0, 30, height);

      // Vertical phosphor leading bar
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(sweepX, 0);
      ctx.lineTo(sweepX, height);
      ctx.stroke();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [vitals.ecgWaveform, vitals.plethWaveform, vitals.spo2, settings.sweepSpeedMmPerSec]);

  const getSpo2Color = (spo2: number) => {
    if (spo2 >= 95) return 'text-emerald-400 border-emerald-500/40 bg-emerald-950/20';
    if (spo2 >= 90) return 'text-amber-400 border-amber-500/40 bg-amber-950/20';
    return 'text-red-400 border-red-500/50 bg-red-950/30 animate-pulse';
  };

  return (
    <div className="bg-[#080d1a] rounded-3xl border border-slate-800 p-6 shadow-2xl backdrop-blur-md space-y-6">
      
      {/* Bedside Monitor Header with Clock Chronometer */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-teal-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Activity className="w-5 h-5 text-slate-950 font-black" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-white tracking-wide">
                Bedside Patient Telemetry Monitor
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                TELEMETRY ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Lead II ECG · Multi-Wavelength Pulse Oximetry · Microstream EtCO₂
            </p>
          </div>
        </div>

        {/* Precision Master Chronometer & Audio Tone Control */}
        <div className="flex items-center flex-wrap gap-3 font-mono text-xs">
          
          {/* Master Clock */}
          <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <div>
              <span className="text-[10px] text-slate-500 block leading-tight">MASTER RTC:</span>
              <span className="text-white font-bold">{masterClockMs || '18:45:00.00'}</span>
            </div>
          </div>

          {/* Therapy Elapsed Timer */}
          <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 flex items-center gap-2">
            <Radio className="w-4 h-4 text-teal-400 animate-pulse" />
            <div>
              <span className="text-[10px] text-slate-500 block leading-tight">THERAPY ELAPSED:</span>
              <span className="text-cyan-300 font-bold">{therapyElapsedFormatted}</span>
            </div>
          </div>

          {/* Pulse Oximeter Pitch Tone Toggle */}
          <button
            onClick={togglePulseOximeterSound}
            className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 transition-all ${
              settings.pulseOximeterBeepEnabled
                ? 'bg-cyan-950/60 border-cyan-500/50 text-cyan-300'
                : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
            title="Toggle Medical Pulse Oximeter Tone (Pitch Modulates with SpO2)"
          >
            {settings.pulseOximeterBeepEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4" />}
            <span className="text-[11px] font-bold">
              {settings.pulseOximeterBeepEnabled ? `QRS Tone (${Math.round(400 + Math.pow((vitals.spo2 - 70) / 30, 1.4) * 500)} Hz)` : 'Muted'}
            </span>
          </button>
        </div>
      </div>

      {/* Main Telemetry Readout Grid (Digital 7-Segment Medical Aesthetics) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* SpO2 Card */}
        <div className={`p-5 rounded-2xl border transition-all ${getSpo2Color(vitals.spo2)}`}>
          <div className="flex items-center justify-between text-xs opacity-80 mb-1">
            <span className="font-bold tracking-wider font-mono">SpO₂ SATURATION</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/40">CALIBRATED</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl sm:text-5xl font-black font-mono tracking-tight">{vitals.spo2}</span>
            <span className="text-lg font-bold opacity-75">%</span>
          </div>
          <div className="mt-3 text-[11px] font-mono opacity-80 flex items-center justify-between border-t border-current/20 pt-2">
            <span>Range: 94-98%</span>
            <span className="font-bold">{vitals.spo2 < 90 ? 'HYPOXEMIC' : 'NOMINAL'}</span>
          </div>
        </div>

        {/* Pulse Rate Card */}
        <div className="p-5 rounded-2xl border border-rose-500/40 bg-rose-950/20 text-rose-300">
          <div className="flex items-center justify-between text-xs opacity-80 mb-1">
            <span className="font-bold tracking-wider font-mono flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
              HEART RATE
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/40">LEAD II</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-white">{vitals.pulseRate}</span>
            <span className="text-lg font-bold opacity-75">BPM</span>
          </div>
          <div className="mt-3 text-[11px] font-mono opacity-80 flex items-center justify-between border-t border-rose-500/20 pt-2">
            <span>Sinus Rhythm</span>
            <span>{vitals.pulseRate > 100 ? 'Tachycardia' : 'Normal'}</span>
          </div>
        </div>

        {/* Respiratory Rate Card */}
        <div className="p-5 rounded-2xl border border-cyan-500/40 bg-cyan-950/20 text-cyan-300">
          <div className="flex items-center justify-between text-xs opacity-80 mb-1">
            <span className="font-bold tracking-wider font-mono flex items-center gap-1.5">
              <Wind className="w-3.5 h-3.5 text-cyan-400" />
              RESPIRATORY RATE
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/40">PNEUMO</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-white">{vitals.respiratoryRate}</span>
            <span className="text-lg font-bold opacity-75">br/min</span>
          </div>
          <div className="mt-3 text-[11px] font-mono opacity-80 flex items-center justify-between border-t border-cyan-500/20 pt-2">
            <span>Normal: 12-20</span>
            <span>Spontaneous</span>
          </div>
        </div>

        {/* Perfusion Index Card */}
        <div className="p-5 rounded-2xl border border-teal-500/40 bg-teal-950/20 text-teal-300">
          <div className="flex items-center justify-between text-xs opacity-80 mb-1">
            <span className="font-bold tracking-wider font-mono flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-teal-400" />
              PERFUSION INDEX
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/40">OPTICAL</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-white">{vitals.perfusionIndex}</span>
            <span className="text-lg font-bold opacity-75">%</span>
          </div>
          <div className="mt-3 text-[11px] font-mono opacity-80 flex items-center justify-between border-t border-teal-500/20 pt-2">
            <span>Signal Strength</span>
            <span>Optimal</span>
          </div>
        </div>

      </div>

      {/* Dual Waveform Oscilloscope & Flow Titration Rack */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        
        {/* Multi-Channel CRT Canvas (ECG + Pleth) */}
        <div className="lg:col-span-3 bg-[#030712] p-4 rounded-2xl border border-slate-800 space-y-3 relative overflow-hidden shadow-inner">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <div className="flex items-center gap-3">
              <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                ECG LEAD II (Green)
              </span>
              <span className="text-cyan-400 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                PLETH PPG (Cyan)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span>Sweep: 25 mm/s</span>
              <span className="text-slate-600">|</span>
              <span className="text-amber-400">SIMULATED SENSOR HARNESS</span>
            </div>
          </div>

          <div className="relative w-full h-48 bg-[#02050e] rounded-xl overflow-hidden border border-slate-900">
            <canvas
              ref={canvasRef}
              width={780}
              height={192}
              className="w-full h-full block"
            />
          </div>
        </div>

        {/* Oxygen Flow Titration Rack */}
        <div className="bg-[#060a14] p-5 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4 shadow-lg">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                Oxygen Flow Delivery
              </label>
              <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                {settings.flowRateLpm.toFixed(1)} L/M
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Titration adjusts clinical delivery and recalculates cylinder runtimes in real time.
            </p>
          </div>

          <input
            type="range"
            min="0.5"
            max="15.0"
            step="0.5"
            value={settings.flowRateLpm}
            onChange={(e) => setFlowRate(parseFloat(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer h-2.5 bg-slate-800 rounded-lg"
          />

          {/* Quick preset buttons */}
          <div className="grid grid-cols-4 gap-1.5">
            {[1.0, 2.0, 2.5, 4.0, 6.0, 8.0, 10.0, 15.0].map((rate) => (
              <button
                key={rate}
                onClick={() => setFlowRate(rate)}
                className={`py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all ${
                  settings.flowRateLpm === rate
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                }`}
              >
                {rate}L
              </button>
            ))}
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-[10px] font-mono text-slate-400 leading-tight">
            Mass Flow: {(settings.flowRateLpm * 1000).toFixed(0)} SCCM · Cannula Pressure: 1.05 Bar
          </div>
        </div>

      </div>

    </div>
  );
};
