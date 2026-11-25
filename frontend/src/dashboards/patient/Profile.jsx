import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../../context/Web3Context';
import api from '../../services/api';
import { User, ShieldCheck, Mail, Wallet, CheckCircle, AlertCircle } from 'lucide-react';
import { Toast } from '../../components/Modal';

export default function Profile() {
  const { account, userProfile, fetchMe, contractAddress } = useWeb3();
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
      });
      await fetchMe();
      setToast({ message: 'Profile updated successfully!', type: 'success' });
    } catch (err) {
      setToast({ message: 'Failed to update profile.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">User Profile</h1>
        <p className="text-xs text-slate-500 mt-1">
          Review your connected wallet credentials and on-chain verification credentials.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
          <div className="w-16 h-16 rounded-2xl bg-medical-50 text-medical-600 flex items-center justify-center font-bold text-2xl border border-medical-200">
            {name ? name.charAt(0).toUpperCase() : 'P'}
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">{name || 'Patient'}</h3>
            <span className="inline-flex items-center gap-1 mt-1 text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-800">
              <CheckCircle className="w-3.5 h-3.5" /> Verified on Smart Contract
            </span>
          </div>
        </div>

        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Connected Wallet Address
            </label>
            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 font-mono text-xs text-slate-700">
              <Wallet className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="truncate">{account}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Deployed Smart Contract
            </label>
            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 font-mono text-xs text-slate-700">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="truncate">{contractAddress}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-medical-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. user@example.com"
              className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-medical-500"
            />
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-medical-600 hover:bg-medical-700 text-white font-semibold text-xs shadow-md transition disabled:opacity-50"
          >
            {isSaving ? 'Updating...' : 'Save Profile Changes'}
          </button>
        </form>
      </div>

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />
    </div>
  );
}
