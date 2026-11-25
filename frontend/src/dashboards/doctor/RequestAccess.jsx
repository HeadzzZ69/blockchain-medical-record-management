import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../../context/Web3Context';
import api from '../../services/api';
import { Inbox, Send, CheckCircle2, Clock, XCircle, Search } from 'lucide-react';
import { Toast } from '../../components/Modal';

export default function RequestAccess() {
  const { account } = useWeb3();

  const [patientWallet, setPatientWallet] = useState('');
  const [recordIdsInput, setRecordIdsInput] = useState('');
  const [purpose, setPurpose] = useState('Medical Consultation and Clinical Diagnosis');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [myRequests, setMyRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  useEffect(() => {
    fetchMyRequests();
  }, [account]);

  const fetchMyRequests = async () => {
    try {
      setIsLoading(true);
      const { data } = await api.get('/access/requester');
      setMyRequests(data.requests || []);
    } catch (err) {
      console.error('Error fetching sent requests:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    if (!patientWallet.trim()) {
      setToast({ message: 'Patient wallet address is required', type: 'error' });
      return;
    }
    const recordIds = recordIdsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (recordIds.length === 0) {
      setToast({ message: 'Please specify at least one Record ID (comma-separated)', type: 'error' });
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post('/access', {
        patientWallet: patientWallet.trim(),
        recordIds,
        purpose,
      });

      setToast({ message: 'Access request successfully sent to patient!', type: 'success' });
      setPatientWallet('');
      setRecordIdsInput('');
      await fetchMyRequests();
    } catch (err) {
      console.error('Error requesting access:', err);
      setToast({ message: err.response?.data?.message || 'Failed to submit request', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Request Patient Record Access</h1>
        <p className="text-xs text-slate-500 mt-1">
          Submit formal authorization requests to patients to access their encrypted diagnostic files.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Request Form */}
        <div className="lg:col-span-1 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Send className="w-5 h-5 text-medical-600" /> New Access Request
          </h2>

          <form onSubmit={handleSubmitRequest} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Patient Wallet Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={patientWallet}
                onChange={(e) => setPatientWallet(e.target.value)}
                placeholder="0x..."
                className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-medical-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Record IDs (Comma separated) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={recordIdsInput}
                onChange={(e) => setRecordIdsInput(e.target.value)}
                placeholder="REC-1001, REC-1002"
                className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-medical-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Clinical Purpose <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="State the medical reason for requesting access..."
                className="w-full text-xs bg-white border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-medical-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-4 py-3 px-4 rounded-xl bg-medical-600 hover:bg-medical-700 text-white font-semibold text-xs shadow transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              {isSubmitting ? 'Sending Request...' : 'Submit Request to Patient'}
            </button>
          </form>
        </div>

        {/* Requests Table */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-4">Request Status Tracking</h2>

          {isLoading ? (
            <div className="py-16 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-medical-600 mx-auto"></div>
              <p className="text-xs text-slate-500 mt-2">Loading submitted requests...</p>
            </div>
          ) : myRequests.length === 0 ? (
            <div className="py-16 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <Inbox className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No requests submitted yet</p>
              <p className="text-xs text-slate-500 mt-1">
                Use the form on the left to request medical file access from a patient.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 uppercase font-semibold text-slate-700 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Patient Wallet</th>
                    <th className="px-4 py-3">Requested Records</th>
                    <th className="px-4 py-3">Purpose</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {myRequests.map((r) => (
                    <tr key={r._id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-800">
                        {r.patientWallet.slice(0, 8)}...{r.patientWallet.slice(-6)}
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-600">
                        {r.recordIds.join(', ')}
                      </td>
                      <td className="px-4 py-3 text-slate-600 max-w-xs truncate">{r.purpose}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            r.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : r.status === 'rejected'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {r.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {new Date(r.requestDate).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
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
