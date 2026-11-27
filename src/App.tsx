import React, { Suspense, lazy, useState } from 'react';
import { TelemetryProvider } from './context/TelemetryContext';
import { Header, ActiveNavTab, NAV_ITEMS, NavItemConfig } from './components/Header';
import { ActiveAlarmBanner } from './components/ActiveAlarmBanner';

// Dashboard Components (eagerly loaded for instant first paint)
import { BedsideMonitorCard } from './components/dashboard/BedsideMonitorCard';
import { OxygenSupplyPanel } from './components/dashboard/OxygenSupplyPanel';
import { SystemOverviewPanel } from './components/dashboard/SystemOverviewPanel';

// Secondary View Pages (lazy-loaded)
const DigitalTwin3DView = lazy(() =>
  import('./components/views/DigitalTwin3DView').then((m) => ({ default: m.DigitalTwin3DView }))
);
const SupplyPathView = lazy(() =>
  import('./components/views/SupplyPathView').then((m) => ({ default: m.SupplyPathView }))
);
const TimeScrubberView = lazy(() =>
  import('./components/views/TimeScrubberView').then((m) => ({ default: m.TimeScrubberView }))
);
const LiveDemonstrationView = lazy(() =>
  import('./components/views/LiveDemonstrationView').then((m) => ({ default: m.LiveDemonstrationView }))
);
const HardwareTelemetryView = lazy(() =>
  import('./components/views/HardwareTelemetryView').then((m) => ({ default: m.HardwareTelemetryView }))
);
const PredictiveAnalyticsView = lazy(() =>
  import('./components/views/PredictiveAnalyticsView').then((m) => ({ default: m.PredictiveAnalyticsView }))
);
const CaregiverView = lazy(() =>
  import('./components/views/CaregiverView').then((m) => ({ default: m.CaregiverView }))
);
const AnalyticsReportsView = lazy(() =>
  import('./components/views/AnalyticsReportsView').then((m) => ({ default: m.AnalyticsReportsView }))
);
const PresentationModeView = lazy(() =>
  import('./components/views/PresentationModeView').then((m) => ({ default: m.PresentationModeView }))
);
const AboutInnovationView = lazy(() =>
  import('./components/views/AboutInnovationView').then((m) => ({ default: m.AboutInnovationView }))
);
const SettingsView = lazy(() =>
  import('./components/views/SettingsView').then((m) => ({ default: m.SettingsView }))
);

const NAV_GROUPS: NavItemConfig['group'][] = ['Monitoring', 'Diagnostics', 'Care & Records'];

const ViewFallback: React.FC = () => (
  <div className="clinical-card p-8 text-center text-xs font-mono text-[var(--text-muted)]">
    Loading module...
  </div>
);

const MainAppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveNavTab>('dashboard');

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-5">
            <BedsideMonitorCard />
            <OxygenSupplyPanel />
            <SystemOverviewPanel />
          </div>
        );
      case 'digital_twin':
        return <DigitalTwin3DView />;
      case 'supply_path':
        return <SupplyPathView />;
      case 'time_travel':
        return <TimeScrubberView />;
      case 'demonstration':
        return <LiveDemonstrationView />;
      case 'hardware':
        return <HardwareTelemetryView />;
      case 'predictive':
        return <PredictiveAnalyticsView />;
      case 'caregiver':
        return <CaregiverView />;
      case 'analytics':
        return <AnalyticsReportsView />;
      case 'presentation':
        return <PresentationModeView onOpen3DTwin={() => setActiveTab('digital_twin')} />;
      case 'innovation':
        return <AboutInnovationView />;
      case 'settings':
        return <SettingsView />;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--surface-canvas)] text-[var(--text-primary)] flex flex-col">
      <Header currentTab={activeTab} onSelectTab={setActiveTab} />
      <ActiveAlarmBanner />

      <div className="flex-1 max-w-[1440px] w-full mx-auto flex gap-6 px-3 sm:px-5 py-4 sm:py-6">
        {/* Clean Grouped Sidebar Navigation on Desktop */}
        <aside className="hidden lg:block w-56 shrink-0">
          <div className="sticky top-20 space-y-5">
            {NAV_GROUPS.map((groupName) => (
              <div key={groupName}>
                <div className="px-2.5 mb-1.5 text-[11px] font-semibold text-[var(--text-muted)] tracking-tight">
                  {groupName}
                </div>
                <div className="space-y-0.5">
                  {NAV_ITEMS.filter((item) => item.group === groupName).map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] text-left transition-colors duration-150 ${
                          isActive
                            ? 'bg-[var(--accent-soft)] text-[var(--accent-primary)] font-semibold'
                            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] font-medium'
                        }`}
                      >
                        <Icon
                          className={`w-4 h-4 shrink-0 ${
                            isActive ? 'text-[var(--accent-primary)]' : 'text-[var(--text-muted)]'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Active View Canvas with GPU-composited fade-slide reveal */}
        <main className="flex-1 min-w-0">
          <Suspense fallback={<ViewFallback />}>
            <div key={activeTab} className="animate-view-enter">
              {renderActiveView()}
            </div>
          </Suspense>
        </main>
      </div>

      {/* Minimal Workstation Footer */}
      <footer className="border-t border-[var(--border-subtle)] bg-[var(--surface-card)] py-3 px-4 sm:px-6 text-xs text-[var(--text-muted)]">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[var(--text-primary)]">OXYSYNC 2.0</span>
            <span>·</span>
            <span>Intelligent Oxygen. Continuous Care.</span>
          </div>
          <div className="font-mono text-[11px]">
            Prototype Telemetry Platform · Boyle&apos;s Law Failover Simulation
          </div>
        </div>
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <TelemetryProvider>
      <MainAppContent />
    </TelemetryProvider>
  );
};

export default App;
