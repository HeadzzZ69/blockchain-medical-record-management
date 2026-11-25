import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../../context/Web3Context';
import api from '../../services/api';
import { Building2, CheckCircle, Wallet } from 'lucide-react';
import { Toast } from '../../components/Modal';

export default function HospitalProfile() {
  const { account, userProfile, fetchMe } = useWeb3();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name || '');
      setEmail(userProfile.email || '');
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
        role: 'hospital',
      });
      await fetchMe();
      setToast({ message: 'Hospital profile updated successfully!', type: 'success' });
    } catch (err) {
      setToast({ message: 'Failed to update hospital profile.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Hospital Facility Profile</h1>
        <p className="text-xs text-slate-500 mt-1">
          Registered healthcare institution credentials verified on the smart contract.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-2xl border border-indigo-200">
            <Building2 className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">{name || 'Hospital Facility'}</h3>
            <span className="inline-flex items-center gap-1 mt-1 text-xs px-2.5 py-0.5 rounded-full font-semibold bg-indigo-100 text-indigo-800">
              <CheckCircle className="w-3.5 h-3.5" /> Verified by System Admin on Smart Contract
            </span>
          </div>
        </div>

        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Hospital Wallet Address
            </label>
            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 font-mono text-xs text-slate-700">
              <Wallet className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="truncate">{account}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Hospital / Clinic Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-medical-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Institutional Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-medical-500"
            />
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md transition disabled:opacity-50"
          >
            {isSaving ? 'Updating...' : 'Save Hospital Profile'}
          </button>
        </form>
      </div>

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />
    </div>
  );
}
