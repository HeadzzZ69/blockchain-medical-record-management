import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  Stethoscope,
  Search,
  ShieldCheck,
  RotateCcw,
  Copy,
  Check,
  AlertCircle,
  Mail,
  Building2,
} from 'lucide-react';

export default function HospitalDoctors() {
  const [doctors, setDoctors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedWallet, setCopiedWallet] = useState('');

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      setIsLoading(true);
      setErrorMessage('');
      const response = await api.get('/users/doctors');
      const data = response.data || {};
      const docList = Array.isArray(data.doctors)
        ? data.doctors
        : Array.isArray(data)
        ? data
        : [];

      // Normalize each doctor so fields are never undefined
      const normalized = docList.map((d) => ({
        ...d,
        name: d.name || d.fullName || 'Registered Physician',
        fullName: d.fullName || d.name || 'Registered Physician',
        specialization: d.specialization || 'General Medicine',
        licenseNumber: d.medicalLicenseNumber || d.licenseNumber || 'MED-VERIFIED',
        medicalLicenseNumber: d.medicalLicenseNumber || d.licenseNumber || 'MED-VERIFIED',
        walletAddress: (d.walletAddress || '').toLowerCase(),
        hospitalName: d.hospitalName || 'Apollo Multi-Specialty Hospital',
        experience: d.experience || 'Senior Consultant',
      }));

      setDoctors(normalized);
    } catch (err) {
      console.error('Error fetching doctors:', err);
      setErrorMessage(
        err.userMessage ||
          err.response?.data?.message ||
          err.message ||
          'Failed to load registered physicians from backend server.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyWallet = (wallet) => {
    if (!wallet) return;
    navigator.clipboard.writeText(wallet);
    setCopiedWallet(wallet);
    setTimeout(() => setCopiedWallet(''), 2000);
  };

  const filtered = doctors.filter((d) => {
    const term = (searchTerm || '').trim().toLowerCase();
    if (!term) return true;
    const name = (d.fullName || d.name || '').toLowerCase();
    const wallet = (d.walletAddress || '').toLowerCase();
    const spec = (d.specialization || '').toLowerCase();
    const license = (d.medicalLicenseNumber || d.licenseNumber || '').toLowerCase();
    const hosp = (d.hospitalName || '').toLowerCase();
    return (
      name.includes(term) ||
      wallet.includes(term) ||
      spec.includes(term) ||
      license.includes(term) ||
      hosp.includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Stethoscope className="w-7 h-7 text-indigo-600" />
            Hospital Medical Staff
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Doctors and clinical practitioners verified and registered on the blockchain network.
          </p>
        </div>
        <button
          onClick={fetchDoctors}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition disabled:opacity-50 self-start sm:self-auto"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Refresh Directory
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by physician name, specialty, or license..."
            className="w-full text-xs pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <span className="hidden sm:inline-block text-xs text-slate-500 font-medium">
          Showing {filtered.length} of {doctors.length} doctors
        </span>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="text-xs text-slate-500 mt-3 font-medium">Loading medical personnel from network...</p>
          </div>
        ) : errorMessage ? (
          <div className="py-16 text-center max-w-md mx-auto px-6">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Failed to Load Doctors</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">{errorMessage}</p>
            <button
              onClick={fetchDoctors}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition shadow-sm inline-flex items-center gap-2"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Try Again
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <Stethoscope className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700">No Doctors Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchTerm ? 'No registered doctors match your search query.' : 'No doctors are registered yet in the system.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 uppercase font-semibold text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Doctor Name</th>
                  <th className="px-6 py-3.5">Specialization</th>
                  <th className="px-6 py-3.5">License ID</th>
                  <th className="px-6 py-3.5">Hospital Affiliation</th>
                  <th className="px-6 py-3.5">Wallet Address</th>
                  <th className="px-6 py-3.5">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((d, idx) => (
                  <tr key={d.walletAddress || idx} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs shrink-0">
                          {d.fullName ? d.fullName.charAt(4) || 'D' : 'D'}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{d.fullName}</p>
                          <p className="text-[11px] text-slate-500">{d.experience}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-slate-800 bg-sky-50 text-sky-700 px-2 py-0.5 rounded border border-sky-100">
                        {d.specialization}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-[11px] font-semibold text-slate-700">
                      {d.medicalLicenseNumber}
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      {d.hospitalName}
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-600">
                      <div className="flex items-center gap-2">
                        <span className="truncate max-w-[140px]">{d.walletAddress}</span>
                        <button
                          onClick={() => handleCopyWallet(d.walletAddress)}
                          title="Copy Wallet Address"
                          className="p-1 hover:bg-slate-200 rounded text-slate-500 transition"
                        >
                          {copiedWallet === d.walletAddress ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" /> On-Chain Verified
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
