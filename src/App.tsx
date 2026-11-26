import React, { Suspense, lazy, useState } from 'react';
import { TelemetryProvider } from './context/TelemetryContext';
import { Header, ActiveNavTab } from './components/Header';
import { ActiveAlarmBanner } from './components/ActiveAlarmBanner';

// Dashboard Components (eagerly loaded for instant first paint)
import { BedsideMonitorCard } from './components/dashboard/BedsideMonitorCard';
import { OxygenSupplyPanel } from './components/dashboard/OxygenSupplyPanel';
import { SystemOverviewPanel } from './components/dashboard/SystemOverviewPanel';

// Secondary View Pages (lazy-loaded to keep initial bundle lean)
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

import { Activity, ShieldCheck } from 'lucide-react';

const ViewFallback: React.FC = () => (
  <div className="p-8 rounded-2xl bg-[#0c1220]/80 border border-slate-800 text-center text-xs font-mono text-slate-400">
    Loading OXYSYNC module...
  </div>
);

const MainAppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveNavTab>('dashboard');

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      
      {/* Primary Header with Live Telemetry Pills & Navigation */}
      <Header currentTab={activeTab} onSelectTab={setActiveTab} />

      {/* Dynamic Urgent Alarm Banner (IEC 60601-1-8 alerts) */}
      <ActiveAlarmBanner />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 transition-all duration-300">
        
        {/* VIEW 1: Operational Clinical Bedside Monitor & Supplies */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-fadeIn">
            <BedsideMonitorCard />
            <OxygenSupplyPanel />
            <SystemOverviewPanel />
          </div>
        )}

        <Suspense fallback={<ViewFallback />}>
          {activeTab === 'digital_twin' && (
            <div className="animate-fadeIn">
              <DigitalTwin3DView />
            </div>
          )}

          {activeTab === 'supply_path' && (
            <div className="animate-fadeIn">
              <SupplyPathView />
            </div>
          )}

          {activeTab === 'time_travel' && (
            <div className="animate-fadeIn">
              <TimeScrubberView />
            </div>
          )}

          {activeTab === 'demonstration' && (
            <div className="animate-fadeIn">
              <LiveDemonstrationView />
            </div>
          )}

          {activeTab === 'hardware' && (
            <div className="animate-fadeIn">
              <HardwareTelemetryView />
            </div>
          )}

          {activeTab === 'predictive' && (
            <div className="animate-fadeIn">
              <PredictiveAnalyticsView />
            </div>
          )}

          {activeTab === 'caregiver' && (
            <div className="animate-fadeIn">
              <CaregiverView />
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="animate-fadeIn">
              <AnalyticsReportsView />
            </div>
          )}

          {activeTab === 'presentation' && (
            <div className="animate-fadeIn">
              <PresentationModeView onOpen3DTwin={() => setActiveTab('digital_twin')} />
            </div>
          )}

          {activeTab === 'innovation' && (
            <div className="animate-fadeIn">
              <AboutInnovationView />
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="animate-fadeIn">
              <SettingsView />
            </div>
          )}
        </Suspense>

      </main>

      {/* Professional Medical Engineering Footer */}
      <footer className="border-t border-slate-800/80 bg-[#050810] py-4 px-4 sm:px-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-cyan-500/20 flex items-center justify-center">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <span className="font-bold text-slate-300">OXYSYNC 2.0</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">Intelligent Oxygen. Continuous Care.</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>PROTOTYPE MONITOR · SIMULATED TELEMETRY</span>
            </span>
          </div>

          <div className="flex items-center gap-2 text-slate-500">
            <span>Tri-Platform Suite</span>
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
