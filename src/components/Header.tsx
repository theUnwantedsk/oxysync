import React from 'react';
import {
  Activity,
  RotateCcw,
  Volume2,
  VolumeX,
  BellOff,
  LayoutDashboard,
  GitBranch,
  PlayCircle,
  TrendingUp,
  HeartHandshake,
  FileText,
  MonitorPlay,
  BookOpen,
  Settings as SettingsIcon,
  Timer,
  Terminal,
  Box,
  Sun,
  Moon,
  Clock
} from 'lucide-react';
import { useTelemetry } from '../context/TelemetryContext';
import { PrecisionClock } from './PrecisionClock';

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

export interface NavItemConfig {
  id: ActiveNavTab;
  label: string;
  shortLabel: string;
  group: 'Monitoring' | 'Diagnostics' | 'Care & Records';
  icon: React.ElementType;
}

export const NAV_ITEMS: NavItemConfig[] = [
  { id: 'dashboard', label: 'Bedside Monitor', shortLabel: 'Monitor', group: 'Monitoring', icon: LayoutDashboard },
  { id: 'digital_twin', label: '3D Hardware Twin', shortLabel: '3D Twin', group: 'Monitoring', icon: Box },
  { id: 'supply_path', label: 'Supply Manifold', shortLabel: 'Manifold', group: 'Monitoring', icon: GitBranch },
  { id: 'time_travel', label: 'Depletion Scrubber', shortLabel: 'Scrubber', group: 'Diagnostics', icon: Timer },
  { id: 'demonstration', label: 'Scenario Lab', shortLabel: 'Scenarios', group: 'Diagnostics', icon: PlayCircle },
  { id: 'hardware', label: 'Hardware Bridge', shortLabel: 'ESP32', group: 'Diagnostics', icon: Terminal },
  { id: 'predictive', label: 'Depletion Forecast', shortLabel: 'Forecast', group: 'Diagnostics', icon: TrendingUp },
  { id: 'caregiver', label: 'Attendant View', shortLabel: 'Caregiver', group: 'Care & Records', icon: HeartHandshake },
  { id: 'analytics', label: 'Reports & Audit', shortLabel: 'Reports', group: 'Care & Records', icon: FileText },
  { id: 'presentation', label: 'System Overview', shortLabel: 'Architecture', group: 'Care & Records', icon: MonitorPlay },
  { id: 'innovation', label: 'Engineering Notes', shortLabel: 'Notes', group: 'Care & Records', icon: BookOpen },
  { id: 'settings', label: 'System Settings', shortLabel: 'Settings', group: 'Care & Records', icon: SettingsIcon }
];

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
    settings,
    setSimulationSpeed,
    esp32SyncEnabled,
    esp32ConnectionState,
    usbStatus,
    theme,
    toggleTheme
  } = useTelemetry();

  const activeAlertsCount = alerts.filter((a) => !a.acknowledged).length;

  const getHardwareLinkStatus = () => {
    if (usbStatus === 'connected') {
      return { dot: 'bg-emerald-500', label: 'USB Live' };
    }
    if (usbStatus === 'connecting') {
      return { dot: 'bg-amber-500', label: 'USB Connecting' };
    }
    if (esp32SyncEnabled && esp32ConnectionState === 'connected') {
      return { dot: 'bg-emerald-500', label: 'Wi-Fi Synced' };
    }
    if (esp32SyncEnabled && esp32ConnectionState === 'connecting') {
      return { dot: 'bg-amber-500', label: 'Wi-Fi Syncing' };
    }
    return { dot: 'bg-slate-400', label: 'Simulation' };
  };

  const getSupplyStatus = () => {
    switch (activeSource) {
      case 'primary':
        return {
          dot: 'bg-cyan-600 dark:bg-cyan-400',
          tone: 'text-[var(--text-primary)]',
          label: `Primary ${primaryCylinder.percentRemaining}%`
        };
      case 'secondary':
        return {
          dot: 'bg-teal-600 dark:bg-teal-400',
          tone: 'text-[var(--text-primary)]',
          label: `Backup ${secondaryCylinder.percentRemaining}%`
        };
      case 'reserve':
        return {
          dot: 'bg-red-600',
          tone: 'text-red-700 dark:text-red-300',
          label: `Reserve ${reserveBuffer.remainingSeconds}s`
        };
      case 'none':
        return {
          dot: 'bg-red-600',
          tone: 'text-red-700 dark:text-red-300',
          label: 'Supply Depleted'
        };
    }
  };

  const hwStatus = getHardwareLinkStatus();
  const supplyStatus = getSupplyStatus();

  return (
    <header className="sticky top-0 z-40 bg-[var(--surface-header)] backdrop-blur-sm border-b border-[var(--border-subtle)] transition-colors duration-200">
      <div className="max-w-[1440px] mx-auto px-3 sm:px-5 h-14 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Calm Clinical Identity & Link Status */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => onSelectTab('dashboard')}
            className="flex items-center gap-2.5 text-left group shrink-0"
          >
            <div className="w-8 h-8 rounded-lg bg-[var(--accent-primary)] flex items-center justify-center shrink-0 transition-transform duration-150 group-active:scale-95">
              <Activity className="w-4 h-4 text-white dark:text-slate-950" strokeWidth={2.4} />
            </div>
            <div className="leading-none">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold tracking-tight text-[var(--text-primary)]">
                  OXYSYNC
                </span>
                <span className="text-[11px] font-mono text-[var(--text-muted)]">2.0</span>
              </div>
              <span className="hidden lg:block text-[11px] text-[var(--text-muted)] mt-0.5">
                Oxygen Supply Monitor
              </span>
            </div>
          </button>

          <div className="h-5 w-px bg-[var(--border-subtle)] hidden lg:block" />

          <button
            onClick={() => onSelectTab('hardware')}
            title="Configure ESP32 USB Serial or Wi-Fi Telemetry Bridge"
            className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors duration-150"
          >
            <span className={`w-2 h-2 rounded-full ${hwStatus.dot}`} />
            <span>{hwStatus.label}</span>
          </button>
        </div>

        {/* Right: Calm Inline Telemetry Readouts & Workstation Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Active Feed & Remaining ETA */}
          <div className="hidden lg:flex items-center gap-3 px-3 py-1 rounded-lg bg-[var(--surface-well)] border border-[var(--border-subtle)] text-xs">
            <span className={`inline-flex items-center gap-1.5 font-semibold tabular-nums ${supplyStatus.tone}`}>
              <span className={`w-2 h-2 rounded-full ${supplyStatus.dot}`} />
              {supplyStatus.label}
            </span>
            <span className="w-px h-3.5 bg-[var(--border-strong)]" />
            <span className="text-[var(--text-muted)] font-mono text-[11px] tabular-nums">
              ETA {predictions.formattedCountdown}
            </span>
          </div>

          {/* Isolated Centisecond Clock (zero context re-render) */}
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--surface-well)] border border-[var(--border-subtle)] text-xs font-mono text-[var(--text-secondary)]">
            <Clock className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            <PrecisionClock showCentiseconds={false} />
          </div>

          {/* Speed Segmented Selector */}
          <div
            className="hidden sm:flex items-center p-0.5 rounded-lg bg-[var(--surface-well)] border border-[var(--border-subtle)] text-[11px] font-mono"
            role="group"
            aria-label="Simulation speed"
          >
            {[1, 5, 20].map((s) => {
              const active = settings.simulationSpeed === s;
              return (
                <button
                  key={s}
                  onClick={() => setSimulationSpeed(s)}
                  className={`px-2 py-0.5 rounded-md tabular-nums transition-colors duration-150 ${
                    active
                      ? 'bg-[var(--surface-card)] text-[var(--text-primary)] font-semibold shadow-sm border border-[var(--border-subtle)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-transparent'
                  }`}
                >
                  {s}×
                </button>
              );
            })}
          </div>

          {activeAlertsCount > 0 && (
            <span className="px-2 py-1 rounded-md text-[11px] font-mono font-semibold bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800/60 tabular-nums">
              {activeAlertsCount} Alert{activeAlertsCount > 1 ? 's' : ''}
            </span>
          )}

          {/* Theme Switch */}
          <button
            onClick={toggleTheme}
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            aria-label={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            className="clinical-btn-secondary p-1.5"
          >
            {theme === 'light' ? (
              <Moon className="w-4 h-4" />
            ) : (
              <Sun className="w-4 h-4 text-amber-400" />
            )}
          </button>

          {/* Audio Mute */}
          <button
            onClick={toggleMute}
            title={isMuted ? 'Unmute Audio Alarms' : 'Mute Audio Alarms'}
            aria-label={isMuted ? 'Unmute Audio Alarms' : 'Mute Audio Alarms'}
            className={`clinical-btn-secondary p-1.5 ${
              !isMuted ? 'text-[var(--accent-primary)]' : ''
            }`}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Snooze */}
          {snoozeRemaining > 0 ? (
            <span className="px-2 py-1 rounded-md text-[11px] font-mono bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/50 tabular-nums">
              {snoozeRemaining}s
            </span>
          ) : (
            <button
              onClick={snoozeAlarms}
              title="Snooze alarms for 120 seconds"
              className="clinical-btn-secondary px-2.5 py-1.5 text-xs hidden sm:inline-flex items-center gap-1.5"
            >
              <BellOff className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Snooze</span>
            </button>
          )}

          {/* Reset */}
          <button
            onClick={resetSimulation}
            title="Reset simulation to baseline"
            className="clinical-btn-secondary px-2.5 py-1.5 text-xs inline-flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
            <span className="hidden md:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* Compact Mobile & Tablet Horizontal Navigation Bar (< lg) */}
      <nav
        aria-label="Clinical Sections"
        className="lg:hidden border-t border-[var(--border-subtle)] bg-[var(--surface-card)] px-3 overflow-x-auto"
      >
        <div className="flex items-center gap-1 py-1.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs whitespace-nowrap transition-colors duration-150 ${
                  isActive
                    ? 'bg-[var(--accent-soft)] text-[var(--accent-primary)] font-semibold border border-[var(--accent-border)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-well)] border border-transparent'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{item.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </header>
  );
};
