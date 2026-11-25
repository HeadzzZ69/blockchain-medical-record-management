import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWeb3 } from '../../context/Web3Context';
import api from '../../services/api';
import { Upload, FileUp, CheckCircle, AlertCircle, Lock, ShieldCheck } from 'lucide-react';

export default function UploadRecord() {
  const { account, contract } = useWeb3();
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [category, setCategory] = useState('Prescription');
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [statusStep, setStatusStep] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!validTypes.includes(selected.type)) {
        setErrorMsg('Invalid file format. Please upload PDF, JPG, or PNG files only.');
        setFile(null);
        return;
      }
      if (selected.size > 10 * 1024 * 1024) {
        setErrorMsg('File size exceeds the 10 MB limit.');
        setFile(null);
        return;
      }
      setErrorMsg('');
      setFile(selected);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setErrorMsg('Please select a medical file to upload.');
      return;
    }
    if (!contract) {
      setErrorMsg('Smart contract not initialized. Please connect your MetaMask wallet.');
      return;
    }

    try {
      setIsUploading(true);
      setErrorMsg('');

      // Step 1: Upload to backend for AES-256-GCM encryption & SHA-256 calculation
      setStatusStep('Step 1/3: Encrypting file with AES-256-GCM and calculating SHA-256 hash off-chain...');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', category);
      formData.append('description', description);

      const { data: uploadRes } = await api.post('/records/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const { recordId, fileHash } = uploadRes.record;

      // Step 2: Register on Solidity smart contract
      setStatusStep('Step 2/3: Prompting MetaMask to register cryptographic hash on the blockchain...');
      const tx = await contract.addRecord(recordId, fileHash, category);

      setStatusStep('Waiting for blockchain transaction confirmation on Hardhat node...');
      const receipt = await tx.wait();

      // Step 3: Confirm transaction hash with backend
      setStatusStep('Step 3/3: Anchoring confirmation in backend database...');
      await api.post('/records/confirm', {
        recordId,
        transactionHash: receipt.hash,
      });

      setStatusStep('Upload & on-chain anchoring successful! Redirecting to records...');
      setTimeout(() => {
        navigate('/patient/records');
      }, 1500);
    } catch (err) {
      console.error('Record upload error:', err);
      setErrorMsg(err.reason || err.message || 'Failed to upload and anchor record');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Upload Medical Record</h1>
        <p className="text-xs text-slate-500 mt-1">
          Encrypt your medical document locally, store the ciphertext off-chain, and register its cryptographic reference on the blockchain.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {statusStep && (
          <div className="mb-6 p-4 rounded-xl bg-sky-50 border border-sky-200 text-sky-800 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0 text-sky-600 animate-pulse" />
            <span className="font-medium">{statusStep}</span>
          </div>
        )}

        <form onSubmit={handleUploadSubmit} className="space-y-6">
          {/* File Drag & Drop Box */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Medical Document (PDF, JPG, PNG &bull; Max 10MB) <span className="text-rose-500">*</span>
            </label>
            <div className="border-2 border-dashed border-slate-300 hover:border-medical-500 rounded-2xl p-6 text-center cursor-pointer transition bg-slate-50 hover:bg-white relative">
              <input
                type="file"
                required
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center">
                <FileUp className="w-10 h-10 text-medical-600 mb-2" />
                {file ? (
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{file.name}</p>
                    <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs font-semibold text-slate-700">
                      Click to choose file or drag and drop
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">Supports PDF, JPG, and PNG files</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Category Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Category <span className="text-rose-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-medical-500"
            >
              <option value="Prescription">Prescription</option>
              <option value="Lab Report">Lab Report</option>
              <option value="Radiology / Scan">Radiology / Scan</option>
              <option value="Discharge Summary">Discharge Summary</option>
              <option value="Cardiology Report">Cardiology Report</option>
              <option value="General Record">General Record</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description / Notes</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Annual blood panel results and physician commentary"
              className="w-full text-xs bg-white border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-medical-500"
            />
          </div>

          {/* Security Notice */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-slate-800">
              <Lock className="w-3.5 h-3.5 text-medical-600" /> Cryptographic Integrity Guarantee
            </div>
            <p className="text-[11px] text-slate-500">
              Your raw medical file will never touch the blockchain. It is encrypted with AES-256-GCM before storage. Only the tamper-proof SHA-256 hash is recorded in the smart contract.
            </p>
          </div>

          <button
            type="submit"
            disabled={isUploading || !file}
            className="w-full py-3.5 px-4 rounded-xl bg-medical-600 hover:bg-medical-700 text-white font-semibold text-xs shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Upload className="w-4 h-4" />
            {isUploading ? 'Securing & Anchoring on Blockchain...' : 'Upload & Anchor Record'}
          </button>
        </form>
      </div>
    </div>
  );
}
