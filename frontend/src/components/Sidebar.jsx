import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Upload,
  UserCheck,
  ShieldAlert,
  Inbox,
  History,
  User,
  Users,
  Building2,
  Stethoscope,
  KeyRound,
} from 'lucide-react';
import { useWeb3 } from '../context/Web3Context';

const getInitials = (name, role = 'user') => {
  if (typeof name !== 'string' || !name.trim()) {
    if (role === 'doctor') return 'DR';
    if (role === 'hospital') return 'H';
    if (role === 'admin') return 'AD';
    return 'PT';
  }
  const clean = name.replace(/^Dr\.\s*/i, '').trim();
  const parts = (clean || name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
};

export default function Sidebar({ role }) {
  const { userProfile, account } = useWeb3();

  const getLinks = () => {
    if (role === 'patient') {
      return [
        { to: '/patient', label: 'Overview', icon: LayoutDashboard, end: true },
        { to: '/patient/records', label: 'My Medical Records', icon: FileText },
        { to: '/patient/upload', label: 'Upload Record', icon: Upload },
        { to: '/patient/manage-access', label: 'Manage Access', icon: UserCheck },
        { to: '/patient/revoke-access', label: 'Revoke Access', icon: ShieldAlert },
        { to: '/patient/requests', label: 'Access Requests', icon: Inbox },
        { to: '/patient/history', label: 'Audit History', icon: History },
        { to: '/patient/profile', label: 'Profile', icon: User },
      ];
    }

    if (role === 'doctor') {
      return [
        { to: '/doctor', label: 'Overview', icon: LayoutDashboard, end: true },
        { to: '/doctor/patients', label: 'Authorized Patients', icon: Users },
        { to: '/doctor/records', label: 'Patient Records', icon: FileText },
        { to: '/doctor/request-access', label: 'Request Access', icon: Inbox },
        { to: '/doctor/history', label: 'Access History', icon: History },
        { to: '/doctor/profile', label: 'Doctor Profile', icon: Stethoscope },
      ];
    }

    if (role === 'hospital') {
      return [
        { to: '/hospital', label: 'Overview', icon: LayoutDashboard, end: true },
        { to: '/hospital/doctors', label: 'Hospital Doctors', icon: Stethoscope },
        { to: '/hospital/patients', label: 'Authorized Patients', icon: Users },
        { to: '/hospital/records', label: 'Accessible Records', icon: FileText },
        { to: '/hospital/history', label: 'Hospital Audit Logs', icon: History },
        { to: '/hospital/profile', label: 'Hospital Profile', icon: Building2 },
      ];
    }

    if (role === 'admin') {
      return [
        { to: '/admin', label: 'Admin Overview', icon: LayoutDashboard, end: true },
        { to: '/admin/register-doctor', label: 'Register Doctor', icon: Stethoscope },
        { to: '/admin/register-hospital', label: 'Register Hospital', icon: Building2 },
        { to: '/admin/users', label: 'All Registered Users', icon: Users },
        { to: '/admin/audit', label: 'Global Audit Trail', icon: History },
      ];
    }

    return [];
  };

  const links = getLinks();

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 min-h-[calc(100vh-4rem)] border-r border-slate-800">
      {/* User Info Header */}
      <div className="p-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-medical-400 font-bold border border-slate-700">
            {getInitials(userProfile?.name, role)}
          </div>
          <div className="overflow-hidden">
            <h4 className="text-sm font-semibold text-white truncate">
              {userProfile?.name || (role === 'doctor' ? 'Dr. Physician' : 'Authorized User')}
            </h4>
            <span className="text-xs uppercase tracking-wider text-medical-400 font-medium">
              {role}
            </span>
          </div>
        </div>
        {account && (
          <p className="mt-2 text-[11px] font-mono text-slate-400 truncate bg-slate-800/60 px-2 py-1 rounded">
            {account}
          </p>
        )}
      </div>

      {/* Nav Menu */}
      <nav className="p-3 space-y-1 flex-1">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? 'bg-medical-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{link.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800 text-[11px] text-slate-500">
        <p className="font-semibold text-slate-400">Consensus & Audit Trail</p>
        <p>Solidity v0.8.24 on Hardhat</p>
      </div>
    </aside>
  );
}
