import React from 'react';
import { useTelemetry } from '../context/TelemetryContext';
import { X, Moon, Volume2, VolumeX, Heart, Zap } from 'lucide-react';

interface BedsideNightModeProps {
  onClose: () => void;
}

export const BedsideNightMode: React.FC<BedsideNightModeProps> = ({ onClose }) => {
  const { vitals, supply, prescription, isMuted, toggleMute, emergencyBoost } = useTelemetry();

  const isCritical = vitals.spo2 < 85;
  const isCaution = vitals.spo2 < 90;

  const hoursLeft = Math.floor(supply.remainingRuntimeMinutes / 60);
  const minutesLeft = supply.remainingRuntimeMinutes % 60;

  return (
    <div className="fixed inset-0 z-50 bg-black text-white flex flex-col justify-between p-6 sm:p-10 select-none animate-fadeIn">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-neutral-900 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
            <Moon className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black tracking-tight text-neutral-300">
              OxySync <span className="text-cyan-400">Bedside Night Mode</span>
            </div>
            <div className="text-xs text-neutral-500 font-mono">
              Patient: John Doe • Room 4B • High-Contrast Low-Light Display
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleMute}
            className="p-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 transition-colors"
          >
            {isMuted ? <VolumeX className="w-6 h-6 text-rose-500" /> : <Volume2 className="w-6 h-6 text-cyan-400" />}
          </button>

          <button
            onClick={onClose}
            className="p-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Massive Central Vitals Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-auto max-w-6xl w-full mx-auto">
        
        {/* SpO2 Massive Card */}
        <div className={`p-8 rounded-3xl border-2 flex flex-col justify-between ${
          isCritical 
            ? 'bg-rose-950/40 border-rose-600 text-rose-400 animate-pulse' 
            : isCaution 
            ? 'bg-amber-950/30 border-amber-500 text-amber-400' 
            : 'bg-neutral-950 border-neutral-800 text-cyan-400'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold tracking-widest uppercase">Oxygen Saturation</span>
            <span className="text-sm font-mono px-3 py-1 rounded bg-black/60 border border-white/10 text-neutral-400">
              Target {prescription.targetSpo2Min}-{prescription.targetSpo2Max}%
            </span>
          </div>

          <div className="flex items-baseline gap-4 my-6">
            <span className="text-8xl sm:text-9xl font-black font-mono tracking-tighter">
              {vitals.spo2}
            </span>
            <span className="text-4xl font-bold text-neutral-500">%</span>
          </div>

          <div className="text-lg font-bold">
            {isCritical ? 'CRITICAL DESATURATION' : isCaution ? 'BELOW TARGET BAND' : 'OPTIMAL PATIENT SATURATION'}
          </div>
        </div>

        {/* Pulse Rate & Flow Massive Card */}
        <div className="flex flex-col gap-8 justify-between">
          {/* Pulse Rate */}
          <div className="p-8 rounded-3xl border-2 border-neutral-800 bg-neutral-950 flex items-center justify-between">
            <div>
              <span className="text-lg font-bold tracking-widest text-neutral-400 uppercase block mb-2">
                Pulse Rate
              </span>
              <div className="flex items-baseline gap-3">
                <span className="text-7xl sm:text-8xl font-black font-mono tracking-tighter text-white">
                  {vitals.pulseRate}
                </span>
                <span className="text-2xl font-bold text-neutral-500">BPM</span>
              </div>
            </div>
            <Heart className="w-16 h-16 text-rose-500 animate-pulse" />
          </div>

          {/* Delivery Flow & Runtime */}
          <div className="p-8 rounded-3xl border-2 border-neutral-800 bg-neutral-950 flex items-center justify-between">
            <div>
              <span className="text-lg font-bold tracking-widest text-neutral-400 uppercase block mb-2">
                Oxygen Delivery
              </span>
              <div className="flex items-baseline gap-3">
                <span className="text-7xl sm:text-8xl font-black font-mono tracking-tighter text-emerald-400">
                  {supply.flowRate.toFixed(1)}
                </span>
                <span className="text-2xl font-bold text-neutral-500">L/min</span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-sm font-bold text-neutral-400 uppercase block">Cylinder Reserve</span>
              <span className="text-3xl font-black font-mono text-cyan-300">
                {hoursLeft}h {minutesLeft}m
              </span>
              <span className="text-xs text-neutral-500 block mt-1">{supply.pressurePsi} PSI remaining</span>
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Emergency Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-neutral-900 pt-4">
        <div className="text-xs text-neutral-500">
          Auto Titration Mode: <strong className="text-emerald-400">{prescription.titrationMode.toUpperCase()}</strong> • Prescribed by {prescription.prescribedBy}
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={emergencyBoost}
            className="px-6 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-sm flex items-center gap-2 shadow-lg shadow-rose-900/60"
          >
            <Zap className="w-5 h-5 fill-current" />
            <span>EMERGENCY 5.0L BOOST</span>
          </button>
        </div>
      </div>
    </div>
  );
};
