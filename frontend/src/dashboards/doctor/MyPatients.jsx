import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWeb3 } from '../../context/Web3Context';
import api from '../../services/api';
import { Users, FileText, ArrowRight, Search, ShieldCheck, RotateCcw, AlertCircle, Copy, Check } from 'lucide-react';

const getInitials = (name, fallback = 'PT') => {
  if (typeof name !== 'string' || !name.trim()) {
    return fallback;
  }
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return fallback;
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
};

export default function MyPatients() {
  const { account } = useWeb3();
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedWallet, setCopiedWallet] = useState('');

  useEffect(() => {
    loadPatients();
  }, [account]);

  const loadPatients = async () => {
    if (!account) return;
    try {
      setIsLoading(true);
      setErrorMessage('');

      const [auditRes, clinicalRes] = await Promise.all([
        api.get('/audit/logs').catch(() => ({ data: { blockchainEvents: [] } })),
        api.get(`/clinical/doctor-stats/${account}`).catch(() => ({ data: { stats: {} } })),
      ]);

      const events = auditRes.data?.blockchainEvents || [];
      const patientMap = {};

      events.forEach((ev) => {
        if (!ev || !ev.patient) return;
        if (ev.requester?.toLowerCase() === account?.toLowerCase() && ev.type === 'AccessGranted') {
          patientMap[ev.patient.toLowerCase()] = {
            wallet: ev.patient,
            lastAccessDate: ev.timestamp || new Date(),
          };
        }
      });

      // Also merge patients from clinical controller stats
      const clinicalPatients = clinicalRes.data?.stats?.accessiblePatients || [];
      clinicalPatients.forEach((p) => {
        const w = (p.walletAddress || p.wallet || '').toLowerCase();
        if (w && !patientMap[w]) {
          patientMap[w] = {
            wallet: w,
            name: p.fullName || p.name || 'Registered Patient',
            bloodGroup: p.bloodGroup || 'O+',
            lastAccessDate: new Date(),
          };
        }
      });

      const patientList = Object.values(patientMap);
      const enriched = await Promise.all(
        patientList.map(async (p) => {
          if (p.name && p.name !== 'Registered Patient') return p;
          try {
            const res = await api.get(`/users/${p.wallet}`);
            const userData = res.data?.user || {};
            return {
              ...p,
              name: userData.fullName || userData.name || 'Registered Patient',
              email: userData.email || '',
              bloodGroup: userData.bloodGroup || p.bloodGroup || 'O+',
            };
          } catch {
            return { ...p, name: p.name || 'Registered Patient' };
          }
        })
      );

      setPatients(enriched);
    } catch (err) {
      console.error('Error loading patients:', err);
      setErrorMessage(
        err.userMessage || err.response?.data?.message || err.message || 'Failed to load authorized patients.'
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

  const filtered = patients.filter((p) => {
    const term = (searchTerm || '').trim().toLowerCase();
    if (!term) return true;
    const name = (p.name || '').toLowerCase();
    const wallet = (p.wallet || '').toLowerCase();
    return name.includes(term) || wallet.includes(term);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-7 h-7 text-sky-600" />
            Authorized Patients
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            List of patients who have granted your physician wallet active access on the blockchain.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={loadPatients}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition disabled:opacity-50"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <Link
            to="/doctor/request-access"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-medical-600 hover:bg-medical-700 text-white font-semibold text-xs shadow-sm transition"
          >
            Request Access
          </Link>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search patient name or wallet..."
            className="w-full text-xs pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-medical-500"
          />
        </div>
        <span className="hidden sm:inline-block text-xs text-slate-500 font-medium">
          {filtered.length} consenting patients
        </span>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-medical-600 mx-auto"></div>
            <p className="text-xs text-slate-500 mt-2">Loading authorized patients...</p>
          </div>
        ) : errorMessage ? (
          <div className="py-16 text-center max-w-md mx-auto px-6">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Failed to Load Patients</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">{errorMessage}</p>
            <button
              onClick={loadPatients}
              className="px-4 py-2 rounded-xl bg-medical-600 hover:bg-medical-700 text-white font-semibold text-xs transition shadow-sm inline-flex items-center gap-2"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Try Again
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-700">No Authorized Patients Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchTerm ? 'No patients match your search.' : 'You do not have any consenting patients yet. Use "Request Access" to request consent.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 uppercase font-semibold text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Patient Name</th>
                  <th className="px-6 py-3.5">Wallet Address</th>
                  <th className="px-6 py-3.5">Blood Group</th>
                  <th className="px-6 py-3.5">Consent Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((p, idx) => (
                  <tr key={p.wallet || idx} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs shrink-0">
                          {getInitials(p?.name, 'PT')}
                        </div>
                        <span>{p?.name || 'Registered Patient'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-600">
                      <div className="flex items-center gap-2">
                        <span className="truncate max-w-[140px]">{p.wallet}</span>
                        <button
                          onClick={() => handleCopyWallet(p.wallet)}
                          title="Copy Wallet"
                          className="p-1 hover:bg-slate-200 rounded text-slate-500 transition"
                        >
                          {copiedWallet === p.wallet ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-700 font-semibold">
                      {p.bloodGroup || 'O+'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" /> Authorized
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/doctor/records?patient=${p.wallet}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 font-semibold text-xs transition"
                      >
                        <FileText className="w-3.5 h-3.5" /> View Records <ArrowRight className="w-3 h-3" />
                      </Link>
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
