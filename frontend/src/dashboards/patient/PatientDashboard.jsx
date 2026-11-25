import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWeb3 } from '../../context/Web3Context';
import api from '../../services/api';
import {
  FileText,
  UserCheck,
  ShieldAlert,
  Inbox,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  Lock,
  Upload,
} from 'lucide-react';

export default function PatientDashboard() {
  const { account, userProfile, contract } = useWeb3();
  const [stats, setStats] = useState({
    totalRecords: 0,
    doctorsCount: 0,
    pendingRequests: 0,
  });
  const [recentRecords, setRecentRecords] = useState([]);
  const [recentEvents, setRecentEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [account]);

  const loadDashboardData = async () => {
    if (!account) return;
    try {
      setIsLoading(true);
      // Fetch patient records
      const { data: recData } = await api.get('/records/patient');
      const records = recData.records || [];

      // Fetch doctors
      const { data: docData } = await api.get('/users/doctors');
      const doctors = docData.doctors || [];

      // Fetch pending requests
      const { data: reqData } = await api.get('/access/patient');
      const requests = reqData.requests || [];
      const pending = requests.filter((r) => r.status === 'pending').length;

      // Fetch audit logs
      const { data: auditData } = await api.get('/audit/logs');
      const userAudit = (auditData.blockchainEvents || [])
        .filter(
          (e) =>
            e.patient?.toLowerCase() === account.toLowerCase() ||
            e.actor?.toLowerCase() === account.toLowerCase()
        )
        .slice(0, 5);

      setStats({
        totalRecords: records.length,
        doctorsCount: doctors.length,
        pendingRequests: pending,
      });
      setRecentRecords(records.slice(0, 4));
      setRecentEvents(userAudit);
    } catch (err) {
      console.error('Error loading patient dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-r from-navy-900 via-navy-800 to-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <span className="text-xs font-semibold tracking-wider uppercase text-sky-400 bg-sky-950/60 px-3 py-1 rounded-full border border-sky-800/60 inline-block mb-3">
            Patient Portal &bull; Self-Sovereign Access
          </span>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {userProfile?.name || 'Patient'}
          </h1>
          <p className="mt-2 text-slate-300 text-sm leading-relaxed">
            All your diagnostic files and medical records are encrypted off-chain and secured under your cryptographic control.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/patient/upload"
              className="px-4 py-2.5 rounded-xl bg-medical-500 hover:bg-medical-600 text-white font-medium text-xs shadow-md transition flex items-center gap-2"
            >
              <Upload className="w-4 h-4" /> Upload New Record
            </Link>
            <Link
              to="/patient/manage-access"
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs transition flex items-center gap-2"
            >
              <UserCheck className="w-4 h-4" /> Grant Consent
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Medical Records
            </p>
            <h3 className="text-3xl font-bold text-slate-900 mt-1">{stats.totalRecords}</h3>
            <p className="text-xs text-emerald-600 font-medium mt-1">Encrypted AES-256-GCM</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Registered Doctors
            </p>
            <h3 className="text-3xl font-bold text-slate-900 mt-1">{stats.doctorsCount}</h3>
            <p className="text-xs text-sky-600 font-medium mt-1">Available for consent</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Pending Requests
            </p>
            <h3 className="text-3xl font-bold text-slate-900 mt-1">{stats.pendingRequests}</h3>
            <p className="text-xs text-amber-600 font-medium mt-1">Requires your authorization</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Inbox className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Recent Records & Audit Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Records */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">Recent Medical Records</h2>
            <Link to="/patient/records" className="text-xs font-semibold text-medical-600 hover:underline">
              View all
            </Link>
          </div>

          {recentRecords.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-600">No medical records uploaded yet.</p>
              <Link
                to="/patient/upload"
                className="inline-block mt-3 px-4 py-2 bg-medical-600 text-white rounded-lg text-xs font-medium"
              >
                Upload your first record
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentRecords.map((r) => (
                <div
                  key={r.recordId}
                  className="p-3.5 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50 flex items-center justify-between transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-slate-800">{r.fileName}</h4>
                      <p className="text-[11px] text-slate-500">
                        {r.category} &bull; {new Date(r.uploadDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono bg-white px-2 py-1 rounded border border-slate-200 text-slate-600">
                    {r.recordId}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Blockchain Events */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">Recent Blockchain Activities</h2>
            <Link to="/patient/history" className="text-xs font-semibold text-medical-600 hover:underline">
              Full history
            </Link>
          </div>

          {recentEvents.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-600">No blockchain events recorded yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentEvents.map((ev, i) => (
                <div key={i} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-800">{ev.type}</span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(ev.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-slate-500 truncate">Tx: {ev.transactionHash}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
