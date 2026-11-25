import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWeb3 } from '../../context/Web3Context';
import api from '../../services/api';
import { Key, Stethoscope, Building2, Users, History, ShieldAlert } from 'lucide-react';

export default function AdminDashboard() {
  const { account, contractAddress } = useWeb3();
  const [stats, setStats] = useState({
    doctorsCount: 0,
    hospitalsCount: 0,
    usersCount: 0,
    eventsCount: 0,
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAdminStats();
  }, [account]);

  const loadAdminStats = async () => {
    try {
      setIsLoading(true);
      const [usersRes, auditRes] = await Promise.all([
        api.get('/users/all'),
        api.get('/audit/logs'),
      ]);

      const allUsers = usersRes.data.users || [];
      const doctors = allUsers.filter((u) => u.role === 'doctor');
      const hospitals = allUsers.filter((u) => u.role === 'hospital');
      const events = auditRes.data.blockchainEvents || [];

      setStats({
        doctorsCount: doctors.length,
        hospitalsCount: hospitals.length,
        usersCount: allUsers.length,
        eventsCount: events.length,
      });
      setRecentUsers(allUsers.slice(0, 5));
    } catch (err) {
      console.error('Error loading admin stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-navy-900 to-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <span className="text-xs font-semibold tracking-wider uppercase text-purple-400 bg-purple-950/60 px-3 py-1 rounded-full border border-purple-800/60 inline-block mb-3">
            System Administrator &bull; Smart Contract Owner
          </span>
          <h1 className="text-3xl font-bold tracking-tight">System Admin Console</h1>
          <p className="mt-2 text-slate-300 text-sm leading-relaxed">
            Verify healthcare providers, deploy official practitioner credentials to the smart contract, and monitor consensus events.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/admin/register-doctor"
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-medium text-xs shadow-md transition flex items-center gap-2"
            >
              <Stethoscope className="w-4 h-4" /> Register Doctor
            </Link>
            <Link
              to="/admin/register-hospital"
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs shadow-md transition flex items-center gap-2"
            >
              <Building2 className="w-4 h-4" /> Register Hospital
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Users</p>
            <h3 className="text-3xl font-bold text-slate-900 mt-1">{stats.usersCount}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Registered Doctors
            </p>
            <h3 className="text-3xl font-bold text-slate-900 mt-1">{stats.doctorsCount}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <Stethoscope className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Registered Hospitals
            </p>
            <h3 className="text-3xl font-bold text-slate-900 mt-1">{stats.hospitalsCount}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              On-Chain Events
            </p>
            <h3 className="text-3xl font-bold text-slate-900 mt-1">{stats.eventsCount}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <History className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Recent Users Table */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">Recently Registered Users</h2>
          <Link to="/admin/users" className="text-xs font-semibold text-purple-600 hover:underline">
            View all users
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 uppercase font-semibold text-slate-700 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">Name</th>
                <th className="px-6 py-3.5">Wallet Address</th>
                <th className="px-6 py-3.5">Assigned Role</th>
                <th className="px-6 py-3.5">Registration Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentUsers.map((u) => (
                <tr key={u.walletAddress} className="hover:bg-slate-50/80 transition">
                  <td className="px-6 py-4 font-semibold text-slate-900">{u.name}</td>
                  <td className="px-6 py-4 font-mono text-slate-600">{u.walletAddress}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-800">
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
