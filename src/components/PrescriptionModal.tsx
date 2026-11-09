import React, { useState } from 'react';
import { useTelemetry } from '../context/TelemetryContext';
import { X, Lock, Unlock, ShieldAlert, Check } from 'lucide-react';

interface PrescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrescriptionModal: React.FC<PrescriptionModalProps> = ({ isOpen, onClose }) => {
  const { prescription, updatePrescription } = useTelemetry();

  const [passcode, setPasscode] = useState<string>('');
  const [unlocked, setUnlocked] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [targetMin, setTargetMin] = useState<number>(prescription.targetSpo2Min);
  const [targetMax, setTargetMax] = useState<number>(prescription.targetSpo2Max);
  const [flowMin, setFlowMin] = useState<number>(prescription.minAllowedFlow);
  const [flowMax, setFlowMax] = useState<number>(prescription.maxAllowedFlow);
  const [notes, setNotes] = useState<string>(prescription.notes);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === prescription.passcode) {
      setUnlocked(true);
      setError('');
    } else {
      setError('Invalid clinician PIN. Default authorized PIN is 1234.');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (targetMin >= targetMax) {
      setError('Target SpO₂ Min must be less than Target SpO₂ Max.');
      return;
    }
    if (flowMin >= flowMax) {
      setError('Minimum flow rate must be strictly less than maximum flow rate.');
      return;
    }

    const success = updatePrescription({
      targetSpo2Min: targetMin,
      targetSpo2Max: targetMax,
      minAllowedFlow: flowMin,
      maxAllowedFlow: flowMax,
      notes
    }, passcode);

    if (success) {
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 1000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0b1424] border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
            {unlocked ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Physician Prescription Gate</h2>
            <p className="text-xs text-slate-400">
              Validated Safe Flow Titration Boundaries & Clinical Targets
            </p>
          </div>
        </div>

        {!unlocked ? (
          /* Lock Gate PIN Screen */
          <form onSubmit={handleUnlock} className="space-y-4">
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
              <div className="flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>
                  Adjusting patient oxygen boundaries requires physician credentials. Enter the clinician security PIN to modify titration limits. (Demo PIN: <strong>1234</strong>)
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Clinician 4-Digit Passcode
              </label>
              <input
                type="password"
                maxLength={6}
                value={passcode}
                onChange={e => setPasscode(e.target.value)}
                placeholder="Enter PIN..."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-center tracking-widest text-lg focus:outline-none focus:border-cyan-400"
                autoFocus
              />
            </div>

            {error && <div className="text-xs text-rose-400 text-center font-semibold">{error}</div>}

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm transition-colors"
            >
              Authenticate Clinician
            </button>
          </form>
        ) : (
          /* Authorized Editing Form */
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Target SpO₂ Min (%)
                </label>
                <input
                  type="number"
                  min="80"
                  max="98"
                  value={targetMin}
                  onChange={e => setTargetMin(parseInt(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Target SpO₂ Max (%)
                </label>
                <input
                  type="number"
                  min="85"
                  max="100"
                  value={targetMax}
                  onChange={e => setTargetMax(parseInt(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Min Allowed Flow (L/min)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="5.0"
                  value={flowMin}
                  onChange={e => setFlowMin(parseFloat(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Max Allowed Flow (L/min)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="1.0"
                  max="10.0"
                  value={flowMax}
                  onChange={e => setFlowMax(parseFloat(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Clinical Prescription Notes
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
              />
            </div>

            {error && <div className="text-xs text-rose-400 font-semibold">{error}</div>}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setUnlocked(false)}
                className="w-1/2 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs hover:bg-slate-700 transition-colors"
              >
                Cancel & Re-lock
              </button>

              <button
                type="submit"
                className="w-1/2 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                {saveSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-950" />
                    <span>Prescription Updated!</span>
                  </>
                ) : (
                  <span>Save & Apply Protocol</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
