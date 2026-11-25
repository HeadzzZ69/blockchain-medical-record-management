import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';
import {
  Wallet,
  ShieldCheck,
  ArrowRight,
  UserCheck,
  Stethoscope,
  Building2,
  Key,
  AlertCircle,
  ArrowLeftRight,
  LogOut,
  CheckCircle2,
} from 'lucide-react';

export default function ConnectWalletPage() {
  const { account, userRole, connectWallet, switchAccount, logout, isConnecting, isWrongNetwork, switchNetwork } =
    useWeb3();
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const demoAccounts = [
    {
      role: 'admin',
      label: 'Admin (Deployer)',
      address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      icon: Key,
      color: 'purple',
    },
    {
      role: 'doctor',
      label: 'Doctor (Dr. Sarah)',
      address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      icon: Stethoscope,
      color: 'sky',
    },
    {
      role: 'hospital',
      label: 'Hospital (Apollo)',
      address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
      icon: Building2,
      color: 'indigo',
    },
    {
      role: 'patient',
      label: 'Patient (Robert)',
      address: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
      icon: UserCheck,
      color: 'emerald',
    },
  ];

  const handleConnect = async () => {
    try {
      setErrorMsg('');
      const success = await connectWallet();
      if (!success) {
        setErrorMsg('MetaMask connection was rejected or failed. Please try again.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Error connecting to MetaMask');
    }
  };

  const handleSwitch = async () => {
    try {
      setErrorMsg('');
      await switchAccount();
    } catch (err) {
      setErrorMsg(err.message || 'Error switching account in MetaMask');
    }
  };

  const navigateToRoleDashboard = (role) => {
    switch (role) {
      case 'patient':
        navigate('/patient');
        break;
      case 'doctor':
        navigate('/doctor');
        break;
      case 'hospital':
        navigate('/hospital');
        break;
      case 'admin':
        navigate('/admin');
        break;
      default:
        navigate('/register');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 bg-slate-50">
      <div className="max-w-lg w-full bg-white rounded-3xl border border-slate-200 shadow-xl p-8 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-medical-50 border border-medical-200 text-medical-600 flex items-center justify-center mx-auto shadow-sm">
          <Wallet className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-slate-900">Connect Your Wallet</h2>
          <p className="text-xs text-slate-500 mt-1">
            Authenticate using your MetaMask Ethereum wallet to access decentralized medical record management.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 text-left">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {isWrongNetwork && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs text-left">
            <p className="font-semibold mb-1">Wrong Network Detected</p>
            <p>Please switch to Hardhat Localhost (Chain ID: 31337).</p>
            <button
              onClick={switchNetwork}
              className="mt-2 w-full py-1.5 px-3 bg-amber-600 text-white rounded-lg font-medium text-xs hover:bg-amber-700 transition"
            >
              Switch to Hardhat Localhost
            </button>
          </div>
        )}

        <div className="space-y-3">
          {!account ? (
            <div className="space-y-2">
              <button
                onClick={handleConnect}
                disabled={isConnecting}
                className="w-full py-3.5 px-4 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-semibold text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Wallet className="w-4 h-4" />
                {isConnecting ? 'Waiting for MetaMask...' : 'Connect with MetaMask'}
              </button>

              <button
                onClick={handleSwitch}
                disabled={isConnecting}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-sm transition flex items-center justify-center gap-2"
              >
                <ArrowLeftRight className="w-3.5 h-3.5 text-medical-600" />
                Select / Switch Account in MetaMask
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span>Connected Account:</span>
                  <span className="font-bold text-emerald-600 uppercase px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[11px]">
                    {userRole || 'Detected'}
                  </span>
                </div>
                <p className="font-mono text-xs text-slate-800 break-all bg-white p-2.5 rounded-xl border border-slate-200">
                  {account}
                </p>
              </div>

              {userRole === 'none' ? (
                <div>
                  <p className="text-xs text-amber-600 font-medium mb-3">
                    Your wallet is not registered on the smart contract yet.
                  </p>
                  <button
                    onClick={() => navigate('/register')}
                    className="w-full py-3 px-4 rounded-xl bg-medical-600 hover:bg-medical-700 text-white font-semibold text-sm shadow transition flex items-center justify-center gap-2"
                  >
                    Register as Patient <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => navigateToRoleDashboard(userRole)}
                  className="w-full py-3 px-4 rounded-xl bg-medical-600 hover:bg-medical-700 text-white font-semibold text-sm shadow-md transition flex items-center justify-center gap-2"
                >
                  Enter {userRole.charAt(0).toUpperCase() + userRole.slice(1)} Dashboard{' '}
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              <div className="flex gap-2">
                <button
                  onClick={handleSwitch}
                  disabled={isConnecting}
                  className="flex-1 py-2 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5 text-medical-600" />
                  Switch Account
                </button>
                <button
                  onClick={logout}
                  className="py-2 px-3 rounded-xl border border-slate-200 bg-white hover:bg-rose-50 text-rose-600 font-semibold text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Disconnect
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Demo Accounts Quick Guide */}
        <div className="text-left pt-4 border-t border-slate-100">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Imported Demo Accounts (Hardhat Node)
          </p>
          <div className="space-y-1.5">
            {demoAccounts.map((d) => {
              const Icon = d.icon;
              const isSelected = account?.toLowerCase() === d.address.toLowerCase();
              return (
                <div
                  key={d.address}
                  className={`p-2 rounded-xl border text-xs flex items-center justify-between transition ${
                    isSelected
                      ? 'bg-medical-50/70 border-medical-300 text-medical-950 font-semibold shadow-sm'
                      : 'bg-slate-50/60 border-slate-200 text-slate-600 hover:bg-slate-100/60'
                  }`}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <Icon className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                    <span className="truncate">{d.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[10px] text-slate-400">
                      {d.address.slice(0, 6)}...{d.address.slice(-4)}
                    </span>
                    {isSelected && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-medical-700 bg-medical-100 px-1.5 py-0.2 rounded font-bold">
                        <CheckCircle2 className="w-3 h-3 text-medical-600" /> Active
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-slate-400 mt-2">
            Tip: Switch accounts in MetaMask or click "Switch Account" above to jump between roles seamlessly.
          </p>
        </div>
      </div>
    </div>
  );
}
