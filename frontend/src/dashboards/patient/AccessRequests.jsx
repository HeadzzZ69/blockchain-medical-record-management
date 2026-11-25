import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../../context/Web3Context';
import api from '../../services/api';
import { Inbox, CheckCircle2, XCircle, Clock, ShieldCheck, Stethoscope } from 'lucide-react';
import { Toast } from '../../components/Modal';

export default function AccessRequests() {
  const { account, contract, executeTx, ensureRecordAnchored, isTxPending } = useWeb3();
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  useEffect(() => {
    fetchRequests();
  }, [account]);

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      const { data } = await api.get('/access/patient');
      setRequests(data.requests || []);
    } catch (err) {
      console.error('Error fetching requests:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (req) => {
    if (!contract) {
      setToast({ message: 'Smart contract not loaded', type: 'error' });
      return;
    }

    try {
      setProcessingId(req._id);
      setToast({ message: 'Prompting MetaMask to grant permissions for requested records...', type: 'info' });

      // Expiry default: 7 days
      const expiry = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;

      let lastTxHash = '';
      for (const recId of req.recordIds) {
        // Guarantee record exists on-chain to prevent 'Record does not exist' revert
        await ensureRecordAnchored(recId);
        const receipt = await executeTx(async (c) => {
          return await c.grantAccess(req.requesterWallet, recId, expiry);
        });
        lastTxHash = receipt?.hash || '';
      }

      // Update backend status to approved
      await api.patch(`/access/${req._id}`, {
        status: 'approved',
        transactionHash: lastTxHash,
      });

      setToast({ message: 'Access request approved & permission recorded on blockchain!', type: 'success' });
      await fetchRequests();
    } catch (err) {
      console.error('Approval error:', err);
      setToast({ message: err.message || err.reason || 'Failed to approve request', type: 'error' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (req) => {
    try {
      setProcessingId(req._id);
      await api.patch(`/access/${req._id}`, { status: 'rejected' });
      setToast({ message: 'Access request rejected.', type: 'info' });
      await fetchRequests();
    } catch (err) {
      setToast({ message: 'Failed to reject request', type: 'error' });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Access Requests</h1>
        <p className="text-xs text-slate-500 mt-1">
          Review incoming authorization requests from physicians and hospital specialists.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
        {isLoading ? (
          <div className="py-16 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-medical-600 mx-auto"></div>
            <p className="text-xs text-slate-500 mt-2">Loading requests...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="py-16 text-center">
            <Inbox className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-700">No Access Requests</h3>
            <p className="text-xs text-slate-500 mt-1">
              You do not have any pending or past access requests from healthcare practitioners.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {requests.map((r) => (
              <div key={r._id} className="py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 text-sm">
                      {r.requesterName || 'Doctor'}
                    </span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">
                      {r.requesterRole}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        r.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : r.status === 'rejected'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {r.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">
                    <span className="font-medium text-slate-700">Purpose:</span> {r.purpose}
                  </p>
                  <p className="text-xs text-slate-500">
                    <span className="font-medium text-slate-700">Requested Records:</span>{' '}
                    {r.recordIds.join(', ')}
                  </p>
                  <p className="text-[11px] font-mono text-slate-400">
                    Requester: {r.requesterWallet} &bull; {new Date(r.requestDate).toLocaleString()}
                  </p>
                </div>

                {r.status === 'pending' && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleApprove(r)}
                      disabled={processingId === r._id || isTxPending}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Approve on Chain
                    </button>
                    <button
                      onClick={() => handleReject(r)}
                      disabled={processingId === r._id || isTxPending}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 font-semibold text-xs transition flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" /> Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />
    </div>
  );
}
