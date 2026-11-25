import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';
import api from '../services/api';
import { UserCheck, ShieldCheck, AlertCircle, CheckCircle } from 'lucide-react';

export default function RegisterPage() {
  const { account, contract, setUserRole, fetchMe, executeTx, isTxPending } = useWeb3();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!account) {
      setErrorMsg('Please connect your MetaMask wallet first.');
      return;
    }
    if (!formData.name.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMsg('');
      setSuccessMsg('1/2 Confirming registration on smart contract...');

      // 1. Call Smart Contract: registerPatient(name)
      if (contract) {
        await executeTx(async (c) => {
          return await c.registerPatient(formData.name);
        });
      }

      setSuccessMsg('2/2 Saving profile to secure database...');

      // 2. Register profile in backend
      await api.post('/users/register', {
        walletAddress: account,
        name: formData.name,
        email: formData.email,
        role: 'patient',
      });

      setUserRole('patient');
      await fetchMe();

      setSuccessMsg('Registration complete! Redirecting to Patient Dashboard...');
      setTimeout(() => {
        navigate('/patient');
      }, 1500);
    } catch (err) {
      console.error('Registration failed:', err);
      setErrorMsg(err.reason || err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 bg-slate-50">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-xl p-8">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto mb-6">
          <UserCheck className="w-7 h-7" />
        </div>

        <h2 className="text-2xl font-bold text-slate-900 text-center">Patient Self-Registration</h2>
        <p className="text-xs text-slate-500 text-center mt-2">
          Anchor your identity on the MedicalRecordAccess smart contract and create your patient profile.
        </p>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Connected Wallet</label>
            <input
              type="text"
              readOnly
              value={account || 'Not connected'}
              className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-600 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. John Doe"
              className="w-full text-sm bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-medical-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email (Optional)</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="e.g. john@example.com"
              className="w-full text-sm bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-medical-500"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || isTxPending || !account}
            className="w-full mt-4 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading || isTxPending ? 'Processing on Blockchain...' : 'Register on Blockchain'}
          </button>
        </form>
      </div>
    </div>
  );
}
