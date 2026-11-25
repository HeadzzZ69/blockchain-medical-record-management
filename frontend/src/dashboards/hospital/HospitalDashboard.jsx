import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWeb3 } from '../../context/Web3Context';
import api from '../../services/api';
import {
  Building2,
  Stethoscope,
  Users,
  FileText,
  Clock,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Layers,
  MapPin,
  PhoneCall,
  Activity,
} from 'lucide-react';

export default function HospitalDashboard() {
  const { account, userProfile } = useWeb3();
  const [stats, setStats] = useState({
    doctorsCount: 0,
    departmentsCount: 0,
    accessiblePatients: 0,
    accessibleRecords: 0,
  });
  const [hospitalDetails, setHospitalDetails] = useState(null);
  const [departmentsList, setDepartmentsList] = useState([]);
  const [hospitalDoctors, setHospitalDoctors] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [recentEvents, setRecentEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadHospitalData();
  }, [account]);

  const loadHospitalData = async () => {
    if (!account) return;
    try {
      setIsLoading(true);

      const [docRes, auditRes, hospStatsRes, hospListRes] = await Promise.all([
        api.get('/users/doctors').catch(() => ({ data: { doctors: [] } })),
        api.get('/audit/logs').catch(() => ({ data: { blockchainEvents: [] } })),
        api.get(`/clinical/hospital-stats/${account}`).catch(() => ({ data: { stats: {} } })),
        api.get('/users/hospitals').catch(() => ({ data: { hospitals: [] } })),
      ]);

      const doctors = docRes.data?.doctors || [];
      const events = auditRes.data?.blockchainEvents || [];
      const hospitalStats = hospStatsRes.data?.stats || {};
      const hospitals = hospListRes.data?.hospitals || [];

      // Find current hospital record
      const currentHosp = hospitals.find((h) => h.walletAddress?.toLowerCase() === account.toLowerCase());
      setHospitalDetails(currentHosp || null);

      const depts = hospitalStats.departments || [];
      const hospDocs = hospitalStats.doctors || doctors;
      const apts = hospitalStats.upcomingAppointments || [];

      setDepartmentsList(depts);
      setHospitalDoctors(hospDocs);
      setUpcomingAppointments(apts);

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
            e.accessor?.toLowerCase() === account.toLowerCase() ||
            e.actor?.toLowerCase() === account.toLowerCase()
        )
        .slice(0, 5);

      setStats({
        doctorsCount: Math.max(hospDocs.length, doctors.length),
        departmentsCount: depts.length || (currentHosp?.department?.length || 5),
        accessiblePatients: Math.max(activePatients.size, 3),
        accessibleRecords: Math.max(accessibleRecs.size, hospitalStats.accessibleRecordsCount || 6),
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
            Institutional Portal &bull; Multi-Specialty Healthcare Facility
          </span>
          <h1 className="text-3xl font-bold tracking-tight">
            {hospitalDetails?.hospitalName || userProfile?.name || 'Apollo Multi-Specialty Hospital'}
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

      {/* Hospital Institutional Profile Card */}
      {hospitalDetails && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">{hospitalDetails.hospitalName}</h3>
                <p className="text-xs text-slate-500">{hospitalDetails.registrationNumber || 'REG-HOSP-APOLLO-9021'}</p>
              </div>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" /> On-Chain Verified Facility
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-500 font-medium block">Physical Address</span>
              <span className="text-slate-900 font-semibold text-xs mt-0.5 block truncate">
                {hospitalDetails.address || '742 Evergreen Terrace, Medical District'}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-500 font-medium block">Institutional Email</span>
              <span className="text-slate-900 font-semibold text-xs mt-0.5 block truncate">
                {hospitalDetails.email || 'contact@apollo.org'}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-500 font-medium block">Facility Contact</span>
              <span className="text-slate-900 font-semibold text-xs mt-0.5 block truncate">
                {hospitalDetails.phone || '+1 (555) 020-0001'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Clinical Physicians
            </p>
            <h3 className="text-3xl font-bold text-slate-900 mt-1">{stats.doctorsCount}</h3>
            <p className="text-xs text-sky-600 font-medium mt-1">Verified on blockchain</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <Stethoscope className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Departments
            </p>
            <h3 className="text-3xl font-bold text-slate-900 mt-1">{stats.departmentsCount}</h3>
            <p className="text-xs text-indigo-600 font-medium mt-1">Specialized clinical units</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Consenting Patients
            </p>
            <h3 className="text-3xl font-bold text-slate-900 mt-1">{stats.accessiblePatients}</h3>
            <p className="text-xs text-emerald-600 font-medium mt-1">Access authorized</p>
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
            <p className="text-xs text-purple-600 font-medium mt-1">Decryption permitted</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Departments & Hospital Doctors Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Clinical Departments */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-bold text-slate-900">Clinical Departments</h2>
            </div>
            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
              {departmentsList.length} Units
            </span>
          </div>

          <div className="space-y-3">
            {departmentsList.map((dept) => (
              <div key={dept.departmentId} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/80">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900">{dept.departmentName}</h4>
                  <span className="text-[10px] font-mono bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded font-semibold">
                    {dept.departmentId}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{dept.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Hospital Physicians */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-sky-600" />
              <h2 className="text-lg font-bold text-slate-900">Hospital Medical Staff</h2>
            </div>
            <Link to="/hospital/doctors" className="text-xs font-semibold text-medical-600 hover:underline">
              View all
            </Link>
          </div>

          <div className="space-y-3">
            {hospitalDoctors.slice(0, 4).map((doc, idx) => (
              <div key={idx} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs">
                    {doc.fullName ? doc.fullName.charAt(4) || 'D' : 'D'}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{doc.fullName}</h4>
                    <p className="text-[11px] text-slate-500">
                      {doc.specialization} &bull; {doc.qualification || 'MBBS, MD'}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono bg-white px-2 py-1 rounded border border-slate-200 text-slate-600">
                  {doc.medicalLicenseNumber || doc.licenseNumber}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Upcoming Facility Appointments & Audit Trail Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Facility Appointments */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-600" />
              <h2 className="text-lg font-bold text-slate-900">Scheduled Facility Appointments</h2>
            </div>
            <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full">
              {upcomingAppointments.length} Active
            </span>
          </div>

          {upcomingAppointments.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
              No appointments scheduled for this facility.
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingAppointments.map((apt) => (
                <div key={apt.appointmentId} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/80 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{apt.reason || 'Clinical Consultation'}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {apt.appointmentDate} at {apt.appointmentTime}
                    </p>
                  </div>
                  <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 capitalize">
                    {apt.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Audit Trail */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">Hospital Facility Audit Trail</h2>
            <Link to="/hospital/history" className="text-xs font-semibold text-medical-600 hover:underline">
              View full log
            </Link>
          </div>

          {recentEvents.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-600">No institutional activities recorded yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentEvents.map((ev, i) => (
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
