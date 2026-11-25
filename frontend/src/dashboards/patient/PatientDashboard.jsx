import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWeb3 } from '../../context/Web3Context';
import api from '../../services/api';
import {
  FileText,
  UserCheck,
  Inbox,
  Clock,
  Upload,
  Calendar,
  Pill,
  FlaskConical,
  Activity,
  Heart,
  AlertCircle,
  PhoneCall,
  User,
  Shield,
  Stethoscope,
} from 'lucide-react';

export default function PatientDashboard() {
  const { account, userProfile } = useWeb3();
  const [stats, setStats] = useState({
    totalRecords: 0,
    doctorsCount: 0,
    pendingRequests: 0,
    prescriptionsCount: 0,
  });
  const [patientDetails, setPatientDetails] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [labReports, setLabReports] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [appointments, setAppointments] = useState([]);
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

      const [recRes, docRes, reqRes, auditRes, clinicalRes] = await Promise.all([
        api.get('/records/patient').catch(() => ({ data: { records: [] } })),
        api.get('/users/doctors').catch(() => ({ data: { doctors: [] } })),
        api.get('/access/patient').catch(() => ({ data: { requests: [] } })),
        api.get('/audit/logs').catch(() => ({ data: { blockchainEvents: [] } })),
        api.get(`/clinical/summary/${account}`).catch(() => ({ data: { summary: {} } })),
      ]);

      const records = recRes.data?.records || [];
      const doctors = docRes.data?.doctors || [];
      const requests = reqRes.data?.requests || [];
      const pending = requests.filter((r) => r.status === 'pending').length;
      const events = auditRes.data?.blockchainEvents || [];

      const clinicalSummary = clinicalRes.data?.summary || {};
      const rxList = clinicalSummary.prescriptions || [];
      const labList = clinicalSummary.labReports || [];
      const consultList = clinicalSummary.consultations || [];
      const aptList = clinicalSummary.appointments || [];

      setPatientDetails(clinicalSummary.patient || null);
      setPrescriptions(rxList);
      setLabReports(labList);
      setConsultations(consultList);
      setAppointments(aptList);

      const userAudit = events
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
        prescriptionsCount: rxList.length,
      });
      setRecentRecords(records.slice(0, 5));
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
            Welcome back, {userProfile?.name || patientDetails?.fullName || 'Patient'}
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

      {/* Patient Health Profile Card */}
      {patientDetails && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-medical-50 text-medical-600 flex items-center justify-center font-bold">
                <Heart className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Personal Health Profile</h3>
                <p className="text-xs text-slate-500">Verified identity: {patientDetails.patientId || 'PAT-DEMO'}</p>
              </div>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Active Patient
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-500 font-medium block">Blood Group</span>
              <span className="text-slate-900 font-bold text-sm mt-0.5 block">{patientDetails.bloodGroup || 'O+'}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-500 font-medium block">Date of Birth</span>
              <span className="text-slate-900 font-bold text-sm mt-0.5 block">{patientDetails.dateOfBirth || '1988-06-14'}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-500 font-medium block">Known Allergies</span>
              <span className="text-rose-600 font-semibold text-xs mt-0.5 block truncate">
                {patientDetails.allergies && patientDetails.allergies.length > 0
                  ? patientDetails.allergies.join(', ')
                  : 'None declared'}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-500 font-medium block">Chronic Conditions</span>
              <span className="text-amber-700 font-semibold text-xs mt-0.5 block truncate">
                {patientDetails.existingConditions && patientDetails.existingConditions.length > 0
                  ? patientDetails.existingConditions.join(', ')
                  : 'None declared'}
              </span>
            </div>
          </div>

          {patientDetails.emergencyContact && (
            <div className="mt-3 p-3 rounded-xl bg-sky-50/50 border border-sky-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-sky-800">
                <PhoneCall className="w-4 h-4 text-sky-600" />
                <span className="font-semibold">Emergency Contact:</span>
                <span>
                  {typeof patientDetails.emergencyContact === 'object'
                    ? `${patientDetails.emergencyContact.name} (${patientDetails.emergencyContact.relation || 'Contact'} - ${patientDetails.emergencyContact.phone})`
                    : patientDetails.emergencyContact}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Medical Records
            </p>
            <h3 className="text-3xl font-bold text-slate-900 mt-1">{stats.totalRecords}</h3>
            <p className="text-xs text-emerald-600 font-medium mt-1">Encrypted AES-256</p>
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
            <p className="text-xs text-amber-600 font-medium mt-1">Requires approval</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Inbox className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Prescriptions
            </p>
            <h3 className="text-3xl font-bold text-slate-900 mt-1">{stats.prescriptionsCount}</h3>
            <p className="text-xs text-purple-600 font-medium mt-1">Clinical regimens</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Pill className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Clinical Prescriptions & Lab Reports Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Active Prescriptions */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Pill className="w-5 h-5 text-purple-600" />
              <h2 className="text-lg font-bold text-slate-900">Active Prescriptions</h2>
            </div>
            <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full">
              {prescriptions.length} Active
            </span>
          </div>

          {prescriptions.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
              No active prescriptions on file.
            </div>
          ) : (
            <div className="space-y-3">
              {prescriptions.map((rx) => (
                <div key={rx.prescriptionId} className="p-4 rounded-xl border border-slate-100 bg-slate-50/80">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{rx.diagnosis}</h4>
                      <p className="text-[11px] text-slate-500">
                        Prescribed by {rx.doctorName || 'Attending Physician'} &bull; {rx.hospitalName || 'Clinic'}
                      </p>
                    </div>
                    <span className="text-[10px] font-mono bg-purple-100 text-purple-800 px-2 py-0.5 rounded font-semibold">
                      {rx.prescriptionId}
                    </span>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-200/60 space-y-1.5">
                    {rx.medications && rx.medications.map((m, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800">{m.name} ({m.dosage})</span>
                        <span className="text-slate-500 text-[11px]">{m.frequency}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Diagnostic Lab Reports */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-sky-600" />
              <h2 className="text-lg font-bold text-slate-900">Diagnostic Lab Reports</h2>
            </div>
            <span className="text-xs font-semibold text-sky-600 bg-sky-50 px-2.5 py-1 rounded-full">
              {labReports.length} Reports
            </span>
          </div>

          {labReports.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
              No diagnostic lab tests recorded.
            </div>
          ) : (
            <div className="space-y-3">
              {labReports.map((lab) => (
                <div key={lab.reportId} className="p-4 rounded-xl border border-slate-100 bg-slate-50/80">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{lab.testName}</h4>
                      <p className="text-[11px] text-slate-500">
                        {lab.category} &bull; {new Date(lab.testDate).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-semibold uppercase">
                      {lab.status || 'Completed'}
                    </span>
                  </div>

                  {lab.results && lab.results.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-slate-200/60 grid grid-cols-2 gap-2 text-[11px]">
                      {lab.results.slice(0, 4).map((r, i) => (
                        <div key={i} className="flex items-center justify-between bg-white px-2 py-1 rounded border border-slate-100">
                          <span className="text-slate-600 truncate">{r.parameter}:</span>
                          <span className={`font-semibold ml-1 ${r.flag === 'abnormal' ? 'text-rose-600' : 'text-slate-900'}`}>
                            {r.value} {r.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  {lab.summary && (
                    <p className="mt-2 text-[11px] text-slate-600 italic bg-white p-2 rounded border border-slate-100">
                      "{lab.summary}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Consultations & Upcoming Appointments Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Previous Clinical Consultations */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-bold text-slate-900">Clinical Consultations</h2>
            </div>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
              {consultations.length} Consultations
            </span>
          </div>

          {consultations.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
              No previous clinical consultations.
            </div>
          ) : (
            <div className="space-y-3">
              {consultations.map((con) => (
                <div key={con.consultationId} className="p-4 rounded-xl border border-slate-100 bg-slate-50/80">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{con.doctorName || 'Physician'}</span>
                    <span className="text-[11px] text-slate-500">{new Date(con.consultationDate).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs font-semibold text-emerald-800 mt-1">{con.diagnosis}</p>
                  {con.clinicalNotes && (
                    <p className="text-[11px] text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">
                      {con.clinicalNotes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Appointments */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-sky-600" />
              <h2 className="text-lg font-bold text-slate-900">Upcoming Appointments</h2>
            </div>
            <span className="text-xs font-semibold text-sky-600 bg-sky-50 px-2.5 py-1 rounded-full">
              {appointments.length} Booked
            </span>
          </div>

          {appointments.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
              No upcoming appointments.
            </div>
          ) : (
            <div className="space-y-3">
              {appointments.map((apt) => (
                <div key={apt.appointmentId} className="p-4 rounded-xl border border-slate-100 bg-slate-50/80 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{apt.reason || 'General Follow-up'}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {apt.appointmentDate} at {apt.appointmentTime}
                    </p>
                    {apt.notes && <p className="text-[11px] text-slate-600 mt-1">{apt.notes}</p>}
                  </div>
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 capitalize">
                    {apt.status}
                  </span>
                </div>
              ))}
            </div>
          )}
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
                      <h4 className="text-xs font-semibold text-slate-800">{r.recordTitle || r.fileName}</h4>
                      <p className="text-[11px] text-slate-500">
                        {r.category || r.recordType} &bull; {new Date(r.uploadDate).toLocaleDateString()}
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
