import React, { useEffect, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Cpu,
  Layers,
  Monitor,
  RefreshCw,
  RotateCcw,
  RotateCw,
  Sliders
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

const FOCUS_LABELS: Record<TwinComponentId, string> = {
  overview: 'Full Rig',
  primary_cylinder: 'Primary A-1',
  secondary_cylinder: 'Backup B-2',
  solenoid_bank: 'Solenoids',
  manifold_regulator: 'Manifold',
  reserve_buffer: '5m Reserve',
  esp32_lcd: 'ESP32 & LCD',
  patient_pod: 'Lung Pod'
};

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
    setFlowRate,
    theme
  } = useTelemetry();

  const [selectedComponent, setSelectedComponent] = useState<TwinComponentId>('overview');
  const [exploded, setExploded] = useState<boolean>(false);
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [lcdAutoCycle, setLcdAutoCycle] = useState<boolean>(true);
  const [lcdPageIndex, setLcdPageIndex] = useState<number>(0);

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
      {/* Control Toolbar */}
      <div className="clinical-card p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-[var(--text-primary)] tracking-tight">
            3D Mechatronic Digital Twin
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Live pneumatic rig synced to Boyle&apos;s Law depletion, solenoid relays, and 5-page ESP32 LCD telemetry
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={() => setExploded((v) => !v)}
            className={`px-3 py-1.5 rounded-lg font-medium inline-flex items-center gap-1.5 border transition-colors duration-150 ${
              exploded
                ? 'bg-[var(--accent-soft)] border-[var(--accent-border)] text-[var(--accent-primary)] font-semibold'
                : 'clinical-btn-secondary'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{exploded ? 'Collapse Assembly' : 'Exploded View'}</span>
          </button>

          <button
            onClick={handleManualLcdNext}
            title="Cycle ESP32 16×2 LCD page (GPIO 0)"
            className="clinical-btn-secondary px-3 py-1.5 inline-flex items-center gap-1.5 tabular-nums"
          >
            <Monitor className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
            <span>LCD P{(lcdPageIndex % 5) + 1}: {LCD_PAGE_NAMES[lcdPageIndex % 5]}</span>
          </button>

          <button
            onClick={() => setLcdAutoCycle((v) => !v)}
            className={`px-2.5 py-1.5 rounded-lg font-mono text-[11px] border transition-colors duration-150 ${
              lcdAutoCycle
                ? 'bg-[var(--accent-soft)] border-[var(--accent-border)] text-[var(--accent-primary)] font-semibold'
                : 'clinical-btn-secondary'
            }`}
          >
            {lcdAutoCycle ? 'Auto-LCD On' : 'Auto-LCD Off'}
          </button>

          <button
            onClick={() => setAutoRotate((v) => !v)}
            className={`px-2.5 py-1.5 rounded-lg text-xs border inline-flex items-center gap-1 transition-colors duration-150 ${
              autoRotate
                ? 'bg-[var(--accent-soft)] border-[var(--accent-border)] text-[var(--accent-primary)] font-semibold'
                : 'clinical-btn-secondary'
            }`}
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Orbit</span>
          </button>

          <button
            onClick={() => setSelectedComponent('overview')}
            className="clinical-btn-secondary px-2.5 py-1.5 inline-flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
            <span>Reset View</span>
          </button>
        </div>
      </div>

      {/* Viewport + Subsystem Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* 3D WebGL Viewport */}
        <div
          className={`lg:col-span-8 clinical-card overflow-hidden relative h-[350px] sm:h-[440px] lg:h-[540px] ${
            theme === 'light' ? 'bg-slate-100' : 'bg-[#070b14]'
          }`}
        >
          <OxySync3DCanvas
            selectedComponent={selectedComponent}
            onSelectComponent={setSelectedComponent}
            exploded={exploded}
            lcdPageIndex={lcdPageIndex}
            autoRotate={autoRotate}
          />

          {/* Compact HUD Status Strip */}
          <div className="pointer-events-none absolute top-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono tabular-nums">
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className={`px-2.5 py-1 rounded-md border font-semibold backdrop-blur-sm ${
                  activeSource === 'reserve' || activeSource === 'none'
                    ? 'bg-red-50/95 border-red-200 text-red-700 dark:bg-red-950/90 dark:border-red-800 dark:text-red-300'
                    : 'bg-[var(--surface-header)] border-[var(--border-subtle)] text-[var(--text-primary)]'
                }`}
              >
                Feed: <span className="capitalize">{activeSource}</span>
              </span>
              <span className="px-2 py-1 rounded-md bg-[var(--surface-header)] border border-[var(--border-subtle)] text-[var(--text-secondary)] backdrop-blur-sm">
                A-1 {primaryCylinder.percentRemaining}%
              </span>
              <span className="px-2 py-1 rounded-md bg-[var(--surface-header)] border border-[var(--border-subtle)] text-[var(--text-secondary)] backdrop-blur-sm">
                B-2 {secondaryCylinder.percentRemaining}%
              </span>
              <span className="px-2 py-1 rounded-md bg-[var(--surface-header)] border border-[var(--border-subtle)] text-[var(--text-secondary)] backdrop-blur-sm">
                Res {reserveBuffer.remainingSeconds}s
              </span>
            </div>

            <span
              className={`px-2.5 py-1 rounded-md border font-semibold backdrop-blur-sm ${
                vitals.spo2 < 90
                  ? 'bg-red-50/95 border-red-200 text-red-700 dark:bg-red-950/90 dark:border-red-800 dark:text-red-300'
                  : 'bg-[var(--surface-header)] border-[var(--border-subtle)] text-emerald-700 dark:text-emerald-300'
              }`}
            >
              SpO₂ {vitals.spo2}% · {vitals.pulseRate} BPM
            </span>
          </div>

          {/* Camera Focus Controls */}
          <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {TWIN_TOUR_ORDER.map((id) => {
                const isActive = selectedComponent === id;
                return (
                  <button
                    key={id}
                    onClick={() => setSelectedComponent(id)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium border backdrop-blur-sm transition-colors duration-150 ${
                      isActive
                        ? 'bg-[var(--accent-primary)] text-white dark:text-slate-950 border-transparent font-semibold'
                        : 'bg-[var(--surface-header)] hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] border-[var(--border-subtle)]'
                    }`}
                  >
                    {FOCUS_LABELS[id]}
                  </button>
                );
              })}
            </div>

            <span className="hidden xl:inline-block px-2 py-1 rounded-md bg-[var(--surface-header)] border border-[var(--border-subtle)] text-[11px] text-[var(--text-muted)] backdrop-blur-sm">
              Drag to orbit · Scroll to zoom · Click part
            </span>
          </div>
        </div>

        {/* Subsystem Inspector Sidebar */}
        <aside className="lg:col-span-4 clinical-card p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            {/* Stepper Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
              <span className="text-xs font-mono font-semibold text-[var(--text-muted)] tabular-nums">
                Subsystem {tourIndex + 1} of {TWIN_TOUR_ORDER.length}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleTourStep(-1)}
                  className="clinical-btn-secondary p-1.5"
                  title="Previous subsystem"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleTourStep(1)}
                  className="clinical-btn-primary px-2.5 py-1 text-xs inline-flex items-center gap-1"
                  title="Next subsystem"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Subsystem Summary */}
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[var(--surface-well)] border border-[var(--border-subtle)] text-[11px] font-mono text-[var(--accent-primary)] mb-2">
                <Cpu className="w-3 h-3" />
                <span>{activeSpec.gpioPin}</span>
              </div>
              <h2 className="text-base font-bold text-[var(--text-primary)]">{activeSpec.title}</h2>
              <p className="text-xs font-medium text-[var(--accent-primary)] mt-0.5">{activeSpec.subtitle}</p>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed mt-2">
                {activeSpec.roleSummary}
              </p>
            </div>

            {/* Engineering Rationale */}
            <div className="clinical-well p-3.5 space-y-1">
              <div className="text-[11px] font-semibold text-[var(--text-primary)]">
                Design Rationale
              </div>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                {activeSpec.designRationale}
              </p>
            </div>

            {/* Technical Specs */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-semibold text-[var(--text-muted)]">
                Specifications
              </div>
              <ul className="space-y-1.5">
                {activeSpec.technicalSpecs.map((spec, idx) => (
                  <li
                    key={idx}
                    className="px-2.5 py-1.5 rounded-md bg-[var(--surface-well)] border border-[var(--border-subtle)] text-[11px] font-mono text-[var(--text-secondary)]"
                  >
                    {spec}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Live Flow & Reset Controls */}
          <div className="pt-3 border-t border-[var(--border-subtle)] space-y-2.5">
            <div className="flex items-center justify-between text-xs tabular-nums">
              <label
                htmlFor="twin-flow-slider"
                className="font-semibold text-[var(--text-primary)] inline-flex items-center gap-1.5"
              >
                <Sliders className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                Cannula Flow
              </label>
              <span className="font-mono font-bold text-[var(--accent-primary)]">
                {settings.flowRateLpm.toFixed(1)} L/min
              </span>
            </div>
            <input
              id="twin-flow-slider"
              type="range"
              min="0.5"
              max="15.0"
              step="0.5"
              value={settings.flowRateLpm}
              onChange={(e) => setFlowRate(parseFloat(e.target.value))}
              className="clinical-slider"
            />
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => refillCylinder('all')}
                className="clinical-btn-secondary py-1.5 px-3 text-xs inline-flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Refill All</span>
              </button>
              <button
                onClick={resetSimulation}
                className="clinical-btn-primary py-1.5 px-3 text-xs inline-flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Rig</span>
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* Scenario Injection Strip */}
      <div className="clinical-card p-4 sm:p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-semibold text-[var(--text-primary)]">
            Test Scenarios Synced to 3D Hardware
          </span>
          <span className="font-mono text-[11px] text-[var(--accent-primary)] tabular-nums">
            Active: #{activeScenario.stepNumber} · {activeScenario.title}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {scenarioList.map((sc) => {
            const isActive = activeScenario.id === sc.id;
            return (
              <button
                key={sc.id}
                onClick={() => triggerScenario(sc.id)}
                className={`p-2.5 rounded-lg border text-left transition-colors duration-150 ${
                  isActive
                    ? 'bg-[var(--accent-soft)] border-[var(--accent-border)] text-[var(--text-primary)] font-semibold'
                    : 'bg-[var(--surface-well)] hover:bg-[var(--surface-hover)] border-[var(--border-subtle)] text-[var(--text-secondary)]'
                }`}
              >
                <div className="text-[11px] font-mono text-[var(--accent-primary)] tabular-nums">
                  #{sc.stepNumber}
                </div>
                <div className="text-[11px] font-medium leading-tight mt-0.5 line-clamp-2">
                  {sc.title}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
