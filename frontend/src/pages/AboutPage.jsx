import React from 'react';
import { ShieldCheck, Database, Lock, Key, Layers, Server, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-medical-600 hover:text-medical-700 mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 shadow-sm space-y-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-medical-600">
              System Architecture & Methodology
            </span>
            <h1 className="text-3xl font-extrabold text-slate-900 mt-2">
              Blockchain-Based Electronic Medical Record Access Management
            </h1>
            <p className="mt-3 text-slate-600 leading-relaxed">
              This academic mini-project implements a patient-centric, decentralized access management paradigm for electronic healthcare records (EMRs) using Solidity smart contracts and hybrid storage.
            </p>
          </div>

          <div className="border-t border-slate-100 pt-6">
            <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Layers className="w-5 h-5 text-medical-600" /> 1. Problem Statement
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              Traditional healthcare systems maintain centralized databases prone to single points of failure, unauthorized insider snooping, and fragmented patient records across multiple hospitals. Patients have zero transparent visibility into who viewed their sensitive diagnostic data or when access took place.
            </p>
          </div>

          <div className="border-t border-slate-100 pt-6">
            <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-medical-600" /> 2. Hybrid Blockchain & Storage Architecture
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed mb-4">
              Blockchains are not designed for bulk data storage due to block gas limits and public exposure risks. Hence, this project implements a hybrid architecture:
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <h3 className="font-semibold text-slate-900 text-sm mb-1 flex items-center gap-2">
                  <Database className="w-4 h-4 text-sky-600" /> On-Chain Layer (Solidity)
                </h3>
                <ul className="text-xs text-slate-600 space-y-1 list-disc pl-4">
                  <li>User role registry (Patient, Doctor, Hospital, Admin).</li>
                  <li>Record metadata (Record ID, SHA-256 hash).</li>
                  <li>Consent permissions (isGranted, expiryTimestamp).</li>
                  <li>Immutable audit events with timestamps.</li>
                </ul>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <h3 className="font-semibold text-slate-900 text-sm mb-1 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-600" /> Off-Chain Layer (Encrypted Storage)
                </h3>
                <ul className="text-xs text-slate-600 space-y-1 list-disc pl-4">
                  <li>Original documents encrypted via AES-256-GCM.</li>
                  <li>Stores binary ciphertext in local server directory.</li>
                  <li>No public URL or unauthenticated endpoints.</li>
                  <li>Backend queries smart contract before decrypting.</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6">
            <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Server className="w-5 h-5 text-medical-600" /> 3. Verification & Access Workflow
            </h2>
            <ol className="text-sm text-slate-600 space-y-2 list-decimal pl-5">
              <li>Doctor selects patient's record and requests download.</li>
              <li>Backend intercepts download request and retrieves caller's authenticated wallet address.</li>
              <li>Backend invokes <code>hasValidAccess(patient, requester, recordId)</code> on the smart contract.</li>
              <li>If the contract returns <code>true</code>, the backend decrypts the AES-256-GCM ciphertext and streams the file.</li>
              <li>If the contract returns <code>false</code> (permission not granted, expired, or revoked), HTTP 403 Forbidden is returned.</li>
            </ol>
          </div>

          <div className="border-t border-slate-100 pt-6 bg-amber-50 -mx-8 -mb-8 p-8 rounded-b-2xl border-amber-200">
            <h3 className="text-amber-900 font-semibold text-sm flex items-center gap-2">
              <Key className="w-4 h-4" /> Educational Prototype Note
            </h3>
            <p className="text-xs text-amber-800 mt-1 leading-relaxed">
              In this educational mini-project prototype, the AES-256-GCM encryption key is managed securely on the backend server environment. In an enterprise production deployment, key management would be distributed among patients using hardware security modules (HSM) or threshold cryptography (MPC).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
