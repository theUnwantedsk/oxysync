import React, { useRef, useEffect } from 'react';
import { useTelemetry } from '../context/TelemetryContext';
import { Heart, Activity, Wind, AlertCircle } from 'lucide-react';

export const VitalsSection: React.FC = () => {
  const { vitals, prescription, device, setCannulaAttached } = useTelemetry();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Render continuous PPG waveform on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Dark grid background
    ctx.fillStyle = '#070f1e';
    ctx.fillRect(0, 0, width, height);

    // Grid lines
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.07)';
    ctx.lineWidth = 1;

    for (let x = 0; x < width; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    if (!device.cannulaAttached) {
      // Flatline or noise if cannula/probe is detached
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      for (let x = 0; x < width; x += 5) {
        ctx.lineTo(x, height / 2 + (Math.random() * 4 - 2));
      }
      ctx.stroke();

      // Flatline text
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 12px monospace';
      ctx.fillText('PROBE DISCONNECTED — NO PULSE SIGNAL', width / 2 - 130, height / 2 - 15);
      return;
    }

    // Draw smooth PPG wave
    ctx.strokeStyle = '#00e5ff';
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 8;
    ctx.lineWidth = 2.5;
    ctx.beginPath();

    const data = vitals.plethWaveform;
    const step = width / (data.length - 1);

    data.forEach((val, i) => {
      // Invert val for canvas y coordinate (0 at top)
      const y = height - (val * (height * 0.75) + height * 0.12);
      const x = i * step;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Reset shadow
    ctx.shadowBlur = 0;
  }, [vitals.plethWaveform, device.cannulaAttached]);

  // SpO2 status derivation
  let spo2Color = 'text-emerald-400';
  let spo2Bg = 'bg-emerald-500/10 border-emerald-500/30';
  let spo2Status = 'Optimal Range';

  if (vitals.spo2 < 85) {
    spo2Color = 'text-rose-400';
    spo2Bg = 'bg-rose-500/10 border-rose-500/30 animate-pulse';
    spo2Status = 'Critical Hypoxemia';
  } else if (vitals.spo2 < 90) {
    spo2Color = 'text-amber-400';
    spo2Bg = 'bg-amber-500/10 border-amber-500/30';
    spo2Status = 'Hypoxemia Caution';
  } else if (vitals.spo2 < prescription.targetSpo2Min) {
    spo2Color = 'text-amber-300';
    spo2Bg = 'bg-amber-400/10 border-amber-400/20';
    spo2Status = 'Below Target Band';
  }

  // Heart animation speed in seconds per beat
  const beatSec = Math.max(0.3, 60 / vitals.pulseRate);

  return (
    <div className="bg-[#0b1424] border border-slate-800/90 rounded-2xl p-5 shadow-xl">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Patient Vitals Telemetry
            </h2>
            <p className="text-xs text-slate-400">
              Continuous Optical Pulse Oximetry & Plethysmography
            </p>
          </div>
        </div>

        {/* Cannula probe toggle */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Sensor Probe:</span>
          <button
            onClick={() => setCannulaAttached(!device.cannulaAttached)}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition-colors ${
              device.cannulaAttached
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-rose-500/20 border-rose-500/40 text-rose-300 animate-pulse'
            }`}
          >
            {device.cannulaAttached ? 'Attached' : 'Detached / Off'}
          </button>
        </div>
      </div>

      {/* Grid of Main Vitals Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {/* SpO2 Card */}
        <div className={`rounded-xl p-4 border transition-all ${spo2Bg}`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-slate-400 tracking-wider">OXYGEN SATURATION</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-black/40 border border-white/10 text-slate-300">
              SpO₂
            </span>
          </div>

          <div className="flex items-baseline gap-2 mt-2">
            <span className={`text-4xl sm:text-5xl font-extrabold font-mono tracking-tight ${spo2Color}`}>
              {device.cannulaAttached ? vitals.spo2 : '--'}
            </span>
            <span className="text-lg font-bold text-slate-400">%</span>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs">
            <span className={`font-semibold ${spo2Color}`}>{device.cannulaAttached ? spo2Status : 'No Signal'}</span>
            <span className="text-slate-400 font-mono text-[11px]">
              Target: {prescription.targetSpo2Min}-{prescription.targetSpo2Max}%
            </span>
          </div>

          {/* Visual Mini Progress Bar */}
          <div className="w-full bg-slate-900/80 rounded-full h-1.5 mt-2.5 overflow-hidden border border-slate-800">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                vitals.spo2 >= 95 ? 'bg-emerald-400' : vitals.spo2 >= 90 ? 'bg-amber-400' : 'bg-rose-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, vitals.spo2))}%` }}
            />
          </div>
        </div>

        {/* Pulse Rate Card */}
        <div className="rounded-xl p-4 border border-slate-800 bg-slate-900/60">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-slate-400 tracking-wider">PULSE RATE</span>
            <div 
              className="p-1 rounded-full bg-rose-500/10 text-rose-500"
              style={{ animation: device.cannulaAttached ? `ping ${beatSec}s cubic-bezier(0, 0, 0.2, 1) infinite` : 'none' }}
            >
              <Heart className="w-3.5 h-3.5 fill-current" />
            </div>
          </div>

          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-4xl sm:text-5xl font-extrabold font-mono tracking-tight text-white">
              {device.cannulaAttached ? vitals.pulseRate : '--'}
            </span>
            <span className="text-sm font-bold text-slate-400">BPM</span>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
            <span>
              {vitals.pulseRate > 100 ? (
                <span className="text-amber-400 font-semibold">Tachycardic</span>
              ) : vitals.pulseRate < 60 ? (
                <span className="text-amber-400 font-semibold">Bradycardic</span>
              ) : (
                <span className="text-emerald-400 font-semibold">Normal Rhythm</span>
              )}
            </span>
            <span className="font-mono text-[11px]">Normal: 60-100</span>
          </div>

          <div className="w-full bg-slate-900/80 rounded-full h-1.5 mt-2.5 overflow-hidden border border-slate-800">
            <div 
              className="h-full bg-cyan-400 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (vitals.pulseRate / 180) * 100)}%` }}
            />
          </div>
        </div>

        {/* Respiratory Rate */}
        <div className="rounded-xl p-4 border border-slate-800 bg-slate-900/60">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-slate-400 tracking-wider">RESPIRATION</span>
            <Wind className="w-4 h-4 text-cyan-400" />
          </div>

          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-4xl sm:text-5xl font-extrabold font-mono tracking-tight text-cyan-300">
              {device.cannulaAttached ? vitals.respiratoryRate : '--'}
            </span>
            <span className="text-sm font-bold text-slate-400">Br/min</span>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
            <span>{vitals.respiratoryRate > 20 ? 'Elevated Effort' : 'Eupnea'}</span>
            <span className="font-mono text-[11px]">Resting: 12-20</span>
          </div>

          <div className="w-full bg-slate-900/80 rounded-full h-1.5 mt-2.5 overflow-hidden border border-slate-800">
            <div 
              className="h-full bg-blue-400 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (vitals.respiratoryRate / 40) * 100)}%` }}
            />
          </div>
        </div>

        {/* Perfusion Index */}
        <div className="rounded-xl p-4 border border-slate-800 bg-slate-900/60">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-slate-400 tracking-wider">PERFUSION INDEX</span>
            <span className="text-[11px] font-mono text-slate-400">PI%</span>
          </div>

          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-4xl sm:text-5xl font-extrabold font-mono tracking-tight text-slate-100">
              {device.cannulaAttached ? vitals.perfusionIndex : '--'}
            </span>
            <span className="text-sm font-bold text-slate-400">%</span>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
            <span className="text-emerald-400 font-semibold">Pulse Signal Strong</span>
            <span className="font-mono text-[11px]">&gt; 0.5% Valid</span>
          </div>

          <div className="w-full bg-slate-900/80 rounded-full h-1.5 mt-2.5 overflow-hidden border border-slate-800">
            <div 
              className="h-full bg-indigo-400 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (vitals.perfusionIndex / 10) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* PPG Waveform Canvas Card */}
      <div className="rounded-xl border border-slate-800 bg-[#070f1e] p-3.5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-xs font-mono font-bold text-cyan-400 tracking-wider">
              REAL-TIME PHOTOPLETHYSMOGRAM (PPG) WAVEFORM
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            60 Hz Refresh • Filter: Bandpass 0.5-5.0Hz
          </span>
        </div>

        <div className="w-full h-28 relative overflow-hidden rounded-lg border border-slate-800/80">
          <canvas 
            ref={canvasRef} 
            width={720} 
            height={112} 
            className="w-full h-full block" 
          />
        </div>

        {!device.cannulaAttached && (
          <div className="mt-2 text-xs text-rose-400 flex items-center gap-1.5 justify-center">
            <AlertCircle className="w-4 h-4" />
            <span>Nasal cannula/pulse oximeter disconnected from patient. Telemetry degraded.</span>
          </div>
        )}
      </div>
    </div>
  );
};
