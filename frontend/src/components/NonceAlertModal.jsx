import React from 'react';
import { AlertCircle, RotateCcw, X, ShieldAlert, ExternalLink, HelpCircle } from 'lucide-react';

export default function NonceAlertModal({ isOpen, onClose, onRetry, details }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-5 animate-in fade-in duration-200">
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200 shrink-0">
            <AlertCircle className="w-6 h-6" />
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full inline-block mb-1.5">
            Local Blockchain Nonce Desync
          </span>
          <h3 className="text-lg font-bold text-slate-900">
            MetaMask Transaction Count Desynchronized
          </h3>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            Your local Hardhat blockchain restarted, but MetaMask still remembers a higher transaction count from an earlier session.
          </p>
        </div>

        {details && (
          <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 text-[11px] font-mono text-amber-900">
            {details}
          </div>
        )}

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs text-slate-700">
          <p className="font-bold text-slate-900 flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-sky-600" /> How to fix in 5 seconds:
          </p>
          <ol className="list-decimal list-inside space-y-1 text-slate-600 leading-relaxed pl-1">
            <li>Open the <strong>MetaMask</strong> browser extension.</li>
            <li>Click the <strong>Account Circle icon</strong> (top-right) &rarr; <strong>Settings</strong>.</li>
            <li>Click <strong>Advanced</strong>.</li>
            <li>Scroll down and click <strong>"Clear activity tab data"</strong> (or "Reset account").</li>
          </ol>
          <p className="text-[11px] text-slate-500 italic pt-1">
            Note: This only clears local testnet transaction queue cache; your ETH balance and private keys are never altered.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
          {onRetry && (
            <button
              onClick={() => {
                onClose();
                onRetry();
              }}
              className="flex-1 px-4 py-2.5 rounded-xl bg-medical-600 hover:bg-medical-700 text-white font-semibold text-xs shadow-sm transition flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" /> Try Transaction Again
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition flex items-center justify-center"
          >
            I Cleared Activity Data &bull; Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
