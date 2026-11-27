import React, { useState } from 'react';
import {
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

  const streamLabel = isUsbLive
    ? 'Live USB ESP32 (4 Hz)'
    : isWifiLive
    ? 'Live Wi-Fi ESP32 (2 Hz)'
    : 'Simulated Bus';

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="clinical-card p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-[var(--text-primary)] tracking-tight">
            ESP32 Hardware Bridge &amp; Serial Telemetry
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Bi-directional Web Serial (115200 baud) and Wi-Fi WebSocket bridge for live hardware synchronization
          </p>
        </div>

        <span
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono border self-start md:self-auto ${
            isUsbLive || isWifiLive
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-300'
              : 'clinical-well text-[var(--text-secondary)]'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isUsbLive || isWifiLive ? 'bg-emerald-500' : 'bg-amber-500'
            }`}
          />
          <span>{streamLabel}</span>
        </span>
      </div>

      {/* Connection Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* USB Serial */}
        <div className="clinical-card p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <Usb className="w-4 h-4 text-[var(--accent-primary)]" />
              <div>
                <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                  USB Serial Connection
                </h2>
                <p className="text-xs text-[var(--text-muted)]">Direct COM port link at 115200 baud</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-[var(--surface-well)] border border-[var(--border-subtle)] text-[var(--text-secondary)] uppercase">
              {usbStatus}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isUsbLive ? (
              <>
                <button
                  onClick={() => void disconnectUsbEsp32()}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800 inline-flex items-center gap-1.5"
                >
                  <Unplug className="w-3.5 h-3.5" />
                  <span>Disconnect USB</span>
                </button>
                <button
                  onClick={() => void sendUsbCommand({ action: 'ping' })}
                  className="clinical-btn-secondary px-3 py-1.5 text-xs inline-flex items-center gap-1.5"
                >
                  <Activity className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                  <span>Ping ESP32</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => void connectUsbEsp32()}
                disabled={!usbSupported || usbStatus === 'connecting'}
                className="clinical-btn-primary px-4 py-2 text-xs inline-flex items-center gap-1.5 disabled:opacity-45 disabled:cursor-not-allowed"
              >
                <Usb className="w-3.5 h-3.5" />
                <span>{usbStatus === 'connecting' ? 'Opening Port...' : 'Connect ESP32 via USB'}</span>
              </button>
            )}

            {usbLastPacketAt && (
              <span className="text-[11px] font-mono text-[var(--text-muted)] ml-auto tabular-nums">
                Last RX {usbLastPacketAt}
              </span>
            )}
          </div>

          {!usbSupported && (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-200 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Web Serial requires Chrome or Edge on desktop. Close Arduino or PlatformIO Serial Monitor first.
              </span>
            </div>
          )}

          {usbError && (
            <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 dark:bg-red-950/40 dark:border-red-800 dark:text-red-200 text-xs font-mono">
              {usbError}
            </div>
          )}

          {usbLcdStatus && (
            <div className="clinical-well p-2.5 text-xs font-mono flex items-center justify-between">
              <span className="text-[var(--text-secondary)]">
                {usbLcdStatus.ready
                  ? `I2C LCD Active @ ${usbLcdStatus.address}`
                  : `LCD not detected (expected ${usbLcdStatus.address} on SDA 21 / SCL 22)`}
              </span>
              <span className="font-semibold text-[var(--accent-primary)]">
                {usbLcdStatus.ready ? 'OK' : 'Check Wiring'}
              </span>
            </div>
          )}
        </div>

        {/* Wi-Fi Sync */}
        <div className="clinical-card p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <Wifi className="w-4 h-4 text-[var(--accent-primary)]" />
              <div>
                <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                  Wi-Fi WebSocket / REST Sync
                </h2>
                <p className="text-xs text-[var(--text-muted)]">
                  SoftAP (192.168.4.1) or local router IP (ports 80 &amp; 81)
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-[var(--surface-well)] border border-[var(--border-subtle)] text-[var(--text-secondary)] uppercase">
              {esp32SyncEnabled ? esp32ConnectionState : 'Disabled'}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="text"
              value={hostInput}
              onChange={(e) => setHostInput(e.target.value)}
              placeholder="192.168.4.1"
              className="clinical-input flex-1 px-3 py-2 text-xs font-mono"
            />
            {esp32SyncEnabled ? (
              <button
                onClick={disconnectEsp32}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800"
              >
                Disconnect Wi-Fi
              </button>
            ) : (
              <button
                onClick={() => connectEsp32(hostInput)}
                className="clinical-btn-primary px-4 py-2 text-xs"
              >
                Connect Wi-Fi
              </button>
            )}
          </div>

          {esp32LastError && (
            <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 dark:bg-red-950/40 dark:border-red-800 dark:text-red-200 text-xs font-mono">
              {esp32LastError}
            </div>
          )}

          <p className="text-xs text-[var(--text-muted)]">
            HTTPS hosting blocks plaintext <code className="font-mono">ws://</code> connections; use USB Serial over cable when hosted over HTTPS.
          </p>
        </div>
      </div>

      {/* Live USB Raw Log Console */}
      {(isUsbLive || usbRawLogs.length > 0) && (
        <div data-dark-surface="true" className="bg-[#050a14] p-4 sm:p-5 rounded-xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold text-emerald-400">
              USB Serial Live Console (115200 baud)
            </span>
            <button
              onClick={clearUsbLogs}
              className="px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono text-slate-300 inline-flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear</span>
            </button>
          </div>
          <div className="max-h-48 overflow-y-auto space-y-1 font-mono text-[11px] bg-slate-950/90 p-3 rounded-lg border border-slate-800">
            {usbRawLogs.length === 0 ? (
              <div className="text-slate-500">Waiting for incoming JSON lines from ESP32...</div>
            ) : (
              usbRawLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-2 break-all">
                  <span className="text-slate-500 shrink-0 tabular-nums">{log.timestamp}</span>
                  <span
                    className={`px-1 rounded text-[10px] font-semibold shrink-0 ${
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

      {/* Hardware Pinout & ADC Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="clinical-card p-5 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-[var(--text-primary)]">
            <span className="inline-flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[var(--accent-primary)]" />
              ESP32 Pinout Map
            </span>
            <span className="font-mono text-[11px] text-[var(--text-muted)]">240 MHz</span>
          </div>

          <ul className="space-y-1.5 text-xs font-mono">
            {[
              ['I2C LCD SDA / SCL', 'GPIO 21 / GPIO 22'],
              ['Alarm Buzzer / BOOT', 'GPIO 25 / GPIO 0'],
              ['Solenoid V1 (Primary)', 'GPIO 18'],
              ['Solenoid V2 (Backup)', 'GPIO 19'],
              ['Reserve Solenoid VR', 'GPIO 23']
            ].map(([label, pin]) => (
              <li
                key={label}
                className="clinical-well flex justify-between px-3 py-2 text-[var(--text-secondary)]"
              >
                <span>{label}</span>
                <span className="font-semibold text-[var(--text-primary)]">{pin}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="clinical-card p-5 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-[var(--text-primary)]">
            <span className="inline-flex items-center gap-2">
              <Microchip className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              Pressure Transducers
            </span>
            <span className="font-mono text-[11px] text-[var(--text-muted)]">0–200 Bar</span>
          </div>

          <div className="space-y-2 text-xs font-mono tabular-nums">
            <div className="clinical-well p-3">
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Transducer A (Primary)</span>
                <span className="font-bold text-[var(--text-primary)]">{primaryCylinder.currentPressureBar} Bar</span>
              </div>
              <div className="text-[11px] text-[var(--text-muted)] mt-1">
                12-bit ADC: {Math.round((primaryCylinder.currentPressureBar / 200) * 4095)} / 4095
              </div>
            </div>

            <div className="clinical-well p-3">
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Transducer B (Backup)</span>
                <span className="font-bold text-[var(--text-primary)]">{secondaryCylinder.currentPressureBar} Bar</span>
              </div>
              <div className="text-[11px] text-[var(--text-muted)] mt-1">
                12-bit ADC: {Math.round((secondaryCylinder.currentPressureBar / 200) * 4095)} / 4095
              </div>
            </div>

            <div className="clinical-well p-3">
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Reserve Accumulator</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">{reserveBuffer.rechargePressureBar} Bar</span>
              </div>
              <div className="text-[11px] text-[var(--text-muted)] mt-1">
                Charge: {reserveBuffer.percentRemaining}%
              </div>
            </div>
          </div>
        </div>

        <div className="clinical-card p-5 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-[var(--text-primary)]">
            <span className="inline-flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              Solenoid Register
            </span>
            <span className="font-mono text-[11px] text-[var(--text-muted)]">PORTB_OUT</span>
          </div>

          <div className="clinical-well p-4 font-mono text-center space-y-1.5">
            <div className="text-[11px] text-[var(--text-muted)]">Coil Register Byte</div>
            <div className="text-3xl font-bold text-[var(--accent-primary)] tabular-nums">
              {topPacket?.solenoidStateByte || '0x01'}
            </div>
            <div className="text-xs font-semibold text-[var(--text-primary)]">
              {activeSource === 'primary'
                ? 'Valve V-1 Open'
                : activeSource === 'secondary'
                ? 'Valve V-2 Open'
                : activeSource === 'reserve'
                ? 'Valve VR Open'
                : 'All Coils Closed'}
            </div>
          </div>

          <div className="text-[11px] text-[var(--text-muted)] text-center">
            Pulse-and-hold PWM: 12V pull-in (20 ms), 3.3V hold
          </div>
        </div>
      </div>

      {/* UART Frame Capture */}
      <div data-dark-surface="true" className="bg-[#050a14] p-4 sm:p-5 rounded-xl border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800 text-xs font-mono">
          <span className="font-semibold text-white">
            UART Packet Stream ({streamLabel})
          </span>
          <div className="flex items-center gap-3 text-slate-400">
            <span>115200 8-N-1</span>
            <span className="text-emerald-400">CRC-16/CCITT</span>
          </div>
        </div>

        <div className="overflow-x-auto max-h-72 overflow-y-auto">
          <table className="w-full text-xs text-left font-mono tabular-nums">
            <thead className="text-[11px] text-slate-400 border-b border-slate-800 bg-slate-950/70 sticky top-0">
              <tr>
                <th className="py-2 px-3">PKT</th>
                <th className="py-2 px-3">Time</th>
                <th className="py-2 px-3">Hex Frame</th>
                <th className="py-2 px-3">P1</th>
                <th className="py-2 px-3">P2</th>
                <th className="py-2 px-3">Flow</th>
                <th className="py-2 px-3">SpO₂</th>
                <th className="py-2 px-3">CRC16</th>
                <th className="py-2 px-3 text-right">JSON</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-[11px]">
              {telemetryPackets.map((pkt) => {
                const isCopied = copiedPkt === pkt.packetId;
                const jsonPayload = JSON.stringify(pkt);
                return (
                  <tr key={pkt.packetId} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-2 px-3 text-cyan-400 font-semibold">#{pkt.packetId}</td>
                    <td className="py-2 px-3 text-slate-400">{pkt.timestamp}</td>
                    <td className="py-2 px-3 text-emerald-400">{pkt.rawHex}</td>
                    <td className="py-2 px-3 text-white">{pkt.primaryBar}</td>
                    <td className="py-2 px-3 text-teal-400">{pkt.secondaryBar}</td>
                    <td className="py-2 px-3 text-slate-200">{pkt.flowRateSccm}</td>
                    <td className="py-2 px-3 text-rose-400">{pkt.spo2Percent}%</td>
                    <td className="py-2 px-3 text-amber-400">{pkt.crc16}</td>
                    <td className="py-2 px-3 text-right">
                      <button
                        onClick={() => handleCopyPacket(pkt.packetId, jsonPayload)}
                        className="p-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300"
                        title="Copy JSON frame"
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
