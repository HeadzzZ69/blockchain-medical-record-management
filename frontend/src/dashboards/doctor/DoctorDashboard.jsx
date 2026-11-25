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
  Calendar,
  Building2,
  Award,
  PhoneCall,
  Activity,
} from 'lucide-react';

export default function DoctorDashboard() {
  const { account, userProfile } = useWeb3();
  const [stats, setStats] = useState({
    accessiblePatients: 0,
    accessibleRecords: 0,
    pendingRequests: 0,
    consultationsCount: 0,
  });
  const [doctorDetails, setDoctorDetails] = useState(null);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [recentConsultations, setRecentConsultations] = useState([]);
  const [accessiblePatientsList, setAccessiblePatientsList] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDoctorData();
  }, [account]);

  const loadDoctorData = async () => {
    if (!account) return;
    try {
      setIsLoading(true);

      const [reqRes, auditRes, statsRes, docRes] = await Promise.all([
        api.get('/access/requester').catch(() => ({ data: { requests: [] } })),
        api.get('/audit/logs').catch(() => ({ data: { blockchainEvents: [] } })),
        api.get(`/clinical/doctor-stats/${account}`).catch(() => ({ data: { stats: {} } })),
        api.get('/users/doctors').catch(() => ({ data: { doctors: [] } })),
      ]);

      const requests = reqRes.data?.requests || [];
      const pending = requests.filter((r) => r.status === 'pending').length;
      const events = auditRes.data?.blockchainEvents || [];

      // Find this doctor's profile details
      const doctors = docRes.data?.doctors || [];
      const currentDoc = doctors.find((d) => d.walletAddress?.toLowerCase() === account.toLowerCase());
      setDoctorDetails(currentDoc || null);

      const clinicalStats = statsRes.data?.stats || {};
      const patients = clinicalStats.accessiblePatients || [];
      const consults = clinicalStats.recentConsultations || [];
      const apts = clinicalStats.upcomingAppointments || [];

      setAccessiblePatientsList(patients);
      setRecentConsultations(consults);
      setUpcomingAppointments(apts);

      // Extract unique patients who granted access from events
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
            e.accessor?.toLowerCase() === account.toLowerCase() ||
            e.actor?.toLowerCase() === account.toLowerCase()
        )
        .slice(0, 5);

      setStats({
        accessiblePatients: Math.max(activePatients.size, patients.length),
        accessibleRecords: Math.max(accessibleRecords.size, clinicalStats.accessibleRecordsCount || 0),
        pendingRequests: pending,
        consultationsCount: clinicalStats.consultationsCount || consults.length,
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
            Welcome, Dr. {doctorDetails?.fullName || userProfile?.name || 'Physician'}
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

      {/* Doctor Credentials & Hospital Summary Card */}
      {doctorDetails && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">{doctorDetails.fullName}</h3>
                <p className="text-xs text-slate-500">{doctorDetails.specialization} &bull; {doctorDetails.experience || 'Senior Consultant'}</p>
              </div>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-600" /> On-Chain Verified
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-500 font-medium block">License Number</span>
              <span className="text-slate-900 font-bold text-xs mt-0.5 block font-mono">{doctorDetails.medicalLicenseNumber || doctorDetails.licenseNumber}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-500 font-medium block">Affiliated Hospital</span>
              <span className="text-slate-900 font-bold text-xs mt-0.5 block truncate">{doctorDetails.hospitalName || 'Apollo Multi-Specialty'}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-500 font-medium block">Qualifications</span>
              <span className="text-slate-900 font-bold text-xs mt-0.5 block truncate">{doctorDetails.qualification || 'MBBS, MD'}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-500 font-medium block">Practice Status</span>
              <span className="text-emerald-700 font-bold text-xs mt-0.5 block capitalize">Active Clinical Duty</span>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Accessible Patients
            </p>
            <h3 className="text-3xl font-bold text-slate-900 mt-1">{stats.accessiblePatients}</h3>
            <p className="text-xs text-sky-600 font-medium mt-1">Authorized by consent</p>
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
            <p className="text-xs text-emerald-600 font-medium mt-1">Decryption permitted</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Pending Requests
            </p>
            <h3 className="text-3xl font-bold text-slate-900 mt-1">{stats.pendingRequests}</h3>
            <p className="text-xs text-amber-600 font-medium mt-1">Awaiting consent</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Inbox className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Consultations
            </p>
            <h3 className="text-3xl font-bold text-slate-900 mt-1">{stats.consultationsCount}</h3>
            <p className="text-xs text-purple-600 font-medium mt-1">Clinical reviews</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Activity className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Upcoming Appointments & Accessible Patients Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upcoming Appointments */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-sky-600" />
              <h2 className="text-lg font-bold text-slate-900">Upcoming Patient Appointments</h2>
            </div>
            <span className="text-xs font-semibold text-sky-600 bg-sky-50 px-2.5 py-1 rounded-full">
              {upcomingAppointments.length} Scheduled
            </span>
          </div>

          {upcomingAppointments.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
              No appointments scheduled.
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingAppointments.map((apt) => (
                <div key={apt.appointmentId} className="p-4 rounded-xl border border-slate-100 bg-slate-50/80 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{apt.reason || 'Patient Consultation'}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {apt.appointmentDate} at {apt.appointmentTime}
                    </p>
                    <p className="text-[11px] font-mono text-slate-400 mt-1">Patient: {apt.patientWallet?.substring(0, 10)}...</p>
                  </div>
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 capitalize">
                    {apt.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Consenting Patients */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-bold text-slate-900">Consenting Patients Directory</h2>
            </div>
            <Link to="/doctor/patients" className="text-xs font-semibold text-medical-600 hover:underline">
              View all
            </Link>
          </div>

          {accessiblePatientsList.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
              No patients have granted access yet.
            </div>
          ) : (
            <div className="space-y-3">
              {accessiblePatientsList.map((pat, idx) => (
                <div key={idx} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                      {pat.fullName ? pat.fullName.charAt(0) : 'P'}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{pat.fullName || 'Patient'}</h4>
                      <p className="text-[11px] text-slate-500">
                        Blood: {pat.bloodGroup || 'O+'} &bull; Allergies: {pat.allergies?.length || 0}
                      </p>
                    </div>
                  </div>
                  <Link
                    to="/doctor/records"
                    className="text-xs text-sky-600 hover:text-sky-700 font-semibold flex items-center gap-1"
                  >
                    Records <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activities & Consultations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Consultations */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-purple-600" />
              <h2 className="text-lg font-bold text-slate-900">Recent Clinical Consultations</h2>
            </div>
          </div>

          {recentConsultations.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
              No consultations conducted yet.
            </div>
          ) : (
            <div className="space-y-3">
              {recentConsultations.map((con) => (
                <div key={con.consultationId} className="p-4 rounded-xl border border-slate-100 bg-slate-50/80">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{con.patientName || 'Patient'}</span>
                    <span className="text-[11px] text-slate-500">{new Date(con.consultationDate).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs font-semibold text-purple-900 mt-1">{con.diagnosis}</p>
                  {con.clinicalNotes && (
                    <p className="text-[11px] text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                      {con.clinicalNotes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Audit Activity */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">Decentralized Access Audit Log</h2>
            <Link to="/doctor/history" className="text-xs font-semibold text-medical-600 hover:underline">
              View full trail
            </Link>
          </div>

          {recentActivities.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-600">No cryptographic access events recorded yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivities.map((ev, i) => (
                <div key={i} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-800">{ev.type || ev.action}</span>
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
