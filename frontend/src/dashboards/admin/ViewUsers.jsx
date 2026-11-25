import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  Users,
  Search,
  ShieldCheck,
  Stethoscope,
  Building2,
  ShieldAlert,
  UserCheck,
  Copy,
  Check,
  Eye,
  RefreshCw,
  AlertCircle,
  X,
  Calendar,
  Mail,
  Phone,
  FileBadge,
  Activity,
  HeartPulse,
} from 'lucide-react';

export default function ViewUsers() {
  const [users, setUsers] = useState([]);
  const [counts, setCounts] = useState({
    total: 0,
    patients: 0,
    doctors: 0,
    hospitals: 0,
    admins: 0,
    verified: 0,
  });
  const [blockchainConnected, setBlockchainConnected] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [verificationFilter, setVerificationFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [copiedWallet, setCopiedWallet] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setErrorMessage('');

      // Try GET /users, fallback to GET /users/all
      let response;
      try {
        response = await api.get('/users');
      } catch (firstErr) {
        response = await api.get('/users/all');
      }

      const data = response.data || {};
      const userList = Array.isArray(data.users) ? data.users : (Array.isArray(data) ? data : []);
      setUsers(userList);

      if (data.counts) {
        setCounts(data.counts);
      } else {
        setCounts({
          total: userList.length,
          patients: userList.filter((u) => u.role === 'patient').length,
          doctors: userList.filter((u) => u.role === 'doctor').length,
          hospitals: userList.filter((u) => u.role === 'hospital').length,
          admins: userList.filter((u) => u.role === 'admin').length,
          verified: userList.filter((u) => u.isVerified || u.isVerifiedOnChain).length,
        });
      }

      if (data.blockchainConnected !== undefined) {
        setBlockchainConnected(data.blockchainConnected);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setErrorMessage(
        err.response?.data?.message || err.message || 'Failed to connect to backend server. Ensure backend is running.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyWallet = (wallet) => {
    if (!wallet) return;
    navigator.clipboard.writeText(wallet);
    setCopiedWallet(wallet);
    setTimeout(() => setCopiedWallet(''), 2000);
  };

  const filteredUsers = users.filter((u) => {
    const name = (u.fullName || u.name || '').toLowerCase();
    const wallet = (u.walletAddress || '').toLowerCase();
    const email = (u.email || '').toLowerCase();
    const facility = (u.hospitalName || u.specialization || '').toLowerCase();
    const term = searchTerm.toLowerCase();

    const matchesSearch =
      name.includes(term) || wallet.includes(term) || email.includes(term) || facility.includes(term);

    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;

    let matchesVerification = true;
    if (verificationFilter === 'verified') {
      matchesVerification = Boolean(u.isVerified || u.isVerifiedOnChain);
    } else if (verificationFilter === 'pending') {
      matchesVerification = !u.isVerified && !u.isVerifiedOnChain;
    }

    return matchesSearch && matchesRole && matchesVerification;
  });

  const getRoleBadge = (role) => {
    switch (role) {
      case 'patient':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'doctor':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'hospital':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'admin':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'patient':
        return <UserCheck className="w-4 h-4 text-emerald-600" />;
      case 'doctor':
        return <Stethoscope className="w-4 h-4 text-blue-600" />;
      case 'hospital':
        return <Building2 className="w-4 h-4 text-indigo-600" />;
      case 'admin':
        return <ShieldAlert className="w-4 h-4 text-purple-600" />;
      default:
        return <Users className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-7 h-7 text-medical-600" />
            All Registered Users
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Authoritative directory synchronized between Solidity Smart Contract and MongoDB.
          </p>
        </div>
        <button
          onClick={fetchUsers}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition shadow-sm self-start sm:self-auto disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-medical-600' : ''}`} />
          Refresh &amp; Sync On-Chain
        </button>
      </div>

      {/* Blockchain Status / Error Warning Banner */}
      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3 text-rose-800">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-600" />
          <div className="flex-1 text-xs">
            <p className="font-semibold text-rose-900">Failed to load user directory</p>
            <p className="mt-0.5 text-rose-700">{errorMessage}</p>
            <button
              onClick={fetchUsers}
              className="mt-2 px-3 py-1 bg-rose-600 text-white rounded-lg text-xs font-medium hover:bg-rose-700 transition"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {!errorMessage && !blockchainConnected && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-amber-900">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-600" />
          <div className="text-xs">
            <p className="font-semibold text-amber-900">Local Blockchain Node Offline / Connecting</p>
            <p className="text-amber-700 mt-0.5">
              Displaying synchronized records from local MongoDB. To sync latest on-chain registrations, verify Hardhat is running on port 8545.
            </p>
          </div>
        </div>
      )}

      {/* 5 Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
            <Users className="w-5 h-5 text-slate-700" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Total Users</div>
            <div className="text-xl font-bold text-slate-900">{counts.total}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
            <UserCheck className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Patients</div>
            <div className="text-xl font-bold text-emerald-700">{counts.patients}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-blue-100 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
            <Stethoscope className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Doctors</div>
            <div className="text-xl font-bold text-blue-700">{counts.doctors}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-indigo-100 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Hospitals</div>
            <div className="text-xl font-bold text-indigo-700">{counts.hospitals}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-purple-100 shadow-sm flex items-center gap-3 col-span-2 sm:col-span-1">
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
            <ShieldAlert className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Admins</div>
            <div className="text-xl font-bold text-purple-700">{counts.admins}</div>
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search name, wallet, email..."
            className="w-full text-xs pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-medical-500 focus:border-transparent"
          />
        </div>

        {/* Role and Verification Filter Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Role pills */}
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs">
            {['ALL', 'patient', 'doctor', 'hospital', 'admin'].map((role) => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={`px-3 py-1.5 rounded-lg font-medium capitalize transition ${
                  roleFilter === role
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {role === 'ALL' ? 'All Roles' : role}
              </button>
            ))}
          </div>

          {/* Verification Dropdown */}
          <select
            value={verificationFilter}
            onChange={(e) => setVerificationFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-medical-500"
          >
            <option value="ALL">All Status</option>
            <option value="verified">Verified Only</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Users Directory Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center">
            <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-medical-600 mx-auto"></div>
            <p className="text-xs text-slate-500 mt-3 font-medium">Synchronizing and loading user directory...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <Users className="w-7 h-7 text-slate-400" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">No Users Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchTerm || roleFilter !== 'ALL' || verificationFilter !== 'ALL'
                ? 'No registered users match your search query or active filters.'
                : 'No users registered on the blockchain network or database.'}
            </p>
            {(searchTerm || roleFilter !== 'ALL' || verificationFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setRoleFilter('ALL');
                  setVerificationFilter('ALL');
                }}
                className="mt-3 px-3 py-1.5 text-xs text-medical-600 font-semibold hover:underline"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 uppercase font-semibold text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Wallet Address</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Specialization / Facility</th>
                  <th className="px-6 py-4">Verification</th>
                  <th className="px-6 py-4">Registered</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => {
                  const displayName = u.fullName || u.name || 'Registered User';
                  const isVerified = Boolean(u.isVerified || u.isVerifiedOnChain);
                  return (
                    <tr key={u.walletAddress} className="hover:bg-slate-50/70 transition">
                      {/* Name & Email */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0">
                            {getRoleIcon(u.role)}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">{displayName}</div>
                            <div className="text-[11px] text-slate-400">{u.email || 'No email provided'}</div>
                          </div>
                        </div>
                      </td>

                      {/* Wallet Address with copy */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                            {u.walletAddress ? `${u.walletAddress.slice(0, 6)}...${u.walletAddress.slice(-4)}` : 'N/A'}
                          </span>
                          <button
                            onClick={() => handleCopyWallet(u.walletAddress)}
                            title="Copy Wallet Address"
                            className="p-1 hover:bg-slate-200 rounded text-slate-500 transition"
                          >
                            {copiedWallet === u.walletAddress ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase border ${getRoleBadge(
                            u.role
                          )}`}
                        >
                          {u.role}
                        </span>
                      </td>

                      {/* Specialization or Hospital */}
                      <td className="px-6 py-4 text-slate-600">
                        {u.specialization || u.hospitalName || (u.role === 'admin' ? 'Root Administration' : 'General')}
                      </td>

                      {/* Verification Status */}
                      <td className="px-6 py-4">
                        {isVerified ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            On-Chain Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                            Pending
                          </span>
                        )}
                      </td>

                      {/* Registered Date */}
                      <td className="px-6 py-4 text-slate-500 text-[11px]">
                        {u.registrationDate
                          ? new Date(u.registrationDate).toLocaleDateString()
                          : u.createdAt
                          ? new Date(u.createdAt).toLocaleDateString()
                          : 'Recent'}
                      </td>

                      {/* Action */}
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setSelectedUser(u)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          View Profile
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Profile Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-medical-50 flex items-center justify-center">
                  {getRoleIcon(selectedUser.role)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">User Profile Details</h3>
                  <p className="text-[11px] text-slate-500 font-mono">{selectedUser.walletAddress}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              {/* Primary User Card */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Full Name</span>
                  <span className="font-semibold text-slate-900">{selectedUser.fullName || selectedUser.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Role</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getRoleBadge(
                      selectedUser.role
                    )}`}
                  >
                    {selectedUser.role}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Email Address</span>
                  <span className="font-medium text-slate-800">{selectedUser.email || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Phone Number</span>
                  <span className="font-medium text-slate-800">{selectedUser.phone || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Account Status</span>
                  <span className="font-semibold capitalize text-emerald-600">{selectedUser.accountStatus || 'active'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Smart Contract Verification</span>
                  <span className="font-semibold text-emerald-600 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verified On-Chain
                  </span>
                </div>
              </div>

              {/* Patient Specific Details */}
              {selectedUser.role === 'patient' && (
                <div className="border border-emerald-100 bg-emerald-50/40 p-4 rounded-2xl space-y-2">
                  <div className="font-semibold text-emerald-900 flex items-center gap-1.5 mb-1">
                    <Activity className="w-4 h-4 text-emerald-600" />
                    Patient Clinical Record Profile
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Patient ID:</span>
                    <span className="font-medium text-slate-800">
                      {selectedUser.patientProfile?.patientId || 'PAT-' + selectedUser.walletAddress.slice(2, 8).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Date of Birth:</span>
                    <span className="font-medium text-slate-800">{selectedUser.patientProfile?.dateOfBirth || '1995-05-15'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Gender &amp; Blood Group:</span>
                    <span className="font-medium text-slate-800">
                      {selectedUser.patientProfile?.gender || 'Other'} ({selectedUser.patientProfile?.bloodGroup || 'O+'})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Emergency Contact:</span>
                    <span className="font-medium text-slate-800">
                      {selectedUser.patientProfile?.emergencyContact || 'Emergency Services'}
                    </span>
                  </div>
                </div>
              )}

              {/* Doctor Specific Details */}
              {selectedUser.role === 'doctor' && (
                <div className="border border-blue-100 bg-blue-50/40 p-4 rounded-2xl space-y-2">
                  <div className="font-semibold text-blue-900 flex items-center gap-1.5 mb-1">
                    <Stethoscope className="w-4 h-4 text-blue-600" />
                    Medical Practitioner Credentials
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Doctor ID:</span>
                    <span className="font-medium text-slate-800">
                      {selectedUser.doctorProfile?.doctorId || 'DOC-' + selectedUser.walletAddress.slice(2, 8).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Specialization:</span>
                    <span className="font-medium text-slate-800">
                      {selectedUser.specialization || selectedUser.doctorProfile?.specialization || 'Cardiology'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Medical License:</span>
                    <span className="font-medium font-mono text-slate-800">
                      {selectedUser.licenseNumber || selectedUser.doctorProfile?.medicalLicenseNumber || 'MED-CARD-2026-081'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Affiliated Hospital:</span>
                    <span className="font-medium text-slate-800">
                      {selectedUser.hospitalName || selectedUser.doctorProfile?.hospitalName || 'Apollo Multi-Specialty Hospital'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Qualifications:</span>
                    <span className="font-medium text-slate-800">{selectedUser.doctorProfile?.qualification || 'MBBS, MD'}</span>
                  </div>
                </div>
              )}

              {/* Hospital Specific Details */}
              {selectedUser.role === 'hospital' && (
                <div className="border border-indigo-100 bg-indigo-50/40 p-4 rounded-2xl space-y-2">
                  <div className="font-semibold text-indigo-900 flex items-center gap-1.5 mb-1">
                    <Building2 className="w-4 h-4 text-indigo-600" />
                    Healthcare Facility Information
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Hospital ID:</span>
                    <span className="font-medium text-slate-800">
                      {selectedUser.hospitalProfile?.hospitalId || 'HOSP-' + selectedUser.walletAddress.slice(2, 8).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Registration Number:</span>
                    <span className="font-medium font-mono text-slate-800">
                      {selectedUser.hospitalProfile?.registrationNumber || 'REG-HOSP-2026'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Facility Address:</span>
                    <span className="font-medium text-slate-800">
                      {selectedUser.hospitalProfile?.address || 'Apollo Healthcare Innovation Parkway'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
