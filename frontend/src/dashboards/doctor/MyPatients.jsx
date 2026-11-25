import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWeb3 } from '../../context/Web3Context';
import api from '../../services/api';
import { Users, FileText, ArrowRight, Search, ShieldCheck } from 'lucide-react';

export default function MyPatients() {
  const { account } = useWeb3();
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPatients();
  }, [account]);

  const loadPatients = async () => {
    try {
      setIsLoading(true);
      const { data } = await api.get('/audit/logs');
      const events = data.blockchainEvents || [];

      // Find all patients who granted access to this doctor
      const patientMap = {};
      events.forEach((ev) => {
        if (ev.requester?.toLowerCase() === account?.toLowerCase() && ev.type === 'AccessGranted') {
          patientMap[ev.patient.toLowerCase()] = {
            wallet: ev.patient,
            lastAccessDate: ev.timestamp,
          };
        }
      });

      // Fetch user details for each patient
      const patientList = Object.values(patientMap);
      const enriched = await Promise.all(
        patientList.map(async (p) => {
          try {
            const res = await api.get(`/users/${p.wallet}`);
            return {
              ...p,
              name: res.data.user?.name || 'Registered Patient',
              email: res.data.user?.email || '',
            };
          } catch {
            return { ...p, name: 'Registered Patient' };
          }
        })
      );

      setPatients(enriched);
    } catch (err) {
      console.error('Error loading patients:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.wallet.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Authorized Patients</h1>
          <p className="text-xs text-slate-500 mt-1">
            List of patients who have granted your wallet active access on the blockchain.
          </p>
        </div>
        <Link
          to="/doctor/request-access"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-medical-600 hover:bg-medical-700 text-white font-semibold text-xs shadow-sm transition"
        >
          Request New Patient Access
        </Link>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200">
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
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-medical-600 mx-auto"></div>
            <p className="text-xs text-slate-500 mt-2">Loading authorized patients...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-700">No Authorized Patients Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              No patients have granted access to your doctor wallet address yet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 uppercase font-semibold text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Patient Name</th>
                  <th className="px-6 py-3.5">Wallet Address</th>
                  <th className="px-6 py-3.5">Authorization Status</th>
                  <th className="px-6 py-3.5">Granted Date</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((p) => (
                  <tr key={p.wallet} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4 font-semibold text-slate-900">{p.name}</td>
                    <td className="px-6 py-4 font-mono text-slate-600">{p.wallet}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                        <ShieldCheck className="w-3 h-3" /> On-Chain Consent
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(p.lastAccessDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/doctor/records?patient=${p.wallet}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 font-semibold text-xs transition"
                      >
                        <FileText className="w-3.5 h-3.5" /> View Records
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
