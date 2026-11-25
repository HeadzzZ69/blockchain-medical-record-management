import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWeb3 } from '../../context/Web3Context';
import api from '../../services/api';
import { Stethoscope, CheckCircle, AlertCircle } from 'lucide-react';
import { Toast } from '../../components/Modal';

export default function RegisterDoctor() {
  const { contract } = useWeb3();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    walletAddress: '',
    name: '',
    specialization: '',
    licenseNumber: '',
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
      setToast({ message: '1/2 Prompting MetaMask to register Doctor on smart contract...', type: 'info' });

      // Call Smart Contract: registerDoctor(address, name)
      const tx = await contract.registerDoctor(formData.walletAddress.trim(), formData.name.trim());
      setToast({ message: 'Waiting for blockchain transaction confirmation...', type: 'info' });
      await tx.wait();

      setToast({ message: '2/2 Saving doctor record in database...', type: 'info' });

      // Save to backend
      await api.post('/users/register', {
        walletAddress: formData.walletAddress.trim(),
        name: formData.name.trim(),
        role: 'doctor',
        specialization: formData.specialization.trim(),
        licenseNumber: formData.licenseNumber.trim(),
      });

      setToast({ message: 'Doctor registered successfully on blockchain!', type: 'success' });
      setTimeout(() => {
        navigate('/admin/users');
      }, 1500);
    } catch (err) {
      console.error('Doctor registration error:', err);
      setToast({ message: err.reason || err.message || 'Registration failed', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Register Doctor</h1>
        <p className="text-xs text-slate-500 mt-1">
          Assign verified Doctor role to a medical practitioner wallet address on the smart contract.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Doctor Wallet Address <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.walletAddress}
              onChange={(e) => setFormData({ ...formData, walletAddress: e.target.value })}
              placeholder="0x..."
              className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Doctor Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Dr. Sarah Jenkins"
              className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Specialization
            </label>
            <input
              type="text"
              value={formData.specialization}
              onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
              placeholder="e.g. Cardiology, Orthopedics, Radiology"
              className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Medical License Number
            </label>
            <input
              type="text"
              value={formData.licenseNumber}
              onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
              placeholder="e.g. LIC-DOC-9874"
              className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-4 py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Stethoscope className="w-4 h-4" />
            {isLoading ? 'Authorizing on Blockchain...' : 'Register Doctor on Blockchain'}
          </button>
        </form>
      </div>

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />
    </div>
  );
}
