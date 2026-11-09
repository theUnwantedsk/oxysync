import React, { useState } from 'react';
import { TelemetryProvider } from './context/TelemetryContext';
import { Header } from './components/Header';
import { ActiveAlarmBanner } from './components/ActiveAlarmBanner';
import { VitalsSection } from './components/VitalsSection';
import { OxygenSupplySection } from './components/OxygenSupplySection';
import { TitrationControl } from './components/TitrationControl';
import { SimulationBench } from './components/SimulationBench';
import { BedsideNightMode } from './components/BedsideNightMode';
import { PrescriptionModal } from './components/PrescriptionModal';
import { AlertHistoryModal } from './components/AlertHistoryModal';
import { ReportExportModal } from './components/ReportExportModal';
import { LayoutDashboard, Terminal, ShieldCheck, HeartPulse } from 'lucide-react';

const DashboardContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'simulator'>('dashboard');
  const [showBedside, setShowBedside] = useState<boolean>(false);
  const [showPrescription, setShowPrescription] = useState<boolean>(false);
  const [showAlertHistory, setShowAlertHistory] = useState<boolean>(false);
  const [showReportExport, setShowReportExport] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-[#050a12] text-slate-100 flex flex-col">
      {/* Top Clinical Header */}
      <Header
        onOpenPrescription={() => setShowPrescription(true)}
        onOpenAlertHistory={() => setShowAlertHistory(true)}
        onOpenReportExport={() => setShowReportExport(true)}
        onToggleBedsideMode={() => setShowBedside(true)}
      />

      {/* Dynamic Urgent Alarm Banner */}
      <ActiveAlarmBanner />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        
        {/* View Switcher Tabs */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Bedside Clinical Telemetry</span>
            </button>

            <button
              onClick={() => setActiveTab('simulator')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
                activeTab === 'simulator'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Terminal className="w-4 h-4" />
              <span>Mechatronics Testbench & ESP32</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Telemetry Link: ONLINE (1.0 Hz)</span>
          </div>
        </div>

        {/* View 1: Clinical Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-fadeIn">
            {/* 1. Patient Vitals */}
            <VitalsSection />

            {/* 2. Oxygen Supply & Physics */}
            <OxygenSupplySection />

            {/* 3. Closed-Loop Titration Controls */}
            <TitrationControl onOpenPrescription={() => setShowPrescription(true)} />
          </div>
        )}

        {/* View 2: Mechatronics Testbench */}
        {activeTab === 'simulator' && (
          <div className="space-y-6 animate-fadeIn">
            <SimulationBench />
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-[#03060c] py-4 px-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <HeartPulse className="w-4 h-4 text-cyan-400" />
            <span>
              <strong>OxySync Mechatronic System</strong> — Smart Oxygen Supply & Patient Monitoring
            </span>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span>ESP32 Firmware v2.4</span>
            <span>•</span>
            <span>IEC 60601-1-8 Audio Compliance</span>
            <span>•</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Clinician Protected
            </span>
          </div>
        </div>
      </footer>

      {/* Modals & Overlays */}
      {showBedside && <BedsideNightMode onClose={() => setShowBedside(false)} />}
      <PrescriptionModal isOpen={showPrescription} onClose={() => setShowPrescription(false)} />
      <AlertHistoryModal isOpen={showAlertHistory} onClose={() => setShowAlertHistory(false)} />
      <ReportExportModal isOpen={showReportExport} onClose={() => setShowReportExport(false)} />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <TelemetryProvider>
      <DashboardContent />
    </TelemetryProvider>
  );
};
export default App;
