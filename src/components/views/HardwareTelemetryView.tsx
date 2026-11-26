import React, { useState } from 'react';
import {
  Terminal,
  Cpu,
  Microchip,
  Copy,
  Check,
  Zap,
  Usb,
  Wifi,
  Unplug,
  Activity,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { useTelemetry } from '../../context/TelemetryContext';

export const HardwareTelemetryView: React.FC = () => {
  const {
    telemetryPackets,
    primaryCylinder,
    secondaryCylinder,
    reserveBuffer,
    activeSource,
    esp32Host,
    esp32SyncEnabled,
    esp32ConnectionState,
    esp32LastError,
    connectEsp32,
    disconnectEsp32,
    usbSupported,
    usbStatus,
    usbError,
    usbLastPacketAt,
    usbLcdStatus,
    usbRawLogs,
    connectUsbEsp32,
    disconnectUsbEsp32,
    sendUsbCommand,
    clearUsbLogs
  } = useTelemetry();

  const [copiedPkt, setCopiedPkt] = useState<number | null>(null);
  const [hostInput, setHostInput] = useState<string>(esp32Host);

  const handleCopyPacket = (pktId: number, json: string) => {
    navigator.clipboard.writeText(json);
    setCopiedPkt(pktId);
    setTimeout(() => setCopiedPkt(null), 2000);
  };

  const isUsbLive = usbStatus === 'connected';
  const isWifiLive = esp32SyncEnabled && esp32ConnectionState === 'connected';
  const topPacket = telemetryPackets[0];

  const streamBadge = isUsbLive
    ? 'LIVE USB ESP32 STREAM (4 Hz)'
    : isWifiLive
    ? 'LIVE WI-FI ESP32 STREAM (2 Hz)'
    : 'SIMULATED STREAM';

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#0c1220]/80 rounded-2xl border border-slate-800 p-5 shadow-xl backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <Terminal className="w-4 h-4 text-emerald-400" />
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-white">ESP32 Mechatronics Hardware & Real-Time Telemetry</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              UART 115200 BPS
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Bi-directional USB Serial (Web Serial API) and Wi-Fi WebSocket bridge for live ESP32 telemetry, LCD diagnostics, and control sync.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs shrink-0">
          <span
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${
              isUsbLive || isWifiLive
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-900 border-slate-800 text-slate-300'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isUsbLive || isWifiLive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            {isUsbLive ? 'USB SERIAL: LIVE (4 Hz)' : isWifiLive ? 'WIFI WS: LIVE (2 Hz)' : 'SIMULATION BUS'}
          </span>
        </div>
      </div>

      {/* Real-Time Hardware Connection Controls (USB Serial + Wi-Fi) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* USB Serial Real-Time Card */}
        <div className="p-5 rounded-2xl bg-[#080d1a] border border-emerald-500/30 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                <Usb className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">USB Serial Real-Time Connection</h2>
                <p className="text-[11px] text-slate-400">Direct cable link to ESP32 COM port @ 115200 baud</p>
              </div>
            </div>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                isUsbLive
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                  : usbStatus === 'connecting'
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                  : usbStatus === 'error'
                  ? 'bg-red-500/20 border-red-500/40 text-red-300'
                  : 'bg-slate-900 border-slate-700 text-slate-400'
              }`}
            >
              {usbStatus.toUpperCase()}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isUsbLive ? (
              <>
                <button
                  onClick={() => void disconnectUsbEsp32()}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-300 flex items-center gap-1.5 transition-all"
                >
                  <Unplug className="w-3.5 h-3.5" />
                  <span>Disconnect USB</span>
                </button>
                <button
                  onClick={() => void sendUsbCommand({ action: 'ping' })}
                  className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 flex items-center gap-1.5 transition-all"
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>Ping ESP32</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => void connectUsbEsp32()}
                disabled={!usbSupported || usbStatus === 'connecting'}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all"
              >
                <Usb className="w-3.5 h-3.5" />
                <span>{usbStatus === 'connecting' ? 'Opening USB Port...' : 'Connect ESP32 via USB'}</span>
              </button>
            )}

            {usbLastPacketAt && (
              <span className="text-[11px] font-mono text-slate-400 ml-auto">
                Last RX: <span className="text-emerald-300 font-bold">{usbLastPacketAt}</span>
              </span>
            )}
          </div>

          {!usbSupported && (
            <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-500/30 text-[11px] text-amber-200 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>Web Serial API requires Chrome or Microsoft Edge on desktop. Close Arduino/PlatformIO Serial Monitor before connecting.</span>
            </div>
          )}

          {usbError && (
            <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-500/30 text-[11px] text-red-200 font-mono">
              {usbError}
            </div>
          )}

          {usbLcdStatus && (
            <div
              className={`p-2.5 rounded-lg border text-[11px] font-mono flex items-center justify-between ${
                usbLcdStatus.ready
                  ? 'bg-cyan-950/30 border-cyan-500/30 text-cyan-200'
                  : 'bg-amber-950/30 border-amber-500/30 text-amber-200'
              }`}
            >
              <span>
                {usbLcdStatus.ready
                  ? `I2C LCD Active @ ${usbLcdStatus.address}`
                  : `I2C LCD Not Detected (Expected ${usbLcdStatus.address} on SDA 21 / SCL 22)`}
              </span>
              <span className="font-bold">{usbLcdStatus.ready ? 'LCD OK' : 'CHECK WIRING'}</span>
            </div>
          )}
        </div>

        {/* Wi-Fi WebSocket + REST Bridge Card */}
        <div className="p-5 rounded-2xl bg-[#080d1a] border border-cyan-500/30 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                <Wifi className="w-4 h-4 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">Wi-Fi WebSocket / REST Sync</h2>
                <p className="text-[11px] text-slate-400">SoftAP (`192.168.4.1`) or local router STA IP (ports 80 &amp; 81)</p>
              </div>
            </div>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                isWifiLive
                  ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                  : 'bg-slate-900 border-slate-700 text-slate-400'
              }`}
            >
              {esp32SyncEnabled ? esp32ConnectionState.toUpperCase() : 'DISABLED'}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="text"
              value={hostInput}
              onChange={(e) => setHostInput(e.target.value)}
              placeholder="192.168.4.1"
              className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
            />
            {esp32SyncEnabled ? (
              <button
                onClick={disconnectEsp32}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-300 transition-all"
              >
                Disconnect Wi-Fi
              </button>
            ) : (
              <button
                onClick={() => connectEsp32(hostInput)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all"
              >
                Connect Wi-Fi
              </button>
            )}
          </div>

          {esp32LastError && (
            <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-500/30 text-[11px] text-red-200 font-mono">
              {esp32LastError}
            </div>
          )}

          <p className="text-[11px] text-slate-400">
            Tip: If HTTPS blocks `ws://` mixed content on a hosted site, use the **USB Serial** button on the left—it works directly over USB cable.
          </p>
        </div>
      </div>

      {/* Live USB Serial Console (shown when connected or when logs exist) */}
      {(isUsbLive || usbRawLogs.length > 0) && (
        <div className="bg-[#030712] p-4 sm:p-5 rounded-2xl border border-emerald-500/30 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-300">
              <Usb className="w-4 h-4" />
              <span>USB SERIAL LIVE STREAM (RX / TX @ 115200)</span>
            </div>
            <button
              onClick={clearUsbLogs}
              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[11px] font-mono text-slate-300 flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear</span>
            </button>
          </div>
          <div className="max-h-48 overflow-y-auto space-y-1 font-mono text-[11px] bg-slate-950/80 p-3 rounded-xl border border-slate-800">
            {usbRawLogs.length === 0 ? (
              <div className="text-slate-500">Waiting for incoming JSON telemetry lines from ESP32...</div>
            ) : (
              usbRawLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-2 break-all">
                  <span className="text-slate-500 shrink-0">{log.timestamp}</span>
                  <span
                    className={`px-1 rounded text-[10px] font-bold shrink-0 ${
                      log.direction === 'tx'
                        ? 'bg-cyan-500/20 text-cyan-300'
                        : log.direction === 'sys'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-emerald-500/20 text-emerald-300'
                    }`}
                  >
                    {log.direction.toUpperCase()}
                  </span>
                  <span className="text-slate-200">{log.raw}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Embedded Hardware Specifications & Pinout Schematic */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Microcontroller Specs */}
        <div className="p-5 rounded-2xl bg-[#080d1a] border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-200">
            <span className="flex items-center gap-2 text-cyan-400">
              <Cpu className="w-4 h-4" />
              ESP32-WROOM-32 / S3 Controller
            </span>
            <span className="text-[10px] font-mono bg-cyan-950 px-1.5 py-0.5 rounded text-cyan-300">240 MHz</span>
          </div>

          <ul className="space-y-2 text-xs font-mono text-slate-300">
            <li className="flex justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-slate-400">I2C LCD SDA / SCL:</span>
              <span className="text-white">GPIO 21 / GPIO 22</span>
            </li>
            <li className="flex justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-slate-400">Alarm Buzzer / Button:</span>
              <span className="text-white">GPIO 25 / GPIO 0</span>
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
              <span className="text-amber-400">GPIO 23 (MOSFET Gate)</span>
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
              {activeSource === 'primary'
                ? 'Valve V-1 ENERGIZED (OPEN)'
                : activeSource === 'secondary'
                ? 'Valve V-2 ENERGIZED (OPEN)'
                : activeSource === 'reserve'
                ? 'Valve VR ENERGIZED (OPEN)'
                : 'ALL COILS ISOLATED'}
            </div>
          </div>

          <div className="text-[10px] text-slate-500 font-mono text-center">
            Zero-heat pulse-and-hold solenoid PWM: 12V 20ms pull-in, 3.3V hold
          </div>
        </div>
      </div>

      {/* Live Rolling Serial UART Hex / JSON Stream */}
      <div className="bg-[#030712] p-4 sm:p-6 rounded-3xl border border-slate-800 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <h2 className="text-sm font-bold text-white font-mono flex items-center gap-2">
              UART SERIAL PACKET CAPTURE [{streamBadge}]
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
