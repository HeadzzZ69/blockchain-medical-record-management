import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../../context/Web3Context';
import api from '../../services/api';
import { Users, ShieldCheck, Search, RotateCcw, AlertCircle, Copy, Check } from 'lucide-react';

export default function HospitalPatients() {
  const { account } = useWeb3();
  const [patients, setPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedWallet, setCopiedWallet] = useState('');

  useEffect(() => {
    fetchHospitalPatients();
  }, [account]);

  const fetchHospitalPatients = async () => {
    if (!account) return;
    try {
      setIsLoading(true);
      setErrorMessage('');

      const [auditRes, clinicalRes] = await Promise.all([
        api.get('/audit/logs').catch(() => ({ data: { blockchainEvents: [] } })),
        api.get(`/clinical/hospital-stats/${account}`).catch(() => ({ data: { stats: {} } })),
      ]);

      const events = auditRes.data?.blockchainEvents || [];
      const pMap = {};

      events.forEach((ev) => {
        if (!ev || !ev.patient) return;
        if (ev.requester?.toLowerCase() === account?.toLowerCase() && ev.type === 'AccessGranted') {
          pMap[ev.patient.toLowerCase()] = {
            wallet: ev.patient,
            timestamp: ev.timestamp || new Date(),
            recordId: ev.recordId || '',
          };
        }
      });

      // Also check clinical summary for pre-seeded consenting patients
      const clinicalPatients = clinicalRes.data?.stats?.accessibleRecords || [];
      clinicalPatients.forEach((rec) => {
        if (rec.patientWallet && !pMap[rec.patientWallet.toLowerCase()]) {
          pMap[rec.patientWallet.toLowerCase()] = {
            wallet: rec.patientWallet,
            timestamp: rec.uploadDate || new Date(),
            recordId: rec.recordId || '',
          };
        }
      });

      const list = Object.values(pMap);
      const enriched = await Promise.all(
        list.map(async (p) => {
          try {
            const u = await api.get(`/users/${p.wallet}`);
            const userData = u.data?.user || {};
            return {
              ...p,
              name: userData.fullName || userData.name || 'Registered Patient',
              email: userData.email || '',
              role: userData.role || 'patient',
            };
          } catch {
            return { ...p, name: 'Registered Patient', email: '', role: 'patient' };
          }
        })
      );

      setPatients(enriched);
    } catch (err) {
      console.error('Error fetching hospital patients:', err);
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
            <Users className="w-7 h-7 text-indigo-600" />
            Hospital Authorized Patients
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Patients who have delegated medical consent to this healthcare facility.
          </p>
        </div>
        <button
          onClick={fetchHospitalPatients}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition disabled:opacity-50 self-start sm:self-auto"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Refresh Patients
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by patient name or wallet..."
            className="w-full text-xs pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <span className="hidden sm:inline-block text-xs text-slate-500 font-medium">
          {filtered.length} consenting patients
        </span>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
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
              onClick={fetchHospitalPatients}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition shadow-sm inline-flex items-center gap-2"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Try Again
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-700">No Patients Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchTerm ? 'No consenting patients match your query.' : 'Once a patient grants consent to this hospital on the blockchain, they will appear here.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 uppercase font-semibold text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Patient Name</th>
                  <th className="px-6 py-3.5">Wallet Address</th>
                  <th className="px-6 py-3.5">Authorized Record</th>
                  <th className="px-6 py-3.5">Consent Status</th>
                  <th className="px-6 py-3.5">Consent Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((p, idx) => (
                  <tr key={p.wallet || idx} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                          {p.name?.charAt(0) || 'P'}
                        </div>
                        <span>{p.name}</span>
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
                    <td className="px-6 py-4 font-mono text-[11px] text-slate-700">
                      {p.recordId || 'ALL-RECORDS'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" /> Authorized
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {p.timestamp ? new Date(p.timestamp).toLocaleDateString() : 'Active'}
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
