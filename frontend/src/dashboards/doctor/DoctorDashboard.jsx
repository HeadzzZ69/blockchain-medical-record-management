import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWeb3 } from '../../context/Web3Context';
import api from '../../services/api';
import {
  Users,
  FileText,
  Clock,
  Inbox,
  ShieldCheck,
  Stethoscope,
  ArrowRight,
} from 'lucide-react';

export default function DoctorDashboard() {
  const { account, userProfile } = useWeb3();
  const [stats, setStats] = useState({
    accessiblePatients: 0,
    accessibleRecords: 0,
    pendingRequests: 0,
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDoctorData();
  }, [account]);

  const loadDoctorData = async () => {
    if (!account) return;
    try {
      setIsLoading(true);

      const [reqRes, auditRes] = await Promise.all([
        api.get('/access/requester'),
        api.get('/audit/logs'),
      ]);

      const requests = reqRes.data.requests || [];
      const pending = requests.filter((r) => r.status === 'pending').length;

      // Extract unique patients who granted access
      const events = auditRes.data.blockchainEvents || [];
      const activePatients = new Set();
      const accessibleRecords = new Set();

      events.forEach((ev) => {
        if (ev.requester?.toLowerCase() === account.toLowerCase() && ev.type === 'AccessGranted') {
          activePatients.add(ev.patient);
          accessibleRecords.add(ev.recordId);
        }
      });

      // Filter recent activities by this doctor
      const myAudit = events
        .filter(
          (e) =>
            e.requester?.toLowerCase() === account.toLowerCase() ||
            e.accessor?.toLowerCase() === account.toLowerCase()
        )
        .slice(0, 5);

      setStats({
        accessiblePatients: activePatients.size,
        accessibleRecords: accessibleRecords.size,
        pendingRequests: pending,
      });
      setRecentActivities(myAudit);
    } catch (err) {
      console.error('Error loading doctor dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-sky-900 via-navy-900 to-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <span className="text-xs font-semibold tracking-wider uppercase text-sky-400 bg-sky-950/60 px-3 py-1 rounded-full border border-sky-800/60 inline-block mb-3">
            Physician Portal &bull; Verified Practitioner
          </span>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome, Dr. {userProfile?.name || 'Physician'}
          </h1>
          <p className="mt-2 text-slate-300 text-sm leading-relaxed">
            Access patient diagnostics with verified on-chain consent. All record decrypt requests are cryptographically audited on the blockchain.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/doctor/request-access"
              className="px-4 py-2.5 rounded-xl bg-medical-500 hover:bg-medical-600 text-white font-medium text-xs shadow-md transition flex items-center gap-2"
            >
              <Inbox className="w-4 h-4" /> Request Patient Access
            </Link>
            <Link
              to="/doctor/records"
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs transition flex items-center gap-2"
            >
              <FileText className="w-4 h-4" /> View Patient Records
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Accessible Patients
            </p>
            <h3 className="text-3xl font-bold text-slate-900 mt-1">{stats.accessiblePatients}</h3>
            <p className="text-xs text-sky-600 font-medium mt-1">Authorized by patients</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Accessible Records
            </p>
            <h3 className="text-3xl font-bold text-slate-900 mt-1">{stats.accessibleRecords}</h3>
            <p className="text-xs text-emerald-600 font-medium mt-1">Ready for decryption</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Pending Access Requests
            </p>
            <h3 className="text-3xl font-bold text-slate-900 mt-1">{stats.pendingRequests}</h3>
            <p className="text-xs text-amber-600 font-medium mt-1">Awaiting patient consent</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Inbox className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">Recent Practitioner Activities</h2>
          <Link to="/doctor/history" className="text-xs font-semibold text-medical-600 hover:underline">
            View full log
          </Link>
        </div>

        {recentActivities.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-600">No recorded activities yet.</p>
            <p className="text-xs text-slate-400 mt-1">
              Submit an access request or inspect authorized patient records.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentActivities.map((ev, i) => (
              <div key={i} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-slate-800">{ev.type}</span>
                  <span className="text-[10px] text-slate-500">
                    {new Date(ev.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  Record: <span className="font-mono font-medium">{ev.recordId}</span> &bull; Patient:{' '}
                  <span className="font-mono text-slate-500">{ev.patient}</span>
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
