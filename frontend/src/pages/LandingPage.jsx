import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';
import {
  ShieldCheck,
  Lock,
  UserCheck,
  RotateCcw,
  FileCheck2,
  Database,
  ArrowRight,
  Stethoscope,
  Building2,
  CheckCircle2,
  ChevronRight,
  Cpu,
} from 'lucide-react';

export default function LandingPage() {
  const { account, userRole, connectWallet } = useWeb3();
  const navigate = useNavigate();

  const handleGetStarted = async () => {
    if (!account) {
      const ok = await connectWallet();
      if (ok) {
        navigate('/connect');
      }
    } else {
      const target = userRole && userRole !== 'none' ? `/${userRole}` : '/connect';
      navigate(target);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-navy-900 via-navy-800 to-slate-900 text-white pt-20 pb-28">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px]"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-medical-500/20 border border-medical-500/30 text-medical-200 text-xs font-semibold uppercase tracking-wider mb-8">
            <Cpu className="w-3.5 h-3.5 text-medical-400" />
            Blockchain-Powered Healthcare Access Management
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight sm:leading-none">
            Your Medical Records.{' '}
            <span className="bg-gradient-to-r from-sky-400 via-medical-400 to-teal-300 bg-clip-text text-transparent">
              Your Control.
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto font-light leading-relaxed">
            A decentralized electronic medical record access management platform giving patients sovereign control over their health data through immutable smart contract consent and military-grade AES-256-GCM encryption.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleGetStarted}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-medical-500 hover:bg-medical-600 font-semibold text-white shadow-lg shadow-medical-500/30 flex items-center justify-center gap-2 transition hover:-translate-y-0.5"
            >
              Get Started <ArrowRight className="w-4 h-4" />
            </button>
            <Link
              to="/about"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 font-semibold text-slate-200 transition"
            >
              Explore Architecture
            </Link>
          </div>

          {/* Quick Metrics */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-10 border-t border-slate-800/80">
            <div>
              <p className="text-2xl font-bold text-sky-400">100%</p>
              <p className="text-xs text-slate-400 font-medium">Patient Controlled</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-teal-400">Off-Chain</p>
              <p className="text-xs text-slate-400 font-medium">Encrypted Storage</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-indigo-400">Zero-Trust</p>
              <p className="text-xs text-slate-400 font-medium">Smart Contract Verification</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-400">Tamper-Proof</p>
              <p className="text-xs text-slate-400 font-medium">Solidity Audit Trail</p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Section */}
      <section className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-medical-600 uppercase tracking-widest">
              Security & Sovereignty
            </h2>
            <p className="mt-2 text-3xl font-bold text-slate-900 tracking-tight">
              Built on Modern Cryptographic & Consensus Principles
            </p>
            <p className="mt-4 text-slate-600">
              Designed specifically to solve medical data privacy, unauthorized access, and fragmented hospital records.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 hover:border-medical-300 hover:shadow-lg transition group">
              <div className="w-12 h-12 rounded-xl bg-sky-100 text-medical-600 flex items-center justify-center mb-6 group-hover:scale-110 transition">
                <UserCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Patient Consent</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Patients independently decide which doctor or hospital can view their medical files. No healthcare provider can inspect records without on-chain patient authorization.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 hover:border-medical-300 hover:shadow-lg transition group">
              <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-600 flex items-center justify-center mb-6 group-hover:scale-110 transition">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Secure Medical Records</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Records are encrypted using AES-256-GCM before off-chain storage. Only cryptographic SHA-256 hashes are anchored on the blockchain to guarantee data integrity.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 hover:border-medical-300 hover:shadow-lg transition group">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-6 group-hover:scale-110 transition">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Role-Based Access</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Strict separation of roles: Patients manage consent, verified Doctors submit requests and view authorized files, and Hospitals coordinate clinical staff.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 hover:border-medical-300 hover:shadow-lg transition group">
              <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mb-6 group-hover:scale-110 transition">
                <RotateCcw className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Access Revocation</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Patients can instantly revoke permission at any moment with a single blockchain transaction. Revocation immediately blocks subsequent file decryptions.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 hover:border-medical-300 hover:shadow-lg transition group">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-6 group-hover:scale-110 transition">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Blockchain Audit Trail</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Every action (record addition, grant, revocation, and record access) emits an immutable Solidity event with timestamps and caller signatures.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 hover:border-medical-300 hover:shadow-lg transition group">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-6 group-hover:scale-110 transition">
                <Database className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Off-Chain Privacy</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Raw medical files and personally identifiable data are NEVER stored on-chain, eliminating public exposure while maintaining verifiable authenticity.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-medical-600 uppercase tracking-widest">
              Simple 4-Step Process
            </h2>
            <p className="mt-2 text-3xl font-bold text-slate-900 tracking-tight">
              How The System Operates
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 relative">
              <div className="w-8 h-8 rounded-full bg-navy-900 text-white font-bold flex items-center justify-center mb-4">
                1
              </div>
              <h4 className="font-bold text-slate-900 mb-1">Upload & Encrypt</h4>
              <p className="text-xs text-slate-600">
                Patient uploads record. Backend computes SHA-256 and encrypts off-chain with AES-256-GCM.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 relative">
              <div className="w-8 h-8 rounded-full bg-medical-600 text-white font-bold flex items-center justify-center mb-4">
                2
              </div>
              <h4 className="font-bold text-slate-900 mb-1">Anchor on Chain</h4>
              <p className="text-xs text-slate-600">
                Patient signs transaction registering record ID and file hash to the MedicalRecordAccess contract.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 relative">
              <div className="w-8 h-8 rounded-full bg-navy-900 text-white font-bold flex items-center justify-center mb-4">
                3
              </div>
              <h4 className="font-bold text-slate-900 mb-1">Grant Granular Consent</h4>
              <p className="text-xs text-slate-600">
                Patient selects doctor, chooses specific records, sets optional expiry timestamp, and confirms on MetaMask.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 relative">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center mb-4">
                4
              </div>
              <h4 className="font-bold text-slate-900 mb-1">Decentralized Access</h4>
              <p className="text-xs text-slate-600">
                Backend queries smart contract to verify authorization before decrypting and delivering file to doctor.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-navy-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-medical-400" />
            <span className="text-lg font-bold text-white">MedVault EMR</span>
          </div>
          <p className="text-xs text-slate-400 text-center">
            College Mini-Project in Blockchain Network Technology &bull; Solidity v0.8.24 &bull; React & Tailwind
          </p>
          <div className="text-xs text-slate-400 font-mono">
            Zero-Trust Healthcare Architecture
          </div>
        </div>
      </footer>
    </div>
  );
}
