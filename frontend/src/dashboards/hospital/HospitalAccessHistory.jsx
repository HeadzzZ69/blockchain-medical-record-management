import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../../context/Web3Context';
import api from '../../services/api';
import { History, Search } from 'lucide-react';

export default function HospitalAccessHistory() {
  const { account } = useWeb3();
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLogs();
  }, [account]);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const { data } = await api.get('/audit/logs');
      const hospEvents = (data.blockchainEvents || []).filter(
        (ev) =>
          ev.requester?.toLowerCase() === account?.toLowerCase() ||
          ev.accessor?.toLowerCase() === account?.toLowerCase()
      );
      setEvents(hospEvents);
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = events.filter(
    (ev) =>
      (ev.recordId && ev.recordId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (ev.patient && ev.patient.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (ev.transactionHash && ev.transactionHash.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Hospital Institutional Audit Trail</h1>
        <p className="text-xs text-slate-500 mt-1">
          Cryptographically recorded healthcare consent and file retrieval history.
        </p>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by record ID, patient, or tx..."
            className="w-full text-xs pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-medical-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="text-xs text-slate-500 mt-2">Loading audit trail...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-700">No Institutional Events Recorded</h3>
            <p className="text-xs text-slate-500 mt-1">
              Actions involving your hospital address will be logged here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 uppercase font-semibold text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Action</th>
                  <th className="px-6 py-3.5">Record ID</th>
                  <th className="px-6 py-3.5">Patient Wallet</th>
                  <th className="px-6 py-3.5">Timestamp</th>
                  <th className="px-6 py-3.5">Transaction Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((ev, i) => (
                  <tr key={i} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                        {ev.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono font-medium text-slate-900">{ev.recordId}</td>
                    <td className="px-6 py-4 font-mono text-slate-600">{ev.patient}</td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(ev.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-mono text-[11px] text-slate-500">
                      <span className="bg-slate-50 px-2 py-1 rounded border border-slate-200">
                        {ev.transactionHash?.slice(0, 10)}...{ev.transactionHash?.slice(-8)}
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
