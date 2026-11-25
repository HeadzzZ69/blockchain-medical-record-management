import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../../context/Web3Context';
import api from '../../services/api';
import {
  UserCheck,
  Calendar,
  Clock,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Stethoscope,
  Building2,
  FileText,
} from 'lucide-react';
import { Toast } from '../../components/Modal';

export default function ManageAccess() {
  const { account, contract, executeTx, ensureRecordAnchored, isTxPending } = useWeb3();

  const [doctors, setDoctors] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [records, setRecords] = useState([]);

  const [selectedRequester, setSelectedRequester] = useState('');
  const [selectedRecordId, setSelectedRecordId] = useState('');
  const [expiryOption, setExpiryOption] = useState('7'); // days, or '0' for indefinite
  const [isGranting, setIsGranting] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const [grantedHistory, setGrantedHistory] = useState([]);

  useEffect(() => {
    loadData();
  }, [account]);

  const loadData = async () => {
    try {
      const [docRes, hospRes, recRes, auditRes] = await Promise.all([
        api.get('/users/doctors'),
        api.get('/users/hospitals'),
        api.get('/records/patient'),
        api.get('/audit/logs'),
      ]);

      setDoctors(docRes.data.doctors || []);
      setHospitals(hospRes.data.hospitals || []);
      setRecords(recRes.data.records || []);

      if (recRes.data.records?.length > 0) {
        setSelectedRecordId(recRes.data.records[0].recordId);
      }

      const allRequesters = [...(docRes.data.doctors || []), ...(hospRes.data.hospitals || [])];
      if (allRequesters.length > 0) {
        setSelectedRequester(allRequesters[0].walletAddress);
      }

      // Filter access granted events for this patient
      const userGrants = (auditRes.data.blockchainEvents || []).filter(
        (ev) => ev.type === 'AccessGranted' && ev.patient?.toLowerCase() === account?.toLowerCase()
      );
      setGrantedHistory(userGrants);
    } catch (err) {
      console.error('Error loading grant access data:', err);
    }
  };

  const handleGrantAccess = async (e) => {
    e.preventDefault();
    if (!selectedRequester || !selectedRecordId) {
      setToast({ message: 'Please select a recipient and a record', type: 'error' });
      return;
    }
    if (!contract) {
      setToast({ message: 'Smart contract not loaded', type: 'error' });
      return;
    }

    try {
      setIsGranting(true);

      // Pre-anchor record to blockchain if needed to prevent "Record does not exist" revert
      const recordObj = records.find((r) => r.recordId === selectedRecordId);
      setToast({ message: 'Verifying record status on smart contract...', type: 'info' });
      await ensureRecordAnchored(selectedRecordId, recordObj?.fileHash, recordObj?.category);

      // Calculate expiry timestamp
      let expiryTimestamp = 0;
      if (expiryOption !== '0') {
        const days = parseInt(expiryOption, 10);
        expiryTimestamp = Math.floor(Date.now() / 1000) + days * 24 * 60 * 60;
      }

      setToast({ message: 'Prompting MetaMask for transaction signature...', type: 'info' });
      // Call Smart Contract: grantAccess(requester, recordId, expiryTimestamp)
      await executeTx(async (c) => {
        return await c.grantAccess(selectedRequester, selectedRecordId, expiryTimestamp);
      });

      setToast({ message: 'Access permission successfully granted on blockchain!', type: 'success' });
      loadData();
    } catch (err) {
      console.error('Grant access error:', err);
      setToast({ message: err.message || err.reason || 'Failed to grant access', type: 'error' });
    } finally {
      setIsGranting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Manage Access Permissions</h1>
        <p className="text-xs text-slate-500 mt-1">
          Delegate selective, time-bound consent to authorized doctors and hospitals on the blockchain.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Grant Access Form */}
        <div className="lg:col-span-1 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-medical-600" /> Grant Record Consent
          </h2>

          <form onSubmit={handleGrantAccess} className="space-y-4">
            {/* Select Recipient */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Authorized Recipient (Doctor / Hospital)
              </label>
              <select
                value={selectedRequester}
                onChange={(e) => setSelectedRequester(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-medical-500"
              >
                <optgroup label="Doctors">
                  {doctors.map((d) => (
                    <option key={d.walletAddress} value={d.walletAddress}>
                      {d.fullName || d.name || 'Doctor'} {d.specialization ? `(${d.specialization})` : ''}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Hospitals">
                  {hospitals.map((h) => (
                    <option key={h.walletAddress} value={h.walletAddress}>
                      {h.hospitalName || h.fullName || h.name || 'Hospital'}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Select Record */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Medical Record
              </label>
              {records.length === 0 ? (
                <p className="text-xs text-rose-500">No medical records uploaded yet.</p>
              ) : (
                <select
                  value={selectedRecordId}
                  onChange={(e) => setSelectedRecordId(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-medical-500"
                >
                  {records.map((r) => (
                    <option key={r.recordId} value={r.recordId}>
                      {r.fileName} ({r.recordId})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Expiry Option */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Access Expiration
              </label>
              <select
                value={expiryOption}
                onChange={(e) => setExpiryOption(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-medical-500"
              >
                <option value="1">1 Day (24 Hours)</option>
                <option value="3">3 Days</option>
                <option value="7">7 Days (1 Week)</option>
                <option value="30">30 Days (1 Month)</option>
                <option value="0">Indefinite (Until manually revoked)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isGranting || isTxPending || records.length === 0}
              className="w-full mt-4 py-3 px-4 rounded-xl bg-medical-600 hover:bg-medical-700 text-white font-semibold text-xs shadow transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              {isGranting || isTxPending ? 'Signing Blockchain Tx...' : 'Grant Access in MetaMask'}
            </button>
          </form>
        </div>

        {/* Granted History Table */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-4">
            Recent Consent Authorizations (Blockchain Audit)
          </h2>

          {grantedHistory.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <UserCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No active authorizations granted yet</p>
              <p className="text-xs text-slate-500 mt-1">
                Use the form on the left to delegate access to a doctor or hospital.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 uppercase font-semibold text-slate-700 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Record ID</th>
                    <th className="px-4 py-3">Requester Wallet</th>
                    <th className="px-4 py-3">Expiry Date</th>
                    <th className="px-4 py-3">Granted Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {grantedHistory.map((g, idx) => {
                    const isExpired = g.expiryTimestamp > 0 && Date.now() > g.expiryTimestamp;
                    return (
                      <tr key={idx} className="hover:bg-slate-50/80 transition">
                        <td className="px-4 py-3 font-mono font-medium text-slate-900">
                          {g.recordId}
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] text-slate-600">
                          {g.requester?.slice(0, 8)}...{g.requester?.slice(-6)}
                        </td>
                        <td className="px-4 py-3">
                          {g.expiryTimestamp === 0 ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
                              No Expiry
                            </span>
                          ) : isExpired ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-medium">
                              Expired ({new Date(g.expiryTimestamp).toLocaleDateString()})
                            </span>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium">
                              Expires {new Date(g.expiryTimestamp).toLocaleDateString()}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {new Date(g.timestamp).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />
    </div>
  );
}
