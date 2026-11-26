import React from 'react';
import { 
  Activity, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  BellOff, 
  ShieldAlert, 
  LayoutDashboard, 
  GitBranch, 
  PlayCircle, 
  TrendingUp, 
  HeartHandshake, 
  FileText, 
  MonitorPlay, 
  Lightbulb, 
  Settings as SettingsIcon,
  Clock,
  Timer,
  Terminal,
  Radio,
  Box,
  Sun,
  Moon
} from 'lucide-react';
import { useTelemetry } from '../context/TelemetryContext';

export type ActiveNavTab = 
  | 'dashboard'
  | 'digital_twin'
  | 'supply_path'
  | 'time_travel'
  | 'demonstration'
  | 'hardware'
  | 'predictive'
  | 'caregiver'
  | 'analytics'
  | 'presentation'
  | 'innovation'
  | 'settings';

interface HeaderProps {
  currentTab: ActiveNavTab;
  onSelectTab: (tab: ActiveNavTab) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, onSelectTab }) => {
  const { 
    activeSource, 
    primaryCylinder, 
    secondaryCylinder, 
    reserveBuffer, 
    predictions, 
    isMuted, 
    snoozeRemaining, 
    toggleMute, 
    snoozeAlarms, 
    resetSimulation,
    alerts,
    masterClockMs,
    therapyElapsedFormatted,
    settings,
    setSimulationSpeed,
    esp32SyncEnabled,
    esp32ConnectionState,
    usbStatus,
    theme,
    toggleTheme
  } = useTelemetry();

  const activeAlertsCount = alerts.filter(a => !a.acknowledged).length;

  const navItems: { id: ActiveNavTab; label: string; icon: React.ElementType; badge?: string }[] = [
    { id: 'dashboard', label: 'Clinical Monitor', icon: LayoutDashboard },
    { id: 'digital_twin', label: '3D Digital Twin', icon: Box, badge: '3D Model' },
    { id: 'supply_path', label: 'Supply Manifold', icon: GitBranch },
    { id: 'time_travel', label: 'Time-Machine & Scrubber', icon: Timer, badge: 'High-Precision' },
    { id: 'demonstration', label: 'Live Demonstration', icon: PlayCircle, badge: '8 Scenarios' },
    { id: 'hardware', label: 'ESP32 Hardware Telemetry', icon: Terminal, badge: 'UART Bus' },
    { id: 'predictive', label: 'Predictive Analytics', icon: TrendingUp },
    { id: 'caregiver', label: 'Caregiver View', icon: HeartHandshake },
    { id: 'analytics', label: 'Reports & Audit', icon: FileText },
    { id: 'presentation', label: 'Presentation Mode', icon: MonitorPlay, badge: 'Exhibition' },
    { id: 'innovation', label: 'About & Innovation', icon: Lightbulb },
    { id: 'settings', label: 'Settings', icon: SettingsIcon }
  ];

  const getSourceBadge = () => {
    switch (activeSource) {
      case 'primary':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-mono">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            PRIMARY ACTIVE ({primaryCylinder.percentRemaining}%)
          </span>
        );
      case 'secondary':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-teal-950/80 border border-teal-500/40 text-teal-300 font-mono">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            BACKUP ACTIVE ({secondaryCylinder.percentRemaining}%)
          </span>
        );
      case 'reserve':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-red-950/90 border border-red-500 text-red-200 animate-pulse font-mono">
            <ShieldAlert className="w-3.5 h-3.5 text-red-400 animate-bounce" />
            RESERVE BUFFER ({reserveBuffer.remainingSeconds}s)
          </span>
        );
      case 'none':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-red-900 border border-red-400 text-white animate-pulse font-mono">
            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
            ALL SUPPLIES DEPLETED
          </span>
        );
    }
  };

  const getEsp32Pill = () => {
    if (usbStatus === 'connected' || usbStatus === 'connecting') {
      const isLive = usbStatus === 'connected';
      return (
        <button
          onClick={() => onSelectTab('hardware')}
          title="Live ESP32 USB Serial Real-Time Sync"
          className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-mono font-bold border transition-colors ${
            isLive
              ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
              : 'bg-amber-950/70 border-amber-500/40 text-amber-300'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400 animate-ping'}`} />
          <span>{isLive ? 'USB LIVE' : 'USB...'}</span>
        </button>
      );
    }
    if (!esp32SyncEnabled) {
      return (
        <button
          onClick={() => onSelectTab('hardware')}
          title="Connect ESP32 via USB Serial or Wi-Fi"
          className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-mono bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 transition-colors"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          <span>SIM MODE</span>
        </button>
      );
    }
    const styles =
      esp32ConnectionState === 'connected'
        ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300'
        : esp32ConnectionState === 'connecting'
        ? 'bg-amber-950/70 border-amber-500/40 text-amber-300'
        : 'bg-red-950/70 border-red-500/40 text-red-300';
    const dot =
      esp32ConnectionState === 'connected'
        ? 'bg-emerald-400 animate-pulse'
        : esp32ConnectionState === 'connecting'
        ? 'bg-amber-400 animate-ping'
        : 'bg-red-400';
    const label =
      esp32ConnectionState === 'connected'
        ? 'ESP32 SYNCED'
        : esp32ConnectionState === 'connecting'
        ? 'ESP32 SYNC...'
        : 'ESP32 OFFLINE';
    return (
      <button
        onClick={() => onSelectTab('hardware')}
        title="Manage ESP32 Live Hardware Bridge"
        className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-mono font-bold border transition-colors ${styles}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
        <span>{label}</span>
      </button>
    );
  };

  return (
    <header className="bg-[#050812]/95 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-40 transition-all">
      {/* Top Banner with High-Precision Chronometers */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-col lg:flex-row items-center justify-between gap-3 border-b border-slate-800/40">
        
        {/* Brand & Tagline */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-teal-400 flex items-center justify-center shadow-lg shadow-cyan-500/20 shrink-0">
            <Activity className="w-5 h-5 text-slate-950 font-black" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-wider text-white">OXYSYNC</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">2.0</span>
              {usbStatus === 'connected' ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono tracking-wide bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  ESP32 USB LIVE
                </span>
              ) : esp32SyncEnabled && esp32ConnectionState === 'connected' ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono tracking-wide bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                  ESP32 WIFI LIVE
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono tracking-wide bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  SIMULATED DATA
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Intelligent Oxygen. Continuous Care.</p>
          </div>
        </div>

        {/* Live Synchronized High-Precision Telemetry Clocks */}
        <div className="flex items-center flex-wrap justify-center lg:justify-end gap-2 text-xs">
          
          {/* ESP32 Tri-Device Sync Pill */}
          {getEsp32Pill()}

          {/* Master 20 Hz Clock */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-950 border border-slate-800 text-slate-300 font-mono">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[10px] text-slate-500">RTC:</span>
            <span className="text-white font-bold">{masterClockMs || '18:45:00.00'}</span>
          </div>

          {/* Therapy Elapsed */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-950 border border-slate-800 text-slate-300 font-mono">
            <Radio className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
            <span className="text-[10px] text-slate-500">THERAPY:</span>
            <span className="text-cyan-300 font-bold">{therapyElapsedFormatted}</span>
          </div>

          {/* Active Supply Badge */}
          {getSourceBadge()}

          {/* Depletion Countdown */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-950 border border-slate-800 text-slate-300 font-mono">
            <span className="text-slate-500 text-[10px]">REMAINING:</span>
            <span className="text-amber-300 font-bold">{predictions.formattedCountdown}</span>
          </div>

          {/* Time-Warp Multiplier Pill */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-md p-0.5 font-mono text-[10px]">
            <span className="px-1.5 text-slate-500">WARP:</span>
            {[1, 5, 20].map((s) => (
              <button
                key={s}
                onClick={() => setSimulationSpeed(s)}
                className={`px-1.5 py-0.5 rounded transition-all ${
                  settings.simulationSpeed === s
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Active Alerts Pill */}
          {activeAlertsCount > 0 && (
            <span className="px-2 py-1 rounded-md text-xs font-semibold bg-red-500/20 border border-red-500/40 text-red-300 flex items-center gap-1 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
              {activeAlertsCount} ALERT{activeAlertsCount > 1 ? 'S' : ''}
            </span>
          )}

          {/* Theme Mode Toggle (Light / Dark) */}
          <button
            onClick={toggleTheme}
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            className="p-1.5 rounded-md border text-xs bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300 transition-colors"
          >
            {theme === 'light' ? (
              <Moon className="w-4 h-4 text-slate-600" />
            ) : (
              <Sun className="w-4 h-4 text-amber-400" />
            )}
          </button>

          {/* Audio Mute/Unmute */}
          <button
            onClick={toggleMute}
            title={isMuted ? 'Unmute Audio Alarms' : 'Mute Audio Alarms'}
            className={`p-1.5 rounded-md border text-xs transition-colors ${
              isMuted 
                ? 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200' 
                : 'bg-cyan-950/40 border-cyan-800 text-cyan-300 hover:bg-cyan-900/50'
            }`}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>

          {snoozeRemaining > 0 ? (
            <span className="px-2 py-1 rounded-md text-xs bg-amber-950/60 border border-amber-600/50 text-amber-300 font-mono">
              SNOOZED ({snoozeRemaining}s)
            </span>
          ) : (
            <button
              onClick={snoozeAlarms}
              title="Snooze Alarms for 120s"
              className="px-2 py-1 rounded-md text-xs font-medium bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 flex items-center gap-1"
            >
              <BellOff className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Snooze</span>
            </button>
          )}

          {/* Reset Demo Button */}
          <button
            onClick={resetSimulation}
            title="Reset Simulation State to Nominal Defaults"
            className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 border border-slate-700/80 flex items-center gap-1 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Reset Demo</span>
          </button>
        </div>
      </div>

      {/* Main Tab Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 overflow-x-auto scrollbar-none py-1.5 flex items-center gap-1">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-150 ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-500/20 to-teal-500/20 border border-cyan-500/40 text-cyan-300 font-bold shadow-sm shadow-cyan-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
              <span>{item.label}</span>
              {item.badge && (
                <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                  isActive 
                    ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/40' 
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </header>
  );
};
