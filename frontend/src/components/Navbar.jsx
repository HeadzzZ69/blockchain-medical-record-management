import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';
import {
  ShieldCheck,
  Wallet,
  LogOut,
  AlertTriangle,
  UserCheck,
  Stethoscope,
  Building2,
  Key,
  ArrowLeftRight,
  Copy,
  Check,
} from 'lucide-react';

export default function Navbar() {
  const { account, userRole, connectWallet, switchAccount, logout, isConnecting, isWrongNetwork, switchNetwork } =
    useWeb3();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const getDashboardPath = () => {
    switch (userRole) {
      case 'patient':
        return '/patient';
      case 'doctor':
        return '/doctor';
      case 'hospital':
        return '/hospital';
      case 'admin':
        return '/admin';
      default:
        return '/connect';
    }
  };

  const getRoleBadge = () => {
    switch (userRole) {
      case 'patient':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <UserCheck className="w-3 h-3" /> Patient
          </span>
        );
      case 'doctor':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 border border-sky-300">
            <Stethoscope className="w-3 h-3" /> Doctor
          </span>
        );
      case 'hospital':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-300">
            <Building2 className="w-3 h-3" /> Hospital
          </span>
        );
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-300">
            <Key className="w-3 h-3" /> Admin
          </span>
        );
      default:
        return null;
    }
  };

  const copyAddress = () => {
    if (!account) return;
    navigator.clipboard.writeText(account);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200">
      {isWrongNetwork && (
        <div className="bg-amber-500 text-white px-4 py-2 text-sm flex items-center justify-between font-medium">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span>Wrong Network detected! Please switch to Hardhat Localhost (Chain ID: 31337).</span>
          </div>
          <button
            onClick={switchNetwork}
            className="px-3 py-1 bg-white text-amber-700 rounded font-semibold text-xs hover:bg-amber-50 transition"
          >
            Switch Network
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-navy-900 to-medical-600 flex items-center justify-center text-white shadow-md shadow-medical-500/20 group-hover:scale-105 transition">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-navy-900 flex items-center gap-1">
              Med<span className="text-medical-600">Vault</span>
            </span>
            <span className="text-[10px] block -mt-1 font-semibold text-slate-500 tracking-wider uppercase">
              Blockchain EMR
            </span>
          </div>
        </Link>

        {/* Navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <Link to="/" className="hover:text-medical-600 transition">
            Home
          </Link>
          <Link to="/about" className="hover:text-medical-600 transition">
            About & Architecture
          </Link>
          {account && (
            <Link to={getDashboardPath()} className="text-medical-600 font-semibold hover:text-medical-700 transition">
              My Dashboard
            </Link>
          )}
        </nav>

        {/* Right Action buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {account ? (
            <div className="flex items-center gap-2">
              {getRoleBadge()}

              {/* Wallet Address with copy */}
              <div
                onClick={copyAddress}
                title="Click to copy full address"
                className="cursor-pointer flex items-center gap-1.5 text-xs font-mono font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg border border-slate-200 transition"
              >
                <span>{account.slice(0, 6)}...{account.slice(-4)}</span>
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              </div>

              {/* Switch Account button */}
              <button
                onClick={switchAccount}
                disabled={isConnecting}
                title="Switch Account in MetaMask"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition disabled:opacity-50"
              >
                <ArrowLeftRight className="w-3.5 h-3.5 text-medical-600" />
                <span className="hidden md:inline">Switch</span>
              </button>

              {/* Disconnect button */}
              <button
                onClick={() => {
                  logout();
                  navigate('/');
                }}
                title="Disconnect Wallet"
                className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={connectWallet}
              disabled={isConnecting}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-navy-900 hover:bg-navy-800 text-white text-sm font-medium shadow transition disabled:opacity-50"
            >
              <Wallet className="w-4 h-4" />
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
