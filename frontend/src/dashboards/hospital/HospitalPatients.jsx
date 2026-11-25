import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../../context/Web3Context';
import api from '../../services/api';
import { Users, ShieldCheck, Search } from 'lucide-react';

export default function HospitalPatients() {
  const { account } = useWeb3();
  const [patients, setPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchHospitalPatients();
  }, [account]);

  const fetchHospitalPatients = async () => {
    try {
      setIsLoading(true);
      const { data } = await api.get('/audit/logs');
      const events = data.blockchainEvents || [];

      const pMap = {};
      events.forEach((ev) => {
        if (ev.requester?.toLowerCase() === account?.toLowerCase() && ev.type === 'AccessGranted') {
          pMap[ev.patient.toLowerCase()] = {
            wallet: ev.patient,
            timestamp: ev.timestamp,
            recordId: ev.recordId,
          };
        }
      });

      const list = Object.values(pMap);
      const enriched = await Promise.all(
        list.map(async (p) => {
          try {
            const u = await api.get(`/users/${p.wallet}`);
            return { ...p, name: u.data.user?.name || 'Registered Patient' };
          } catch {
            return { ...p, name: 'Registered Patient' };
          }
        })
      );

      setPatients(enriched);
    } catch (err) {
      console.error('Error fetching hospital patients:', err);
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
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Hospital Authorized Patients</h1>
        <p className="text-xs text-slate-500 mt-1">
          Patients who have delegated medical consent to this healthcare facility.
        </p>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by patient name or wallet..."
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
            <h3 className="text-base font-semibold text-slate-700">No Patients Have Granted Access</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Once a patient selects this hospital in their dashboard and confirms consent on MetaMask, they will be listed here.
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
                      {new Date(p.timestamp).toLocaleDateString()}
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
