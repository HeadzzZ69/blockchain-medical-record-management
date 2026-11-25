import React, { useState } from 'react';
import { useWeb3 } from '../../context/Web3Context';
import api from '../../services/api';
import { FileText, Download, Search, ShieldCheck } from 'lucide-react';
import { Toast } from '../../components/Modal';

export default function HospitalRecords() {
  const { account, contract } = useWeb3();
  const [patientWallet, setPatientWallet] = useState('');
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const handleSearch = async () => {
    if (!patientWallet.trim()) {
      setToast({ message: 'Please enter a patient wallet address', type: 'error' });
      return;
    }

    try {
      setIsLoading(true);
      const { data } = await api.get(`/records/patient/${patientWallet.trim()}`);
      setRecords(data.records || []);
      if (data.records?.length === 0) {
        setToast({ message: 'No authorized records found for this patient.', type: 'info' });
      }
    } catch (err) {
      setToast({
        message: err.response?.data?.message || 'Access Denied: Smart contract verification failed.',
        type: 'error',
      });
      setRecords([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (record) => {
    try {
      setToast({ message: 'Verifying on-chain permission & decrypting record...', type: 'info' });
      const response = await api.get(`/records/download/${record.recordId}`, {
        responseType: 'blob',
      });

      if (contract) {
        try {
          const tx = await contract.logRecordAccess(record.patientWallet, record.recordId);
          await tx.wait();
        } catch (logErr) {
          console.warn('On-chain access log skipped:', logErr.message);
        }
      }

      const blob = new Blob([response.data], { type: record.fileType || 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = record.fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setToast({ message: `Decrypted ${record.fileName} successfully!`, type: 'success' });
    } catch (err) {
      setToast({
        message: err.response?.data?.message || 'Access Denied: Permission not valid on blockchain.',
        type: 'error',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Hospital Medical Records</h1>
        <p className="text-xs text-slate-500 mt-1">
          Inspect and decrypt patient diagnostic records authorized for this hospital facility.
        </p>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <label className="block text-xs font-semibold text-slate-700 mb-2">
          Patient Wallet Address
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={patientWallet}
            onChange={(e) => setPatientWallet(e.target.value)}
            placeholder="Enter patient wallet address 0x..."
            className="flex-1 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-medical-500"
          />
          <button
            onClick={handleSearch}
            disabled={isLoading || !patientWallet}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm transition disabled:opacity-50 shrink-0"
          >
            {isLoading ? 'Searching...' : 'Search Patient Records'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="text-xs text-slate-500 mt-2">Checking smart contract permissions...</p>
          </div>
        ) : records.length === 0 ? (
          <div className="py-16 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-700">No Records Displayed</h3>
            <p className="text-xs text-slate-500 mt-1">
              Enter a patient's address above to inspect authorized diagnostic records.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 uppercase font-semibold text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Record ID</th>
                  <th className="px-6 py-3.5">Document Name</th>
                  <th className="px-6 py-3.5">Category</th>
                  <th className="px-6 py-3.5">SHA-256 Hash</th>
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map((r) => (
                  <tr key={r.recordId} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4 font-mono font-bold text-slate-900">{r.recordId}</td>
                    <td className="px-6 py-4 font-semibold text-slate-800">{r.fileName}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {r.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-[10px] text-slate-500">
                      {r.fileHash.slice(0, 10)}...{r.fileHash.slice(-8)}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(r.uploadDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDownload(r)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 ml-auto shadow-sm transition"
                      >
                        <Download className="w-3.5 h-3.5" /> Download Decrypted
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
