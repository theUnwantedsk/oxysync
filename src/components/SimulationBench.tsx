import React, { useState } from 'react';
import { useTelemetry } from '../context/TelemetryContext';
import { SimulationScenario } from '../types/telemetry';
import { Terminal, Play, Sliders, Bluetooth, Check, Copy } from 'lucide-react';

export const SimulationBench: React.FC = () => {
  const { 
    activeScenario, 
    setScenario, 
    vitals, 
    supply, 
    injectCustomVitals, 
    serialPackets
  } = useTelemetry();

  const [customSpo2, setCustomSpo2] = useState<number>(vitals.spo2);
  const [customBpm, setCustomBpm] = useState<number>(vitals.pulseRate);
  const [customPsi, setCustomPsi] = useState<number>(supply.pressurePsi);
  const [copied, setCopied] = useState<boolean>(false);
  const [btStatus, setBtStatus] = useState<string>('disconnected');

  const scenarios: { id: SimulationScenario; label: string; desc: string; color: string }[] = [
    {
      id: 'normal',
      label: '1. Normal Resting',
      desc: 'SpO₂ 96%, 72 BPM, 2.0 L/min baseline, normal cylinder volume.',
      color: 'border-emerald-500/40 hover:bg-emerald-500/10'
    },
    {
      id: 'hypoxemia',
      label: '2. Acute Hypoxemia',
      desc: 'SpO₂ drops to 84%, heart rate elevates to 108 BPM. Auto titration engages.',
      color: 'border-rose-500/40 hover:bg-rose-500/10'
    },
    {
      id: 'exertion',
      label: '3. Exercise / Walk Test',
      desc: 'Post-exertion desaturation to 89% with 126 BPM tachycardia.',
      color: 'border-amber-500/40 hover:bg-amber-500/10'
    },
    {
      id: 'low_tank',
      label: '4. Low Oxygen Reserve',
      desc: 'Cylinder pressure rapidly falls under 200 PSI (< 20 mins remaining).',
      color: 'border-amber-500/40 hover:bg-amber-500/10'
    },
    {
      id: 'cannula_drop',
      label: '5. Cannula Disconnect',
      desc: 'Patient dislodges nasal prongs. Pulse signal lost, instant red alarm.',
      color: 'border-rose-600/50 hover:bg-rose-600/10'
    },
    {
      id: 'valve_limit',
      label: '6. Upper Flow Limit',
      desc: 'Patient remains low despite valve reaching doctor prescribed 5.0 L/min ceiling.',
      color: 'border-purple-500/40 hover:bg-purple-500/10'
    }
  ];

  const handleApplyCustom = () => {
    injectCustomVitals(customSpo2, customBpm, customPsi);
  };

  const handleCopyPackets = () => {
    navigator.clipboard.writeText(serialPackets.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConnectBluetooth = async () => {
    if ('bluetooth' in navigator) {
      try {
        setBtStatus('scanning');
        // Web Bluetooth request device
        const nav = navigator as unknown as { bluetooth: { requestDevice: (opt: unknown) => Promise<{ name: string }> } };
        const dev = await nav.bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: ['battery_service']
        });
        setBtStatus(`connected: ${dev.name || 'ESP32'}`);
      } catch {
        setBtStatus('scan_cancelled');
        setTimeout(() => setBtStatus('disconnected'), 3000);
      }
    } else {
      alert('Web Bluetooth is supported in Chrome/Edge browsers with BLE hardware.');
    }
  };

  return (
    <div className="bg-[#0b1424] border border-slate-800/90 rounded-2xl p-5 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Mechatronics & IoT Simulation Testbench
            </h2>
            <p className="text-xs text-slate-400">
              Inject Clinical Scenarios & Inspect ESP32 Controller Packets
            </p>
          </div>
        </div>

        {/* Hardware Connect Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleConnectBluetooth}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-cyan-300 flex items-center gap-1.5 transition-colors"
          >
            <Bluetooth className="w-3.5 h-3.5" />
            <span>
              {btStatus === 'scanning' ? 'Scanning BLE...' : btStatus.startsWith('connected') ? btStatus : 'Pair Real ESP32'}
            </span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Preset Clinical Scenarios */}
        <div>
          <h3 className="text-xs font-bold text-slate-300 tracking-wider mb-2.5 flex items-center gap-1.5">
            <Play className="w-3.5 h-3.5 text-cyan-400" />
            <span>ONE-CLICK CLINICAL TEST SCENARIOS</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {scenarios.map(s => {
              const isActive = activeScenario === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setScenario(s.id)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    isActive 
                      ? 'bg-cyan-500/15 border-cyan-400 text-white shadow-md shadow-cyan-500/10 ring-1 ring-cyan-400/50' 
                      : `bg-slate-900/60 text-slate-300 ${s.color}`
                  }`}
                >
                  <div className="font-bold text-xs flex items-center justify-between mb-1">
                    <span>{s.label}</span>
                    {isActive && <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-400 text-slate-950 font-black">ACTIVE</span>}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-tight">
                    {s.desc}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Manual Perturbation Sliders */}
          <div className="mt-4 p-3.5 rounded-xl border border-slate-800 bg-slate-900/40">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                <span>Manual Telemetry Perturbation</span>
              </span>
              <button
                onClick={handleApplyCustom}
                className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold transition-colors"
              >
                Inject Values
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">SpO₂: {customSpo2}%</label>
                <input
                  type="range"
                  min="70"
                  max="100"
                  value={customSpo2}
                  onChange={e => setCustomSpo2(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none accent-cyan-400 cursor-pointer"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Pulse: {customBpm} BPM</label>
                <input
                  type="range"
                  min="40"
                  max="160"
                  value={customBpm}
                  onChange={e => setCustomBpm(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none accent-rose-400 cursor-pointer"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Pressure: {customPsi} PSI</label>
                <input
                  type="range"
                  min="50"
                  max="2200"
                  step="50"
                  value={customPsi}
                  onChange={e => setCustomPsi(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none accent-emerald-400 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Serial Telemetry Monitor */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="text-xs font-bold text-slate-300 tracking-wider flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              <span>LIVE ESP32 MECHATRONIC TELEMETRY STREAM</span>
            </h3>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyPackets}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] flex items-center gap-1 font-mono transition-colors"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy JSON'}</span>
              </button>
            </div>
          </div>

          <div className="bg-[#050a12] border border-slate-800 rounded-xl p-3 font-mono text-[11px] h-64 overflow-y-auto space-y-1.5 text-slate-300">
            <div className="text-emerald-400 font-semibold mb-2 flex items-center gap-2 pb-1 border-b border-slate-800">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>UART: COM3 @ 115200 BAUD | Protocol: JSON-MECH-V2</span>
            </div>

            {serialPackets.length === 0 ? (
              <div className="text-slate-500 py-6 text-center">
                Awaiting telemetry frames...
              </div>
            ) : (
              serialPackets.map((pkt, idx) => (
                <div key={idx} className="hover:bg-slate-900/60 px-1 rounded transition-colors text-slate-400 flex items-start gap-2">
                  <span className="text-cyan-500 shrink-0">&gt;</span>
                  <span className="text-slate-300 break-all">{pkt}</span>
                </div>
              ))
            )}
          </div>

          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span>Payload Fields: seq, dev, spo2, bpm, flow (L/m), psi, valve (%), cannula (0/1)</span>
            <span className="font-mono text-cyan-400">1.0 Hz Rate</span>
          </div>
        </div>

      </div>
    </div>
  );
};
