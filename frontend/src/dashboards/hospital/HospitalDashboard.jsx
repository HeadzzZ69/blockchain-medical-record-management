import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWeb3 } from '../../context/Web3Context';
import api from '../../services/api';
import { Building2, Stethoscope, Users, FileText, Clock, ArrowRight } from 'lucide-react';

export default function HospitalDashboard() {
  const { account, userProfile } = useWeb3();
  const [stats, setStats] = useState({
    doctorsCount: 0,
    accessiblePatients: 0,
    accessibleRecords: 0,
  });
  const [recentEvents, setRecentEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadHospitalData();
  }, [account]);

  const loadHospitalData = async () => {
    if (!account) return;
    try {
      setIsLoading(true);
      const [docRes, auditRes] = await Promise.all([
        api.get('/users/doctors'),
        api.get('/audit/logs'),
      ]);

      const doctors = docRes.data.doctors || [];
      const events = auditRes.data.blockchainEvents || [];

      const activePatients = new Set();
      const accessibleRecs = new Set();

      events.forEach((ev) => {
        if (ev.requester?.toLowerCase() === account.toLowerCase() && ev.type === 'AccessGranted') {
          activePatients.add(ev.patient);
          accessibleRecs.add(ev.recordId);
        }
      });

      const myEvents = events
        .filter(
          (e) =>
            e.requester?.toLowerCase() === account.toLowerCase() ||
            e.accessor?.toLowerCase() === account.toLowerCase()
        )
        .slice(0, 5);

      setStats({
        doctorsCount: doctors.length,
        accessiblePatients: activePatients.size,
        accessibleRecords: accessibleRecs.size,
      });
      setRecentEvents(myEvents);
    } catch (err) {
      console.error('Error loading hospital dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Hospital Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-navy-900 to-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <span className="text-xs font-semibold tracking-wider uppercase text-indigo-400 bg-indigo-950/60 px-3 py-1 rounded-full border border-indigo-800/60 inline-block mb-3">
            Institutional Portal &bull; Multi-Specialty Hospital
          </span>
          <h1 className="text-3xl font-bold tracking-tight">
            {userProfile?.name || 'Healthcare Facility'}
          </h1>
          <p className="mt-2 text-slate-300 text-sm leading-relaxed">
            Manage clinical staff, review patient records authorized for your hospital facility, and inspect decentralized audit trails.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/hospital/doctors"
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs shadow-md transition flex items-center gap-2"
            >
              <Stethoscope className="w-4 h-4" /> View Registered Doctors
            </Link>
            <Link
              to="/hospital/records"
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs transition flex items-center gap-2"
            >
              <FileText className="w-4 h-4" /> Hospital Records
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Clinical Physicians
            </p>
            <h3 className="text-3xl font-bold text-slate-900 mt-1">{stats.doctorsCount}</h3>
            <p className="text-xs text-sky-600 font-medium mt-1">Verified on smart contract</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <Stethoscope className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Consenting Patients
            </p>
            <h3 className="text-3xl font-bold text-slate-900 mt-1">{stats.accessiblePatients}</h3>
            <p className="text-xs text-emerald-600 font-medium mt-1">Hospital access authorized</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Accessible Records
            </p>
            <h3 className="text-3xl font-bold text-slate-900 mt-1">{stats.accessibleRecords}</h3>
            <p className="text-xs text-indigo-600 font-medium mt-1">Decryption permitted</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Audit History for Hospital */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">Hospital Facility Audit Trail</h2>
          <Link to="/hospital/history" className="text-xs font-semibold text-medical-600 hover:underline">
            View full log
          </Link>
        </div>

        {recentEvents.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-600">No institutional activities recorded yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentEvents.map((ev, i) => (
              <div key={i} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-slate-800">{ev.type}</span>
                  <span className="text-[10px] text-slate-500">
                    {new Date(ev.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  Record ID: <span className="font-mono">{ev.recordId}</span> &bull; Patient:{' '}
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
