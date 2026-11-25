import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { History, ShieldCheck, Search, Filter } from 'lucide-react';

export default function GlobalAudit() {
  const [events, setEvents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchGlobalAudit();
  }, []);

  const fetchGlobalAudit = async () => {
    try {
      setIsLoading(true);
      const { data } = await api.get('/audit/logs');
      setEvents(data.blockchainEvents || []);
    } catch (err) {
      console.error('Error fetching global audit:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = events.filter((ev) => {
    const matchType = filterType === 'ALL' || ev.type === filterType;
    const matchSearch =
      (ev.recordId && ev.recordId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (ev.transactionHash && ev.transactionHash.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (ev.patient && ev.patient.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (ev.actor && ev.actor.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchType && matchSearch;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Global Blockchain Audit Log</h1>
        <p className="text-xs text-slate-500 mt-1">
          Complete, unalterable consensus history emitted across all user registrations, consent grants, revocations, and record downloads.
        </p>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by wallet, record ID, or tx..."
            className="w-full text-xs pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="ALL">All Events</option>
          <option value="UserRegistered">User Registered</option>
          <option value="RecordAdded">Record Added</option>
          <option value="AccessGranted">Consent Granted</option>
          <option value="AccessRevoked">Consent Revoked</option>
          <option value="RecordAccessed">Record Accessed</option>
        </select>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
            <p className="text-xs text-slate-500 mt-2">Loading blockchain events...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-700">No Blockchain Events Found</h3>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 uppercase font-semibold text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Event Type</th>
                  <th className="px-6 py-3.5">Block</th>
                  <th className="px-6 py-3.5">Details</th>
                  <th className="px-6 py-3.5">Timestamp</th>
                  <th className="px-6 py-3.5">Tx Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((ev, i) => (
                  <tr key={i} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-purple-100 text-purple-800">
                        {ev.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono font-medium text-slate-800">
                      #{ev.blockNumber}
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      {ev.recordId && <span className="font-mono font-semibold">[{ev.recordId}] </span>}
                      {ev.name && <span>{ev.name} </span>}
                      {ev.requester && (
                        <span className="font-mono text-xs text-slate-500">
                          Requester: {ev.requester.slice(0, 6)}...
                        </span>
                      )}
                      {ev.accessor && (
                        <span className="font-mono text-xs text-slate-500">
                          Accessor: {ev.accessor.slice(0, 6)}...
                        </span>
                      )}
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
