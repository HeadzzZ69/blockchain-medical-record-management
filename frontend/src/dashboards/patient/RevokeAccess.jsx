import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../../context/Web3Context';
import api from '../../services/api';
import { ShieldAlert, RotateCcw, AlertTriangle, CheckCircle, ExternalLink, UserX } from 'lucide-react';
import { Toast } from '../../components/Modal';

export default function RevokeAccess() {
  const { account, contract } = useWeb3();

  const [activePermissions, setActivePermissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRevoking, setIsRevoking] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  useEffect(() => {
    fetchActivePermissions();
  }, [account]);

  const fetchActivePermissions = async () => {
    try {
      setIsLoading(true);
      const { data } = await api.get('/audit/logs');
      const events = data.blockchainEvents || [];

      // Reconstruct active grants for this patient
      const grantsMap = {};

      events.forEach((ev) => {
        if (ev.patient?.toLowerCase() === account?.toLowerCase()) {
          const key = `${ev.requester?.toLowerCase()}-${ev.recordId}`;
          if (ev.type === 'AccessGranted') {
            grantsMap[key] = {
              requester: ev.requester,
              recordId: ev.recordId,
              expiryTimestamp: ev.expiryTimestamp,
              timestamp: ev.timestamp,
              isGranted: true,
            };
          } else if (ev.type === 'AccessRevoked') {
            if (grantsMap[key]) {
              grantsMap[key].isGranted = false;
            }
          }
        }
      });

      // Filter only actively granted non-expired permissions
      const activeList = Object.values(grantsMap).filter((item) => {
        if (!item.isGranted) return false;
        if (item.expiryTimestamp > 0 && Date.now() > item.expiryTimestamp) return false;
        return true;
      });

      setActivePermissions(activeList);
    } catch (err) {
      console.error('Error fetching permissions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevoke = async (perm) => {
    if (!window.confirm(`Are you sure you want to revoke access to record ${perm.recordId} from ${perm.requester}?`)) {
      return;
    }

    try {
      setIsRevoking(true);
      setToast({ message: 'Prompting MetaMask to revoke permission on blockchain...', type: 'info' });

      // Call Smart Contract: revokeAccess(requester, recordId)
      const tx = await contract.revokeAccess(perm.requester, perm.recordId);
      setToast({ message: 'Revocation transaction sent. Waiting for confirmation...', type: 'info' });
      await tx.wait();

      setToast({ message: 'Access successfully revoked on the smart contract!', type: 'success' });
      await fetchActivePermissions();
    } catch (err) {
      console.error('Revocation error:', err);
      setToast({ message: err.reason || err.message || 'Failed to revoke access', type: 'error' });
    } finally {
      setIsRevoking(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Revoke Access Permissions</h1>
        <p className="text-xs text-slate-500 mt-1">
          Instantly terminate authorization for any doctor or hospital. Revocation takes effect immediately on the smart contract.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
        {isLoading ? (
          <div className="py-16 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-medical-600 mx-auto"></div>
            <p className="text-xs text-slate-500 mt-2">Checking active permissions...</p>
          </div>
        ) : activePermissions.length === 0 ? (
          <div className="py-16 text-center">
            <UserX className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-700">No Active Permissions Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              There are currently no active or unexpired authorizations granted to any healthcare provider.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 uppercase font-semibold text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Record ID</th>
                  <th className="px-6 py-3.5">Authorized Wallet</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Granted On</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activePermissions.map((perm, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4 font-mono font-semibold text-slate-900">
                      {perm.recordId}
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-700">
                      {perm.requester}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                        <CheckCircle className="w-3 h-3" /> Active On-Chain
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(perm.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleRevoke(perm)}
                        disabled={isRevoking}
                        className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-semibold text-xs flex items-center gap-1.5 ml-auto transition disabled:opacity-50"
                      >
                        <ShieldAlert className="w-3.5 h-3.5" /> Revoke Access
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />
    </div>
  );
}
