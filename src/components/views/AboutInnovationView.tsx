import React from 'react';
import { Cpu, ShieldCheck, Cylinder, Clock, Bell, Activity, AlertTriangle, Microchip, Laptop } from 'lucide-react';

export const AboutInnovationView: React.FC = () => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Intro */}
      <div className="clinical-card p-6 space-y-2">
        <h1 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">
          OXYSYNC 2.0 Engineering Notes
        </h1>
        <p className="text-xs font-mono text-[var(--accent-primary)]">
          Closed-Loop Oxygen Management &amp; Redundancy Architecture
        </p>
        <p className="text-sm text-[var(--text-secondary)] pt-2 leading-relaxed">
          In ambulatory transport, home care, and resource-limited clinics, standard oxygen regulators provide no predictive exhaustion warning or automatic backup changeover. OXYSYNC addresses this gap through deterministic gas accounting, dual-cylinder valve control, and a short-duration reserve bridge.
        </p>
      </div>

      {/* Six Pillars */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">Core System Pillars</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            [
              Activity,
              '1. Closed-Loop Telemetry',
              'Correlates simulated patient demand (SpO₂, pulse rate) directly with cylinder pressure readings rather than relying on periodic manual checks.'
            ],
            [
              Clock,
              '2. Physics-Based Depletion Math',
              "Applies Boyle's Law (V = P × V_water and T = V / Q) to surface remaining hours and minutes plus predicted threshold crossing times."
            ],
            [
              Cylinder,
              '3. Automated Dual-Tank Failover',
              'Monitors Primary (A-1) and Standby (B-2), actuating latching solenoid valves automatically at a configurable 5%–30% threshold.'
            ],
            [
              ShieldCheck,
              '4. 5-Minute Reserve Bridge',
              'Conceptual 12.5-liter downstream reservoir built to sustain delivery for up to 5 minutes while physical cylinders are swapped.'
            ],
            [
              Bell,
              '5. Caregiver Notification Layer',
              'Translates sensor state into plain-language desktop/mobile advisories accompanied by IEC 60601-1-8 alarm cadence.'
            ],
            [
              Cpu,
              '6. Local Hardware + Software Parity',
              'Runs identically on the embedded ESP32 firmware node (I2C LCD + SoftAP + USB Serial) and the companion Web & Android monitors.'
            ]
          ].map(([IconComp, title, desc], idx) => {
            const Icon = IconComp as React.ElementType;
            return (
              <div key={idx} className="clinical-card p-5 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-sm text-[var(--text-primary)]">
                  <Icon className="w-4 h-4 text-[var(--accent-primary)] shrink-0" />
                  <span>{title as string}</span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{desc as string}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Software vs Hardware Scope */}
      <div className="clinical-card p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
          <h2 className="text-sm font-bold text-[var(--text-primary)] inline-flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            Prototype Scope: Software Simulation vs Physical BOM
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="clinical-well p-4 space-y-2">
            <div className="inline-flex items-center gap-2 text-[var(--accent-primary)] font-semibold text-sm">
              <Laptop className="w-4 h-4" />
              <span>Software Prototype</span>
            </div>
            <ul className="space-y-1.5 text-[var(--text-secondary)] font-mono text-[11px]">
              <li>• Deterministic Boyle&apos;s Law simulation engine</li>
              <li>• React + TypeScript telemetry UI &amp; Three.js 3D twin</li>
              <li>• Synthesized Web Audio API alarm tones</li>
              <li>• High-DPI 60 FPS ECG &amp; PPG oscilloscope canvas</li>
              <li>• ESP32 WebSocket / REST / USB Serial bridge</li>
            </ul>
          </div>

          <div className="clinical-well p-4 space-y-2">
            <div className="inline-flex items-center gap-2 text-teal-600 dark:text-teal-400 font-semibold text-sm">
              <Microchip className="w-4 h-4" />
              <span>Target Mechatronic BOM</span>
            </div>
            <ul className="space-y-1.5 text-[var(--text-secondary)] font-mono text-[11px]">
              <li>• ESP32-WROOM-32 / S3 Microcontroller + 16×2 I2C LCD</li>
              <li>• Honeywell 0–200 Bar piezoresistive pressure sensors</li>
              <li>• 12V latching solenoid valves (zero-heat hold)</li>
              <li>• Sensirion SFM3000 medical mass flow sensor</li>
              <li>• 6061-T6 machined aluminum high-pressure manifold</li>
            </ul>
          </div>
        </div>

        <p className="text-xs text-[var(--text-muted)] font-mono pt-1">
          Note: The 5-minute reserve duration is an engineering design benchmark; clinical deployment requires ISO 80601-2-69 and ISO 18562 compliance testing.
        </p>
      </div>
    </div>
  );
};
