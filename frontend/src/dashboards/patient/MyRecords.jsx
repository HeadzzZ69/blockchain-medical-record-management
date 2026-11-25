import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWeb3 } from '../../context/Web3Context';
import api from '../../services/api';
import {
  FileText,
  Upload,
  Download,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Search,
  Filter,
} from 'lucide-react';
import { Toast } from '../../components/Modal';

export default function MyRecords() {
  const { account } = useWeb3();
  const [records, setRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  useEffect(() => {
    fetchRecords();
  }, [account]);

  const fetchRecords = async () => {
    try {
      setIsLoading(true);
      const { data } = await api.get('/records/patient');
      setRecords(data.records || []);
    } catch (err) {
      console.error('Error fetching records:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (record) => {
    try {
      setToast({ message: 'Downloading & decrypting record from secure storage...', type: 'info' });
      const response = await api.get(`/records/download/${record.recordId}`, {
        responseType: 'blob',
      });

      // Create download link
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
      console.error('Download error:', err);
      setToast({
        message: err.response?.data?.message || 'Failed to download record. Permission denied.',
        type: 'error',
      });
    }
  };

  const handleDelete = async (recordId) => {
    if (!window.confirm(`Are you sure you want to delete record ${recordId}?`)) return;
    try {
      await api.delete(`/records/${recordId}`);
      setRecords(records.filter((r) => r.recordId !== recordId));
      setToast({ message: 'Record deleted from off-chain storage.', type: 'success' });
    } catch (err) {
      setToast({ message: 'Failed to delete record.', type: 'error' });
    }
  };

  const filteredRecords = records.filter((r) => {
    const term = (searchTerm || '').trim().toLowerCase();
    const fileName = (r.recordTitle || r.fileName || '').toLowerCase();
    const recordId = (r.recordId || '').toLowerCase();
    const desc = (r.description || '').toLowerCase();
    const matchesSearch = !term || fileName.includes(term) || recordId.includes(term) || desc.includes(term);
    const matchesCat =
      selectedCategory === 'ALL' ||
      r.category === selectedCategory ||
      r.recordType === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Medical Records</h1>
          <p className="text-xs text-slate-500 mt-1">
            Browse, inspect, and download your off-chain encrypted healthcare records.
          </p>
        </div>
        <Link
          to="/patient/upload"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-medical-600 hover:bg-medical-700 text-white font-semibold text-xs shadow-sm transition"
        >
          <Upload className="w-4 h-4" /> Upload Medical Record
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by file name or ID..."
            className="w-full text-xs pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-medical-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-medical-500"
          >
            <option value="ALL">All Categories</option>
            <option value="Prescription">Prescription</option>
            <option value="Lab Report">Lab Report</option>
            <option value="Radiology / Scan">Radiology / Scan</option>
            <option value="Discharge Summary">Discharge Summary</option>
            <option value="Cardiology Report">Cardiology Report</option>
            <option value="General Record">General Record</option>
          </select>
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-medical-600 mx-auto"></div>
            <p className="text-xs text-slate-500 mt-2">Loading medical records...</p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="py-16 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-base font-semibold text-slate-700">No medical records found</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              You haven't uploaded any documents matching this criteria. Click upload above to add one.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Record ID</th>
                  <th className="px-6 py-3.5">Document Name</th>
                  <th className="px-6 py-3.5">Category</th>
                  <th className="px-6 py-3.5">SHA-256 Hash</th>
                  <th className="px-6 py-3.5">Upload Date</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.map((r) => (
                  <tr key={r.recordId} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4 font-mono font-medium text-slate-900 whitespace-nowrap">
                      {r.recordId}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      <div>{r.fileName}</div>
                      {r.description && (
                        <div className="text-[11px] font-normal text-slate-500 truncate max-w-xs">
                          {r.description}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                        {r.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-[10px] text-slate-500">
                      <span title={r.fileHash}>
                        {r.fileHash.slice(0, 10)}...{r.fileHash.slice(-8)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(r.uploadDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleDownload(r)}
                          className="px-2.5 py-1.5 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 font-medium text-xs flex items-center gap-1 transition"
                          title="Download & Decrypt"
                        >
                          <Download className="w-3.5 h-3.5" /> Download
                        </button>
                        <button
                          onClick={() => handleDelete(r.recordId)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="Delete Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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
