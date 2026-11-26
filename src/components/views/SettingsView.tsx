import React from 'react';
import { 
  Settings as SettingsIcon, 
  RotateCcw, 
  Volume2, 
  Sliders, 
  Clock, 
  Cylinder, 
  ShieldAlert, 
  Zap, 
  Info
} from 'lucide-react';
import { useTelemetry } from '../../context/TelemetryContext';

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    setFlowRate,
    setSimulationSpeed,
    setSwitchingThreshold,
    resetSimulation
  } = useTelemetry();

  const handleResetSettings = () => {
    updateSettings({
      simulationSpeed: 1,
      switchingThresholdPercent: 10,
      flowRateLpm: 2.5,
      primaryWaterCapacity: 4.4,
      secondaryWaterCapacity: 4.4,
      reserveCapacityLiters: 12.5,
      soundEnabled: true,
      audioVolume: 0.8,
      autoSwitchEnabled: true
    });
    resetSimulation();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-2">
      
      {/* Top Banner */}
      <div className="bg-[#0c1220]/80 rounded-2xl border border-slate-800 p-5 shadow-xl backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center">
              <SettingsIcon className="w-4 h-4 text-cyan-400" />
            </div>
            <h1 className="text-xl font-bold text-white">System Simulation Settings</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Configure simulation speed, gas capacities, switching thresholds, and audio alarm parameters.
          </p>
        </div>

        <button
          onClick={handleResetSettings}
          className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white flex items-center gap-1.5 transition-all self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
          <span>Reset All Defaults</span>
        </button>
      </div>

      {/* Settings Grid */}
      <div className="space-y-4">
        
        {/* 1. Simulation Speed */}
        <div className="p-5 rounded-2xl bg-[#080d1a] border border-slate-800 space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-xs font-bold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                Simulation Clock Speed
              </label>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Accelerates time passage to demonstrate cylinder depletion and automated failover in minutes instead of hours.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {settings.simulationSpeed}x Speed
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2">
            {[0.5, 1, 2, 5, 10].map((spd) => (
              <button
                key={spd}
                onClick={() => setSimulationSpeed(spd)}
                className={`py-2 rounded-xl text-xs font-mono font-bold transition-all ${
                  settings.simulationSpeed === spd
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                }`}
              >
                {spd}x {spd === 1 && '(Realtime)'}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Switching Threshold */}
        <div className="p-5 rounded-2xl bg-[#080d1a] border border-slate-800 space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-xs font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                Automated Failover Switching Threshold
              </label>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Primary cylinder percentage that immediately triggers automatic valve failover to the secondary backup cylinder.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              {settings.switchingThresholdPercent}%
            </span>
          </div>

          <input
            type="range"
            min="5"
            max="30"
            step="1"
            value={settings.switchingThresholdPercent}
            onChange={(e) => setSwitchingThreshold(parseInt(e.target.value, 10))}
            className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
          />

          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>5% (Aggressive)</span>
            <span>10% (Recommended)</span>
            <span>20% (Conservative)</span>
            <span>30% (High Reserve)</span>
          </div>
        </div>

        {/* 3. Patient Flow Rate Consumption */}
        <div className="p-5 rounded-2xl bg-[#080d1a] border border-slate-800 space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-xs font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-teal-400" />
                Patient Delivered Flow Rate (Consumption)
              </label>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Continuous volumetric gas delivery through the patient nasal cannula in Liters per minute.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
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

          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>0.5 L/m (Pediatric/Low)</span>
            <span>2.5 L/m (Standard Nasal)</span>
            <span>6.0 L/m (Moderate Mask)</span>
            <span>15.0 L/m (Non-Rebreather)</span>
          </div>
        </div>

        {/* 4. Cylinder Capacities & Reserve Buffer Configuration */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Cylinder Size Selector */}
          <div className="p-5 rounded-2xl bg-[#080d1a] border border-slate-800 space-y-3">
            <label className="text-xs font-bold text-white flex items-center gap-2">
              <Cylinder className="w-4 h-4 text-indigo-400" />
              Cylinder Water-Capacity (Liters)
            </label>
            <p className="text-[11px] text-slate-400">
              Defines internal water volume for D/E (4.4L = 660L gas) or M-size (10.0L = 1500L gas).
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => updateSettings({ primaryWaterCapacity: 4.4, secondaryWaterCapacity: 4.4 })}
                className={`p-2.5 rounded-xl text-xs font-mono font-semibold transition-all border ${
                  settings.primaryWaterCapacity === 4.4
                    ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                <div>4.4 L (D/E-Size)</div>
                <div className="text-[10px] text-slate-500">660L Gas at 150 Bar</div>
              </button>

              <button
                onClick={() => updateSettings({ primaryWaterCapacity: 10.0, secondaryWaterCapacity: 10.0 })}
                className={`p-2.5 rounded-xl text-xs font-mono font-semibold transition-all border ${
                  settings.primaryWaterCapacity === 10.0
                    ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                <div>10.0 L (M-Size)</div>
                <div className="text-[10px] text-slate-500">1500L Gas at 150 Bar</div>
              </button>
            </div>
          </div>

          {/* Reserve Buffer Capacity */}
          <div className="p-5 rounded-2xl bg-[#080d1a] border border-slate-800 space-y-3">
            <label className="text-xs font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              Reserve Buffer Volume (Liters)
            </label>
            <p className="text-[11px] text-slate-400">
              Target volume for conceptual temporary bridge buffer during cylinder swap.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <input
                type="range"
                min="5.0"
                max="25.0"
                step="2.5"
                value={settings.reserveCapacityLiters}
                onChange={(e) => updateSettings({ reserveCapacityLiters: parseFloat(e.target.value) })}
                className="flex-1 accent-amber-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
              />
              <span className="font-mono text-xs font-bold text-amber-300 w-16 text-right">
                {settings.reserveCapacityLiters.toFixed(1)} L
              </span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              Provides {(settings.reserveCapacityLiters / settings.flowRateLpm).toFixed(1)} minutes at {settings.flowRateLpm.toFixed(1)} L/min flow
            </div>
          </div>

        </div>

        {/* 5. Audio Alert Preferences */}
        <div className="p-5 rounded-2xl bg-[#080d1a] border border-slate-800 space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-white flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-cyan-400" />
              Medical Audio Alert Preferences
            </label>
            <button
              onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
              className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                settings.soundEnabled
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  : 'bg-slate-900 text-slate-500 border-slate-800'
              }`}
            >
              {settings.soundEnabled ? 'Sound Enabled' : 'Muted'}
            </button>
          </div>

          <div className="flex items-center gap-4 pt-1">
            <span className="text-xs text-slate-400 font-mono">Volume:</span>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.05"
              value={settings.audioVolume}
              onChange={(e) => updateSettings({ audioVolume: parseFloat(e.target.value) })}
              className="flex-1 accent-cyan-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
            />
            <span className="font-mono text-xs font-bold text-slate-300 w-12 text-right">
              {Math.round(settings.audioVolume * 100)}%
            </span>
          </div>

          <p className="text-[10px] text-slate-400">
            Synthesizes IEC 60601-1-8 medical alarm tones (C6 harmonic pulses) directly via the Web Audio API without external audio files.
          </p>
        </div>

      </div>

      {/* Safety Persistence Note */}
      <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 font-mono flex items-center gap-2">
        <Info className="w-4 h-4 text-cyan-400 shrink-0" />
        <span>All configuration parameters are automatically saved in browser LocalStorage.</span>
      </div>

    </div>
  );
};
