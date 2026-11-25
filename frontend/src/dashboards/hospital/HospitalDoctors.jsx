import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Stethoscope, Search, ShieldCheck } from 'lucide-react';

export default function HospitalDoctors() {
  const [doctors, setDoctors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      setIsLoading(true);
      const { data } = await api.get('/users/doctors');
      setDoctors(data.doctors || []);
    } catch (err) {
      console.error('Error fetching doctors:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = doctors.filter(
    (d) =>
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.walletAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.specialization && d.specialization.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Hospital Medical Staff</h1>
        <p className="text-xs text-slate-500 mt-1">
          Doctors and clinical practitioners verified and registered on the blockchain network.
        </p>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by physician name or specialization..."
            className="w-full text-xs pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-medical-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-medical-600 mx-auto"></div>
            <p className="text-xs text-slate-500 mt-2">Loading medical personnel...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Stethoscope className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-700">No Doctors Found</h3>
            <p className="text-xs text-slate-500 mt-1">
              No doctors are registered yet in the system.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 uppercase font-semibold text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Doctor Name</th>
                  <th className="px-6 py-3.5">Specialization</th>
                  <th className="px-6 py-3.5">License ID</th>
                  <th className="px-6 py-3.5">Wallet Address</th>
                  <th className="px-6 py-3.5">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((d) => (
                  <tr key={d.walletAddress} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4 font-semibold text-slate-900">{d.name}</td>
                    <td className="px-6 py-4 text-slate-700">
                      {d.specialization || 'General Medicine'}
                    </td>
                    <td className="px-6 py-4 font-mono text-[11px] text-slate-600">
                      {d.licenseNumber || 'VERIFIED-DOC'}
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-600">{d.walletAddress}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                        <ShieldCheck className="w-3 h-3" /> Smart Contract Role
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
