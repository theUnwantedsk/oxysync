import React from 'react';
import { useTelemetry } from '../context/TelemetryContext';
import { Sliders, ShieldCheck, Cpu, Zap, AlertCircle } from 'lucide-react';

interface TitrationControlProps {
  onOpenPrescription: () => void;
}

export const TitrationControl: React.FC<TitrationControlProps> = ({ onOpenPrescription }) => {
  const { 
    supply, 
    prescription, 
    setFlowRate, 
    setTitrationMode, 
    emergencyBoost 
  } = useTelemetry();

  const isAuto = prescription.titrationMode === 'auto';

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setFlowRate(val);
  };

  const handleQuickPreset = (flow: number) => {
    setFlowRate(flow);
  };

  return (
    <div className="bg-[#0b1424] border border-slate-800/90 rounded-2xl p-5 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Oxygen Titration & Flow Control
            </h2>
            <p className="text-xs text-slate-400">
              Closed-Loop Closed Feedback vs Clinician Manual Override
            </p>
          </div>
        </div>

        {/* Mode Toggle Switch */}
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
          <button
            onClick={() => setTitrationMode('auto')}
            className={`px-3 py-1.5 rounded-md font-bold flex items-center gap-1.5 transition-colors ${
              isAuto 
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Closed-Loop Auto</span>
          </button>
          <button
            onClick={() => setTitrationMode('manual')}
            className={`px-3 py-1.5 rounded-md font-bold flex items-center gap-1.5 transition-colors ${
              !isAuto 
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Manual Override</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
        
        {/* Left Column: Mode Status & Physician Bounds */}
        <div className="lg:col-span-1 space-y-3">
          <div className={`p-4 rounded-xl border ${
            isAuto 
              ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-300' 
              : 'bg-amber-500/5 border-amber-500/20 text-amber-300'
          }`}>
            <div className="flex items-center gap-2 font-bold text-sm mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>{isAuto ? 'Auto Algorithm Active' : 'Manual Mode Active'}</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {isAuto
                ? `Dynamically titrating flow between ${prescription.minAllowedFlow} L/min and ${prescription.maxAllowedFlow} L/min to target ${prescription.targetSpo2Min}-${prescription.targetSpo2Max}% SpO₂.`
                : 'Manual flow control. Patient/caregiver is responsible for maintaining prescribed saturation levels.'
              }
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs text-slate-400">
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-slate-300">Physician Prescription:</span>
              <button 
                onClick={onOpenPrescription}
                className="text-cyan-400 hover:underline font-semibold"
              >
                Edit Prescription
              </button>
            </div>
            <div className="text-[11px] text-slate-400">
              Dr. S. Mitchell • Max Limit: {prescription.maxAllowedFlow} L/min • Min: {prescription.minAllowedFlow} L/min
            </div>
          </div>
        </div>

        {/* Center & Right Column: Manual Flow Slider & Quick Steppers */}
        <div className="lg:col-span-2 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-300 tracking-wider">
                FLOW RATE CONTROL ({supply.flowRate.toFixed(1)} L/min)
              </label>
              {isAuto && (
                <span className="text-[11px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Auto-Adjusting via SpO₂ Feedback
                </span>
              )}
            </div>

            {/* Slider */}
            <div className="relative py-2">
              <input
                type="range"
                min="0.5"
                max="8.0"
                step="0.1"
                value={supply.flowRate}
                onChange={handleSliderChange}
                disabled={isAuto}
                className={`w-full h-3 rounded-lg appearance-none cursor-pointer transition-all ${
                  isAuto ? 'opacity-40 cursor-not-allowed bg-slate-800' : 'bg-slate-800 accent-cyan-400'
                }`}
              />
              <div className="flex justify-between text-[11px] font-mono text-slate-500 mt-1">
                <span>0.5 L/m</span>
                <span className="text-cyan-400 font-bold">1.0 L/m (Min Rx)</span>
                <span className="text-amber-400 font-bold">5.0 L/m (Max Rx)</span>
                <span>8.0 L/m</span>
              </div>
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="flex items-center gap-2 flex-wrap pt-2">
            <span className="text-xs text-slate-400 font-semibold mr-1">Quick Flow Presets:</span>
            {[1.0, 2.0, 3.0, 4.0, 5.0].map(flow => (
              <button
                key={flow}
                disabled={isAuto}
                onClick={() => handleQuickPreset(flow)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all ${
                  isAuto 
                    ? 'opacity-30 border-slate-800 text-slate-500 cursor-not-allowed'
                    : Math.abs(supply.flowRate - flow) < 0.05
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-sm shadow-cyan-500/20'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                {flow.toFixed(1)} L/m
              </button>
            ))}

            <button
              onClick={emergencyBoost}
              className="ml-auto px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>5.0L Boost</span>
            </button>
          </div>

          {isAuto && (
            <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>To manually move the slider or set presets, switch to <strong>Manual Override</strong> above or tap <strong>5.0L Boost</strong>.</span>
            </p>
          )}
        </div>

      </div>
    </div>
  );
};
