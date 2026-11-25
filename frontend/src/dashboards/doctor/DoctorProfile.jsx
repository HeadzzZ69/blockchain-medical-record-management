import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../../context/Web3Context';
import api from '../../services/api';
import { Stethoscope, CheckCircle, Wallet, ShieldCheck } from 'lucide-react';
import { Toast } from '../../components/Modal';

const getInitials = (name, fallback = 'DR') => {
  if (typeof name !== 'string' || !name.trim()) {
    return fallback;
  }
  const clean = name.replace(/^Dr\.\s*/i, '').trim();
  const parts = (clean || name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return fallback;
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
};

export default function DoctorProfile() {
  const { account, userProfile, fetchMe, contractAddress } = useWeb3();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name || '');
      setEmail(userProfile.email || '');
      setSpecialization(userProfile.specialization || '');
      setLicenseNumber(userProfile.licenseNumber || '');
    }
  }, [userProfile]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await api.post('/users/register', {
        walletAddress: account,
        name,
        email,
        role: 'doctor',
        specialization,
        licenseNumber,
      });
      await fetchMe();
      setToast({ message: 'Doctor credentials updated successfully!', type: 'success' });
    } catch (err) {
      setToast({ message: 'Failed to update credentials.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Doctor Profile & Credentials</h1>
        <p className="text-xs text-slate-500 mt-1">
          Verified medical practitioner credentials registered on the blockchain network.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
          <div className="w-16 h-16 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xl border border-sky-200 shrink-0">
            {getInitials(name || 'Physician', 'DR')}
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Dr. {name || 'Physician'}</h3>
            <p className="text-xs text-slate-500">{specialization || 'Clinical Specialist'}</p>
            <span className="inline-flex items-center gap-1 mt-1 text-xs px-2.5 py-0.5 rounded-full font-semibold bg-sky-100 text-sky-800">
              <CheckCircle className="w-3.5 h-3.5" /> Verified by System Admin on Smart Contract
            </span>
          </div>
        </div>

        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Registered Doctor Wallet
            </label>
            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 font-mono text-xs text-slate-700">
              <Wallet className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="truncate">{account}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Doctor Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-medical-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Medical Specialization
            </label>
            <input
              type="text"
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              placeholder="e.g. Cardiology, Neurology, Pediatrics"
              className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-medical-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Medical Council License ID
            </label>
            <input
              type="text"
              value={licenseNumber}
              onChange={(e) => setLicenseNumber(e.target.value)}
              placeholder="e.g. MED-LIC-2026-9812"
              className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-medical-500"
            />
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-medical-600 hover:bg-medical-700 text-white font-semibold text-xs shadow-md transition disabled:opacity-50"
          >
            {isSaving ? 'Updating...' : 'Save Credentials'}
          </button>
        </form>
      </div>

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />
    </div>
  );
}
