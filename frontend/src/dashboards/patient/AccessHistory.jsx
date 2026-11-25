import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../../context/Web3Context';
import api from '../../services/api';
import { History, ShieldCheck, ExternalLink, Filter, Search, ArrowUpRight } from 'lucide-react';

export default function AccessHistory() {
  const { account } = useWeb3();
  const [events, setEvents] = useState([]);
  const [filterType, setFilterType] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAuditLogs();
  }, [account]);

  const fetchAuditLogs = async () => {
    try {
      setIsLoading(true);
      const { data } = await api.get('/audit/logs');
      // Filter blockchain events involving this patient
      const relevant = (data.blockchainEvents || []).filter(
        (ev) =>
          ev.patient?.toLowerCase() === account?.toLowerCase() ||
          ev.actor?.toLowerCase() === account?.toLowerCase()
      );
      setEvents(relevant);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getEventBadge = (type) => {
    switch (type) {
      case 'RecordAdded':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800">Record Added</span>;
      case 'AccessGranted':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">Consent Granted</span>;
      case 'AccessRevoked':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">Consent Revoked</span>;
      case 'RecordAccessed':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">Record Accessed</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800">{type}</span>;
    }
  };

  const filtered = events.filter((ev) => {
    const matchType = filterType === 'ALL' || ev.type === filterType;
    const matchSearch =
      (ev.recordId && ev.recordId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (ev.transactionHash && ev.transactionHash.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (ev.requester && ev.requester.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (ev.accessor && ev.accessor.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchType && matchSearch;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Blockchain Access & Audit History</h1>
        <p className="text-xs text-slate-500 mt-1">
          Cryptographically immutable audit trail emitted by the MedicalRecordAccess smart contract.
        </p>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by record ID, wallet, or tx..."
            className="w-full text-xs pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-medical-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-medical-500"
          >
            <option value="ALL">All Event Types</option>
            <option value="RecordAdded">Record Added</option>
            <option value="AccessGranted">Consent Granted</option>
            <option value="AccessRevoked">Consent Revoked</option>
            <option value="RecordAccessed">Record Accessed</option>
          </select>
        </div>
      </div>

      {/* Audit Events Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-medical-600 mx-auto"></div>
            <p className="text-xs text-slate-500 mt-2">Loading blockchain audit logs...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-700">No Events Recorded</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              No blockchain activities found for your wallet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 uppercase font-semibold text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Event Type</th>
                  <th className="px-6 py-3.5">Record ID</th>
                  <th className="px-6 py-3.5">Counterparty</th>
                  <th className="px-6 py-3.5">Timestamp</th>
                  <th className="px-6 py-3.5">Transaction Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((ev, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4">{getEventBadge(ev.type)}</td>
                    <td className="px-6 py-4 font-mono font-medium text-slate-900">
                      {ev.recordId || 'N/A'}
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-600">
                      {ev.requester || ev.accessor || ev.actor || ev.patient}
                    </td>
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
