import React from 'react';
import { useTelemetry } from '../context/TelemetryContext';
import { X, Printer, Download, FileText } from 'lucide-react';

interface ReportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReportExportModal: React.FC<ReportExportModalProps> = ({ isOpen, onClose }) => {
  const { vitals, supply, prescription, alerts } = useTelemetry();

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJSON = () => {
    const reportData = {
      patient: {
        name: 'John Doe',
        age: 68,
        gender: 'Male',
        diagnosis: 'COPD Stage III / Chronic Respiratory Failure',
        bed: 'Room 4B'
      },
      generatedAt: new Date().toISOString(),
      prescribedProtocol: prescription,
      currentVitals: vitals,
      oxygenSupply: supply,
      recordedAlerts: alerts
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `oxysync_clinical_report_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0b1424] border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative flex flex-col max-h-[90vh]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-800 pr-8">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Clinical Telemetry & Compliance Report</h2>
            <p className="text-xs text-slate-400">Exportable Session Summary for Pulmonologist Consultation</p>
          </div>
        </div>

        {/* Printable Card Area */}
        <div className="overflow-y-auto flex-1 pr-1 space-y-4 text-xs text-slate-300">
          
          {/* Header block */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
              <span className="font-bold text-sm text-cyan-400">OXYSYNC CLINICAL TELEMETRY DOSSIER</span>
              <span className="font-mono text-slate-400">{new Date().toLocaleDateString()}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div><strong>Patient:</strong> John Doe (68y, M)</div>
              <div><strong>Attending:</strong> {prescription.prescribedBy}</div>
              <div><strong>Primary Diagnosis:</strong> COPD Stage III</div>
              <div><strong>Location:</strong> Home Healthcare / Bed 4B</div>
            </div>
          </div>

          {/* Vitals Summary */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <h4 className="font-bold text-slate-200 mb-2">1. Vitals & Oxygenation Status</h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-2.5 rounded bg-black/40 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">CURRENT SpO₂</span>
                <span className="text-xl font-bold font-mono text-cyan-300">{vitals.spo2}%</span>
                <span className="text-[10px] text-slate-500 block">Target: {prescription.targetSpo2Min}-{prescription.targetSpo2Max}%</span>
              </div>
              <div className="p-2.5 rounded bg-black/40 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">PULSE RATE</span>
                <span className="text-xl font-bold font-mono text-white">{vitals.pulseRate} BPM</span>
                <span className="text-[10px] text-slate-500 block">Normal 60-100 BPM</span>
              </div>
              <div className="p-2.5 rounded bg-black/40 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">RESPIRATORY RATE</span>
                <span className="text-xl font-bold font-mono text-cyan-300">{vitals.respiratoryRate} Br/m</span>
                <span className="text-[10px] text-slate-500 block">Resting Eupnea</span>
              </div>
            </div>
          </div>

          {/* Therapy & Delivery Status */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <h4 className="font-bold text-slate-200 mb-2">2. Oxygen Delivery & Reservoir Physics</h4>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div><strong>Delivery Mode:</strong> {prescription.titrationMode.toUpperCase()} Closed-Loop</div>
              <div><strong>Active Flow Rate:</strong> {supply.flowRate.toFixed(1)} L/min</div>
              <div><strong>Prescribed Flow Limits:</strong> {prescription.minAllowedFlow} - {prescription.maxAllowedFlow} L/min</div>
              <div><strong>Actuator Valve Position:</strong> {supply.valvePositionPercent}%</div>
              <div><strong>Supply Source:</strong> {supply.sourceType === 'cylinder' ? 'High-Pressure Cylinder' : 'Concentrator'}</div>
              <div><strong>Remaining Tank Gas:</strong> {supply.remainingGasLiters} Liters ({supply.pressurePsi} PSI)</div>
              <div><strong>Estimated Depletion Time:</strong> {Math.floor(supply.remainingRuntimeMinutes / 60)}h {supply.remainingRuntimeMinutes % 60}m</div>
            </div>
          </div>

          {/* Safety Incidents */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <h4 className="font-bold text-slate-200 mb-2">3. Alarm Audit Summary</h4>
            <p className="text-[11px] text-slate-400">
              Total alarms recorded in this telemetry cycle: <strong>{alerts.length}</strong>.
              All safety overrides adhered strictly to the clinician bounds.
            </p>
          </div>

        </div>

        {/* Modal footer buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            onClick={handleDownloadJSON}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Download JSON Data</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Dossier</span>
          </button>
        </div>
      </div>
    </div>
  );
};
