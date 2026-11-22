import React, { useState } from 'react';
import { TelemetryProvider } from './context/TelemetryContext';
import { Header, ActiveNavTab } from './components/Header';
import { ActiveAlarmBanner } from './components/ActiveAlarmBanner';

// Dashboard Components
import { BedsideMonitorCard } from './components/dashboard/BedsideMonitorCard';
import { OxygenSupplyPanel } from './components/dashboard/OxygenSupplyPanel';
import { SystemOverviewPanel } from './components/dashboard/SystemOverviewPanel';

// View Pages
import { SupplyPathView } from './components/views/SupplyPathView';
import { TimeScrubberView } from './components/views/TimeScrubberView';
import { LiveDemonstrationView } from './components/views/LiveDemonstrationView';
import { HardwareTelemetryView } from './components/views/HardwareTelemetryView';
import { PredictiveAnalyticsView } from './components/views/PredictiveAnalyticsView';
import { CaregiverView } from './components/views/CaregiverView';
import { AnalyticsReportsView } from './components/views/AnalyticsReportsView';
import { PresentationModeView } from './components/views/PresentationModeView';
import { AboutInnovationView } from './components/views/AboutInnovationView';
import { SettingsView } from './components/views/SettingsView';

import { Activity, ShieldCheck } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveNavTab>('dashboard');

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      
      {/* Primary Header with Live Telemetry Pills & Navigation */}
      <Header currentTab={activeTab} onSelectTab={setActiveTab} />

      {/* Dynamic Urgent Alarm Banner (IEC 60601-1-8 alerts) */}
      <ActiveAlarmBanner />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 transition-all duration-300">
        
        {/* VIEW 1: Operational Clinical Bedside Monitor & Supplies */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-fadeIn">
            {/* A. Multi-Lead Bedside Monitor (Lead II ECG + PPG Pleth + 20Hz Clock) */}
            <BedsideMonitorCard />

            {/* B. Oxygen Supply Management (Primary, Secondary, 5-Min Reserve Buffer) */}
            <OxygenSupplyPanel />

            {/* C. System Overview & Switching Audit */}
            <SystemOverviewPanel />
          </div>
        )}

        {/* VIEW 2: Smart Supply Manifold & Animated Flow Path */}
        {activeTab === 'supply_path' && (
          <div className="animate-fadeIn">
            <SupplyPathView />
          </div>
        )}

        {/* VIEW 3: Precision Chronometer & Depletion Time-Machine */}
        {activeTab === 'time_travel' && (
          <div className="animate-fadeIn">
            <TimeScrubberView />
          </div>
        )}

        {/* VIEW 4: Live Demonstration & Emergency Simulation Lab (8 Scenarios) */}
        {activeTab === 'demonstration' && (
          <div className="animate-fadeIn">
            <LiveDemonstrationView />
          </div>
        )}

        {/* VIEW 5: ESP32 Mechatronics Hardware & UART Serial Telemetry */}
        {activeTab === 'hardware' && (
          <div className="animate-fadeIn">
            <HardwareTelemetryView />
          </div>
        )}

        {/* VIEW 6: Predictive Depletion Analytics */}
        {activeTab === 'predictive' && (
          <div className="animate-fadeIn">
            <PredictiveAnalyticsView />
          </div>
        )}

        {/* VIEW 7: Caregiver & Attendant Interface */}
        {activeTab === 'caregiver' && (
          <div className="animate-fadeIn">
            <CaregiverView />
          </div>
        )}

        {/* VIEW 8: Analytics, Auditing & Reports */}
        {activeTab === 'analytics' && (
          <div className="animate-fadeIn">
            <AnalyticsReportsView />
          </div>
        )}

        {/* VIEW 9: College Exhibition Presentation Mode */}
        {activeTab === 'presentation' && (
          <div className="animate-fadeIn">
            <PresentationModeView />
          </div>
        )}

        {/* VIEW 10: About & Innovation Engineering Dossier */}
        {activeTab === 'innovation' && (
          <div className="animate-fadeIn">
            <AboutInnovationView />
          </div>
        )}

        {/* VIEW 11: System Settings & Simulation Calibration */}
        {activeTab === 'settings' && (
          <div className="animate-fadeIn">
            <SettingsView />
          </div>
        )}

      </main>

      {/* Professional Medical Engineering Footer */}
      <footer className="border-t border-slate-800/80 bg-[#050810] py-4 px-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
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
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>SOFTWARE PROTOTYPE ONLY · NOT CONNECTED TO MEDICAL HARDWARE</span>
            </span>
          </div>

          <div className="flex items-center gap-2 text-slate-500">
            <span>Engineering Exhibition Prototype</span>
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
