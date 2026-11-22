import React from 'react';
import { 
  Lightbulb, 
  Cpu, 
  ShieldCheck, 
  Cylinder, 
  Clock, 
  Bell, 
  Activity, 
  AlertTriangle,
  Microchip,
  Laptop
} from 'lucide-react';

export const AboutInnovationView: React.FC = () => {
  return (
    <div className="space-y-8 max-w-5xl mx-auto py-2">
      
      {/* Header */}
      <div className="bg-[#0c1220]/80 rounded-2xl border border-slate-800 p-6 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
            <Lightbulb className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">OXYSYNC 2.0 Engineering & Innovation Dossier</h1>
            <p className="text-xs text-cyan-300 font-mono mt-0.5">Intelligent Oxygen. Continuous Care.</p>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-300 mt-4 leading-relaxed font-sans">
          In home healthcare, emergency transport, and rural clinics, oxygen cylinders frequently exhaust without advance warning. Current standalone medical cylinders lack physiological telemetry, automatic failover, and depletion predictive algorithms. OXYSYNC bridges this critical mechatronic safety gap.
        </p>
      </div>

      {/* 6 Core Innovations Grid */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          Six Core Pillars of the OXYSYNC Innovation
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* 1. Intelligent Oxygen Supply Management */}
          <div className="p-5 rounded-2xl bg-[#080d1a] border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm text-cyan-300">
              <Activity className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>1. Intelligent Oxygen Supply Management</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Synthesizes real-time patient physiological demand (SpO₂, heart rate) directly with oxygen supply tank dynamics, replacing unmonitored mechanical rotameters with closed-loop telemetry.
            </p>
          </div>

          {/* 2. Predictive Cylinder Depletion Estimation */}
          <div className="p-5 rounded-2xl bg-[#080d1a] border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm text-teal-300">
              <Clock className="w-4 h-4 text-teal-400 shrink-0" />
              <span>2. Predictive Depletion Modeling</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Uses transparent mathematical gas physics (Boyle\'s Law: <code className="text-teal-400 font-mono text-[11px]">V = P × V_water</code> and <code className="text-teal-400 font-mono text-[11px]">T = V / Q</code>) to calculate exact hours and minutes remaining, projecting future threshold crossing times without guessing.
            </p>
          </div>

          {/* 3. Dual-Cylinder Backup Management */}
          <div className="p-5 rounded-2xl bg-[#080d1a] border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm text-indigo-300">
              <Cylinder className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>3. Dual-Cylinder Automated Failover</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Maintains an active Primary Cylinder (A-1) alongside a cold standby Backup Cylinder (B-2). Upon reaching a configurable safety threshold (default 10%), the system automatically switches to the backup with zero delivery drop.
            </p>
          </div>

          {/* 4. Conceptual Five-Minute Reserve Buffer */}
          <div className="p-5 rounded-2xl bg-[#080d1a] border border-amber-500/40 bg-amber-950/10 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm text-amber-300">
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
              <span>4. Conceptual 5-Minute Reserve Buffer</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              The original OXYSYNC engineering concept: a secondary 12.5-liter internal reservoir designed to provide up to 5 minutes of temporary continuity while a caregiver locates and mounts a fresh replacement cylinder.
            </p>
          </div>

          {/* 5. Caregiver Alert System */}
          <div className="p-5 rounded-2xl bg-[#080d1a] border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm text-rose-300">
              <Bell className="w-4 h-4 text-rose-400 shrink-0" />
              <span>5. Caregiver Alert System</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Translates complex sensor measurements into intuitive, reassuring messages on family smartphones and hospital workstations, triggering visual warnings and IEC 60601-1-8 medical audio alarms.
            </p>
          </div>

          {/* 6. Integrated Monitoring Dashboard */}
          <div className="p-5 rounded-2xl bg-[#080d1a] border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm text-cyan-300">
              <Cpu className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>6. Integrated Monitoring Dashboard</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Combines 60 FPS plethysmograph waveform visualization, interactive manifold status, predictive depletion curves, and compliance audit reporting into one unified glassmorphism interface.
            </p>
          </div>

        </div>
      </div>

      {/* Hardware vs Software Engineering Distinction */}
      <div className="bg-[#0c1220]/80 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Distinction: Software Prototype vs Proposed Physical Hardware
          </h2>
          <span className="text-xs font-mono text-amber-300 px-2 py-0.5 rounded bg-amber-950 border border-amber-700">
            TRANSPARENCY STANDARD
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          
          {/* Software Prototype */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-cyan-500/30 space-y-2.5">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
              <Laptop className="w-4 h-4" />
              <span>CURRENT SOFTWARE PROTOTYPE</span>
            </div>
            <ul className="space-y-1.5 text-slate-300 font-mono text-[11px]">
              <li className="flex items-start gap-1.5">
                <span className="text-cyan-400 font-bold">✓</span>
                <span>Deterministic Boyle\'s Gas Law simulation engine</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-cyan-400 font-bold">✓</span>
                <span>Real-time React 18 + TypeScript + Recharts application</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-cyan-400 font-bold">✓</span>
                <span>Synthesized Web Audio API medical alarm tones</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-cyan-400 font-bold">✓</span>
                <span>HTML5 Canvas 60 FPS plethysmograph waveform generator</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-cyan-400 font-bold">✓</span>
                <span>Browser Notification API demo alerts</span>
              </li>
            </ul>
          </div>

          {/* Physical Hardware Roadmap */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-teal-500/30 space-y-2.5">
            <div className="flex items-center gap-2 text-teal-400 font-bold text-sm">
              <Microchip className="w-4 h-4" />
              <span>PROPOSED MECHATRONIC HARDWARE</span>
            </div>
            <ul className="space-y-1.5 text-slate-300 font-mono text-[11px]">
              <li className="flex items-start gap-1.5">
                <span className="text-teal-400 font-bold">→</span>
                <span>ESP32-S3 Dual-Core Xtensa Microcontroller</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-teal-400 font-bold">→</span>
                <span>Honeywell 0-200 Bar Piezoresistive Pressure Transducers</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-teal-400 font-bold">→</span>
                <span>Bürkert 12V Latching Solenoid Valves (Zero-Heat)</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-teal-400 font-bold">→</span>
                <span>Sensirion SFM3000 Mass Flow Meter (0-20 L/min)</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-teal-400 font-bold">→</span>
                <span>Machined 6061-T6 Aluminum High-Pressure Manifold Block</span>
              </li>
            </ul>
          </div>

        </div>

        <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-300 text-[11px] font-mono leading-relaxed">
          <strong>Mandatory Exhibition Note:</strong> The five-minute reserve duration is a conceptual design benchmark. Physical deployment requires ISO 80601-2-69 medical respiratory compliance, biocompatibility certification (ISO 18562), and rigorous pressure cycle endurance validation.
        </div>
      </div>

    </div>
  );
};
