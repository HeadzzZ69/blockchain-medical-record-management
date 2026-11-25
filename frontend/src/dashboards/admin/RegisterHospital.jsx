import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWeb3 } from '../../context/Web3Context';
import api from '../../services/api';
import { Building2, CheckCircle } from 'lucide-react';
import { Toast } from '../../components/Modal';

export default function RegisterHospital() {
  const { contract, executeTx, isTxPending } = useWeb3();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    walletAddress: '',
    name: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!contract) {
      setToast({ message: 'Smart contract not loaded', type: 'error' });
      return;
    }

    try {
      setIsLoading(true);
      setToast({ message: '1/2 Prompting MetaMask to register Hospital on smart contract...', type: 'info' });

      // Call Smart Contract: registerHospital(address, name)
      await executeTx(async (c) => {
        return await c.registerHospital(formData.walletAddress.trim(), formData.name.trim());
      });

      setToast({ message: '2/2 Storing institutional metadata in database...', type: 'info' });
      await api.post('/users/register', {
        walletAddress: formData.walletAddress.trim(),
        name: formData.name.trim(),
        role: 'hospital',
      });

      setToast({ message: 'Hospital registered successfully on blockchain!', type: 'success' });
      setTimeout(() => {
        navigate('/admin/users');
      }, 1500);
    } catch (err) {
      console.error('Hospital registration error:', err);
      setToast({ message: err.reason || err.message || 'Registration failed', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Register Hospital Facility</h1>
        <p className="text-xs text-slate-500 mt-1">
          Authorize healthcare institution wallet address on the MedicalRecordAccess smart contract.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Hospital Wallet Address <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.walletAddress}
              onChange={(e) => setFormData({ ...formData, walletAddress: e.target.value })}
              placeholder="0x..."
              className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Hospital / Clinic Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Metro Multispecialty Hospital"
              className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || isTxPending}
            className="w-full mt-4 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Building2 className="w-4 h-4" />
            {isLoading || isTxPending ? 'Authorizing on Blockchain...' : 'Register Hospital on Blockchain'}
          </button>
        </form>
      </div>

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />
    </div>
  );
}
