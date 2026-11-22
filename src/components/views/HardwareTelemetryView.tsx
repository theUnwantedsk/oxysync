import React, { useState } from 'react';
import { 
  Terminal, 
  Cpu, 
  Microchip, 
  Copy, 
  Check, 
  Zap
} from 'lucide-react';
import { useTelemetry } from '../../context/TelemetryContext';

export const HardwareTelemetryView: React.FC = () => {
  const {
    telemetryPackets,
    primaryCylinder,
    secondaryCylinder,
    reserveBuffer,
    activeSource
  } = useTelemetry();

  const [copiedPkt, setCopiedPkt] = useState<number | null>(null);

  const handleCopyPacket = (pktId: number, json: string) => {
    navigator.clipboard.writeText(json);
    setCopiedPkt(pktId);
    setTimeout(() => setCopiedPkt(null), 2000);
  };

  const topPacket = telemetryPackets[0];

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-[#0c1220]/80 rounded-2xl border border-slate-800 p-5 shadow-xl backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <Terminal className="w-4 h-4 text-emerald-400" />
            </div>
            <h1 className="text-xl font-bold text-white">ESP32 Mechatronics Hardware & UART Telemetry</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              SERIAL UART 115200 BPS
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Simulated firmware telemetry bus streaming real-time pressure ADC counts, solenoid states, and CRC16 validated frames.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            UART BUS: SYNCED (50 Hz)
          </span>
        </div>
      </div>

      {/* Embedded Hardware Specifications & Pinout Schematic */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Microcontroller Specs */}
        <div className="p-5 rounded-2xl bg-[#080d1a] border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-200">
            <span className="flex items-center gap-2 text-cyan-400">
              <Cpu className="w-4 h-4" />
              ESP32-S3 Dual-Core Controller
            </span>
            <span className="text-[10px] font-mono bg-cyan-950 px-1.5 py-0.5 rounded text-cyan-300">240 MHz</span>
          </div>

          <ul className="space-y-2 text-xs font-mono text-slate-300">
            <li className="flex justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-slate-400">Pressure Sensor A:</span>
              <span className="text-white">GPIO 34 (ADC1_CH6)</span>
            </li>
            <li className="flex justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-slate-400">Pressure Sensor B:</span>
              <span className="text-white">GPIO 35 (ADC1_CH7)</span>
            </li>
            <li className="flex justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-slate-400">Solenoid V1 (Primary):</span>
              <span className="text-cyan-400">GPIO 18 (MOSFET Gate)</span>
            </li>
            <li className="flex justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-slate-400">Solenoid V2 (Backup):</span>
              <span className="text-teal-400">GPIO 19 (MOSFET Gate)</span>
            </li>
            <li className="flex justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-slate-400">Reserve Solenoid VR:</span>
              <span className="text-amber-400">GPIO 21 (MOSFET Gate)</span>
            </li>
          </ul>
        </div>

        {/* Live ADC Transducer Calibration */}
        <div className="p-5 rounded-2xl bg-[#080d1a] border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-200">
            <span className="flex items-center gap-2 text-teal-400">
              <Microchip className="w-4 h-4" />
              Honeywell Piezoresistive Transducers
            </span>
            <span className="text-[10px] font-mono bg-teal-950 px-1.5 py-0.5 rounded text-teal-300">0-200 Bar</span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>Transducer A (Primary)</span>
                <span className="text-white font-bold">{primaryCylinder.currentPressureBar} Bar</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                ADC Value: {Math.round((primaryCylinder.currentPressureBar / 200) * 4095)} / 4095 (12-bit)
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>Transducer B (Backup)</span>
                <span className="text-white font-bold">{secondaryCylinder.currentPressureBar} Bar</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                ADC Value: {Math.round((secondaryCylinder.currentPressureBar / 200) * 4095)} / 4095 (12-bit)
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>Reserve Accumulator</span>
                <span className="text-amber-400 font-bold">{reserveBuffer.rechargePressureBar} Bar</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                Accumulator Charge: {reserveBuffer.percentRemaining}%
              </div>
            </div>
          </div>
        </div>

        {/* Current Active Solenoid Register */}
        <div className="p-5 rounded-2xl bg-[#080d1a] border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-200">
            <span className="flex items-center gap-2 text-amber-400">
              <Zap className="w-4 h-4" />
              Solenoid Actuator Register
            </span>
            <span className="text-[10px] font-mono bg-amber-950 px-1.5 py-0.5 rounded text-amber-300">PORTB_OUT</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 font-mono text-center space-y-2 border border-slate-800">
            <div className="text-[10px] text-slate-500 uppercase">ACTIVE COIL REGISTER BYTE</div>
            <div className="text-3xl font-black text-cyan-400">
              {topPacket?.solenoidStateByte || '0x01'}
            </div>
            <div className="text-xs text-slate-300 font-bold">
              {activeSource === 'primary' ? 'Valve V-1 ENERGIZED (OPEN)' : (activeSource === 'secondary' ? 'Valve V-2 ENERGIZED (OPEN)' : (activeSource === 'reserve' ? 'Valve VR ENERGIZED (OPEN)' : 'ALL COILS ISOLATED'))}
            </div>
          </div>

          <div className="text-[10px] text-slate-500 font-mono text-center">
            Zero-heat pulse-and-hold solenoid PWM: 12V 20ms pull-in, 3.3V hold
          </div>
        </div>

      </div>

      {/* Live Rolling Serial UART Hex / JSON Stream */}
      <div className="bg-[#030712] p-6 rounded-3xl border border-slate-800 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <h2 className="text-sm font-bold text-white font-mono flex items-center gap-2">
              UART SERIAL PACKET CAPTURE [SIMULATED STREAM]
            </h2>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
            <span>Baud: 115200</span>
            <span>8-N-1</span>
            <span className="text-emerald-400">CRC-16/CCITT</span>
          </div>
        </div>

        {/* Packet Table */}
        <div className="overflow-x-auto max-h-80 overflow-y-auto">
          <table className="w-full text-xs text-left font-mono">
            <thead className="text-[10px] uppercase text-slate-500 border-b border-slate-800 bg-slate-950/60 sticky top-0">
              <tr>
                <th className="py-2 px-3">PKT#</th>
                <th className="py-2 px-3">Timestamp</th>
                <th className="py-2 px-3">Raw Hex Payload</th>
                <th className="py-2 px-3">P1 (Bar)</th>
                <th className="py-2 px-3">P2 (Bar)</th>
                <th className="py-2 px-3">Flow (SCCM)</th>
                <th className="py-2 px-3">SpO₂</th>
                <th className="py-2 px-3">CRC16</th>
                <th className="py-2 px-3 text-right">JSON Frame</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-[11px]">
              {telemetryPackets.map((pkt) => {
                const isCopied = copiedPkt === pkt.packetId;
                const jsonPayload = JSON.stringify(pkt);
                return (
                  <tr key={pkt.packetId} className="hover:bg-slate-900/60 transition-colors">
                    <td className="py-2 px-3 text-cyan-400 font-bold">#{pkt.packetId}</td>
                    <td className="py-2 px-3 text-slate-400">{pkt.timestamp}</td>
                    <td className="py-2 px-3 text-emerald-400 font-mono text-[10px]">{pkt.rawHex}</td>
                    <td className="py-2 px-3 text-white font-bold">{pkt.primaryBar}</td>
                    <td className="py-2 px-3 text-teal-400 font-bold">{pkt.secondaryBar}</td>
                    <td className="py-2 px-3 text-white">{pkt.flowRateSccm}</td>
                    <td className="py-2 px-3 text-rose-400">{pkt.spo2Percent}%</td>
                    <td className="py-2 px-3 text-amber-400">{pkt.crc16}</td>
                    <td className="py-2 px-3 text-right">
                      <button
                        onClick={() => handleCopyPacket(pkt.packetId, jsonPayload)}
                        className="p-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white"
                        title="Copy JSON packet"
                      >
                        {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
