import React, { useEffect, useState } from 'react';
import {
  Box,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Layers,
  Monitor,
  PlayCircle,
  RefreshCw,
  RotateCcw,
  RotateCw,
  Sliders,
  Sparkles
} from 'lucide-react';
import { useTelemetry } from '../../context/TelemetryContext';
import {
  TWIN_COMPONENTS,
  TWIN_TOUR_ORDER,
  TwinComponentId
} from '../../data/digitalTwinCatalog';
import { SCENARIO_DEFINITIONS } from '../../services/scenarioData';
import { OxySync3DCanvas } from '../three/OxySync3DCanvas';

const LCD_PAGE_NAMES = ['Home Vitals', 'Dual Supply', 'Prediction', 'Alerts', 'Network/AP'];

export const DigitalTwin3DView: React.FC = () => {
  const {
    activeScenario,
    triggerScenario,
    resetSimulation,
    refillCylinder,
    primaryCylinder,
    secondaryCylinder,
    reserveBuffer,
    activeSource,
    vitals,
    settings,
    setFlowRate
  } = useTelemetry();

  const [selectedComponent, setSelectedComponent] = useState<TwinComponentId>('overview');
  const [exploded, setExploded] = useState<boolean>(false);
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [lcdAutoCycle, setLcdAutoCycle] = useState<boolean>(true);
  const [lcdPageIndex, setLcdPageIndex] = useState<number>(0);

  // Mirror ESP32 DisplayManager.cpp 3.5-second page auto-cycle
  useEffect(() => {
    if (!lcdAutoCycle) return;
    const timer = window.setInterval(() => {
      setLcdPageIndex((prev) => (prev + 1) % 5);
    }, 3500);
    return () => clearInterval(timer);
  }, [lcdAutoCycle]);

  const activeSpec = TWIN_COMPONENTS[selectedComponent] || TWIN_COMPONENTS.overview;
  const tourIndex = Math.max(0, TWIN_TOUR_ORDER.indexOf(selectedComponent));
  const scenarioList = Object.values(SCENARIO_DEFINITIONS);

  const handleTourStep = (delta: number) => {
    const nextIdx = (tourIndex + delta + TWIN_TOUR_ORDER.length) % TWIN_TOUR_ORDER.length;
    setSelectedComponent(TWIN_TOUR_ORDER[nextIdx]);
  };

  const handleManualLcdNext = () => {
    setLcdAutoCycle(false);
    setLcdPageIndex((prev) => (prev + 1) % 5);
  };

  return (
    <div className="space-y-5">
      {/* Header Control Bar */}
      <div className="bg-[#0c1220]/85 rounded-2xl border border-slate-800 p-4 sm:p-5 shadow-xl backdrop-blur-md flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/40 flex items-center justify-center shrink-0">
              <Box className="w-4 h-4 text-cyan-400" />
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-white">
              Interactive 3D OXYSYNC 2.0 Hardware Digital Twin
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
              JUDGE DEMO MODEL
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Virtual 3D hardware rig synced live to Boyle&apos;s Law physics, solenoid valves, 5-minute reserve buffer, patient lungs, and the 5-page ESP32 16×2 LCD.
          </p>
        </div>

        {/* 3D Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={() => setExploded((v) => !v)}
            className={`px-3 py-1.5 rounded-xl font-semibold border flex items-center gap-1.5 transition-all ${
              exploded
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{exploded ? 'Collapse View' : 'Exploded View'}</span>
          </button>

          <button
            onClick={handleManualLcdNext}
            title="Simulate pressing ESP32 BOOT (GPIO 0) to cycle LCD pages"
            className="px-3 py-1.5 rounded-xl font-semibold bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 flex items-center gap-1.5 transition-all"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>LCD P{(lcdPageIndex % 5) + 1}: {LCD_PAGE_NAMES[lcdPageIndex % 5]}</span>
          </button>

          <button
            onClick={() => setLcdAutoCycle((v) => !v)}
            className={`px-2.5 py-1.5 rounded-xl font-mono text-[11px] border transition-all ${
              lcdAutoCycle
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-900 border-slate-700 text-slate-400'
            }`}
          >
            {lcdAutoCycle ? 'Auto-LCD: ON' : 'Auto-LCD: OFF'}
          </button>

          <button
            onClick={() => setAutoRotate((v) => !v)}
            className={`px-2.5 py-1.5 rounded-xl font-semibold border flex items-center gap-1 transition-all ${
              autoRotate
                ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300'
            }`}
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Orbit</span>
          </button>

          <button
            onClick={() => setSelectedComponent('overview')}
            className="px-2.5 py-1.5 rounded-xl font-semibold bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Full Rig</span>
          </button>
        </div>
      </div>

      {/* Main 3D Stage + Judge Inspector Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* 3D WebGL Canvas Stage */}
        <div className="lg:col-span-8 bg-[#040812] rounded-3xl border border-slate-800 overflow-hidden shadow-2xl relative h-[340px] sm:h-[440px] lg:h-[540px]">
          <OxySync3DCanvas
            selectedComponent={selectedComponent}
            onSelectComponent={setSelectedComponent}
            exploded={exploded}
            lcdPageIndex={lcdPageIndex}
            autoRotate={autoRotate}
          />

          {/* Top-Left Live HUD Strip */}
          <div className="pointer-events-none absolute top-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 text-[10px] sm:text-[11px] font-mono">
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className={`px-2.5 py-1 rounded-lg border font-bold backdrop-blur-md ${
                  activeSource === 'reserve' || activeSource === 'none'
                    ? 'bg-red-950/85 border-red-500/60 text-red-300'
                    : activeSource === 'secondary'
                    ? 'bg-teal-950/85 border-teal-500/50 text-teal-300'
                    : 'bg-cyan-950/85 border-cyan-500/50 text-cyan-300'
                }`}
              >
                FEED: {activeSource.toUpperCase()}
              </span>
              <span className="px-2 py-1 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-200 backdrop-blur-md">
                A-1: {primaryCylinder.percentRemaining}%
              </span>
              <span className="px-2 py-1 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-200 backdrop-blur-md">
                B-2: {secondaryCylinder.percentRemaining}%
              </span>
              <span className="px-2 py-1 rounded-lg bg-slate-950/80 border border-slate-800 text-amber-300 backdrop-blur-md">
                RES: {reserveBuffer.remainingSeconds}s
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span
                className={`px-2 py-1 rounded-lg border backdrop-blur-md font-bold ${
                  vitals.spo2 < 90
                    ? 'bg-red-950/85 border-red-500/50 text-red-300'
                    : 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
                }`}
              >
                SpO₂ {vitals.spo2}% · {vitals.pulseRate} BPM
              </span>
            </div>
          </div>

          {/* Bottom-Left Quick Camera Preset Pills */}
          <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {TWIN_TOUR_ORDER.map((id) => {
                const isActive = selectedComponent === id;
                const shortLabel =
                  id === 'overview'
                    ? 'Full Rig'
                    : id === 'primary_cylinder'
                    ? 'Primary A-1'
                    : id === 'secondary_cylinder'
                    ? 'Backup B-2'
                    : id === 'solenoid_bank'
                    ? 'Solenoids'
                    : id === 'manifold_regulator'
                    ? 'Manifold'
                    : id === 'reserve_buffer'
                    ? '5m Reserve'
                    : id === 'esp32_lcd'
                    ? 'ESP32 & LCD'
                    : 'Lung Pod';
                return (
                  <button
                    key={id}
                    onClick={() => setSelectedComponent(id)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-mono font-semibold border backdrop-blur-md transition-all ${
                      isActive
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/20'
                        : 'bg-slate-950/80 hover:bg-slate-900 text-slate-300 border-slate-700/80'
                    }`}
                  >
                    {shortLabel}
                  </button>
                );
              })}
            </div>

            <span className="hidden sm:inline-block px-2 py-1 rounded-lg bg-slate-950/75 border border-slate-800 text-[10px] font-mono text-slate-400">
              Drag to orbit · Scroll to zoom · Click 3D part
            </span>
          </div>
        </div>

        {/* Guided Judge Tour & Subsystem Inspector Sidebar */}
        <div className="lg:col-span-4 bg-[#080d1a] rounded-3xl border border-slate-800 p-5 flex flex-col justify-between space-y-4 shadow-xl">
          <div className="space-y-4">
            {/* Guided Tour Stepper */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-300">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>GUIDED JUDGE TOUR ({tourIndex + 1}/{TWIN_TOUR_ORDER.length})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleTourStep(-1)}
                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200"
                  title="Previous subsystem"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleTourStep(1)}
                  className="px-2.5 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center gap-1"
                  title="Next subsystem"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Component Details */}
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 mb-2">
                <Cpu className="w-3 h-3" />
                {activeSpec.gpioPin}
              </span>
              <h2 className="text-base sm:text-lg font-black text-white">{activeSpec.title}</h2>
              <p className="text-xs text-cyan-300/90 font-medium mt-0.5">{activeSpec.subtitle}</p>
              <p className="text-xs text-slate-300 leading-relaxed mt-2">{activeSpec.roleSummary}</p>
            </div>

            {/* Judge Talking Script Callout */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-cyan-950/50 to-slate-950 border border-cyan-500/30 space-y-1.5">
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400">
                What to Tell Judges:
              </div>
              <p className="text-xs text-slate-100 leading-relaxed italic">
                &ldquo;{activeSpec.judgeScript}&rdquo;
              </p>
            </div>

            {/* Specs */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-mono font-bold uppercase text-slate-400">
                Hardware &amp; Physics Details
              </div>
              <ul className="space-y-1.5">
                {activeSpec.technicalSpecs.map((spec, idx) => (
                  <li
                    key={idx}
                    className="p-2 rounded-lg bg-slate-900/70 border border-slate-800 text-[11px] font-mono text-slate-300"
                  >
                    • {spec}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Flow Titration & Quick Refill */}
          <div className="pt-3 border-t border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                Live Cannula Flow Rate
              </span>
              <span className="font-mono font-bold text-cyan-300">{settings.flowRateLpm.toFixed(1)} L/min</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="15.0"
              step="0.5"
              value={settings.flowRateLpm}
              onChange={(e) => setFlowRate(parseFloat(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
            />
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => refillCylinder('all')}
                className="py-2 px-3 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 border border-slate-700 text-emerald-300 flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refill All</span>
              </button>
              <button
                onClick={resetSimulation}
                className="py-2 px-3 rounded-xl text-xs font-bold bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Demo</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Live 8-Scenario Exhibition Trigger Bar */}
      <div className="bg-[#0c1220]/85 rounded-2xl border border-slate-800 p-4 sm:p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-white">
            <PlayCircle className="w-4 h-4 text-cyan-400" />
            <span>TRIGGER ANY OF THE 8 WORKING SCENARIOS ON THE 3D MODEL</span>
          </div>
          <span className="text-[11px] font-mono text-cyan-300">
            Active: #{activeScenario.stepNumber} — {activeScenario.title}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {scenarioList.map((sc) => {
            const isActive = activeScenario.id === sc.id;
            return (
              <button
                key={sc.id}
                onClick={() => triggerScenario(sc.id)}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  isActive
                    ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-md shadow-cyan-500/15'
                    : 'bg-[#080d1a] hover:bg-slate-900 border-slate-800 text-slate-300'
                }`}
              >
                <div className="text-[10px] font-mono font-bold text-cyan-400">#{sc.stepNumber}</div>
                <div className="text-[11px] font-bold leading-tight mt-0.5 line-clamp-2">{sc.title}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
