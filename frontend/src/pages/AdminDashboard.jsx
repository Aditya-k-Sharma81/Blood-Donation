import React, { useState, useEffect } from 'react';
import API from '../utils/api';
import { ShieldCheck, Building2, Users, Heart, PlusCircle, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ text: '', isError: false });

  // Hospital user creation form state (Admin exclusive feature!)
  const [hospitalForm, setHospitalForm] = useState({
    email: '',
    password: '',
    hospitalName: '',
    licenseNumber: '',
    city: 'City Central',
    address: 'Medical District',
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const res = await API.get('/admin/dashboard');
      if (res.data.success) {
        setStats(res.data.stats);
        setUsers(res.data.users);
      }
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Failed to fetch admin data', isError: true });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateHospitalUser = async (e) => {
    e.preventDefault();
    setCreating(true);
    setMsg({ text: '', isError: false });

    try {
      const res = await API.post('/admin/create-hospital', hospitalForm);
      if (res.data.success) {
        setMsg({ text: `🎉 Hospital User Access Created for '${hospitalForm.email}'!`, isError: false });
        setHospitalForm({
          email: '',
          password: '',
          hospitalName: '',
          licenseNumber: '',
          city: 'City Central',
          address: 'Medical District',
        });
        fetchAdminData();
      }
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Failed to create hospital user', isError: true });
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to revoke/delete this user access?')) return;
    try {
      const res = await API.delete(`/admin/users/${id}`);
      if (res.data.success) {
        setMsg({ text: 'User access revoked successfully', isError: false });
        fetchAdminData();
      }
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Delete failed', isError: true });
    }
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-73px)] flex flex-col items-center justify-center text-slate-400">
        <div className="pulse-dot mb-3 w-4 h-4" />
        Loading Admin Ecosystem Overview...
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-73px)] overflow-hidden p-6 max-w-7xl mx-auto flex flex-col justify-between space-y-4">
      
      {/* Top Header & Alert */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-500/15 border border-amber-500/30 px-3 py-1 rounded-full">
              <ShieldCheck size={14} /> System Administrator Portal
            </span>
            <h1 className="text-2xl font-black text-white mt-1">Admin Dashboard & Access Control</h1>
          </div>
        </div>

        {msg.text && (
          <div className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-medium ${msg.isError ? 'bg-rose-500/15 border-rose-500/40 text-rose-300' : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'}`}>
            {msg.isError ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
            {msg.text}
          </div>
        )}
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-4 gap-4">
        <div className="glass-card p-4 flex items-center gap-3">
          <div className="bg-rose-500/20 p-3 rounded-xl text-rose-400">
            <Heart size={22} />
          </div>
          <div>
            <div className="text-xl font-black text-white">{stats?.totalDonors || 0}</div>
            <div className="text-xs text-slate-400">Registered Donors</div>
          </div>
        </div>

        <div className="glass-card p-4 flex items-center gap-3">
          <div className="bg-blue-500/20 p-3 rounded-xl text-blue-400">
            <Building2 size={22} />
          </div>
          <div>
            <div className="text-xl font-black text-white">{stats?.totalHospitals || 0}</div>
            <div className="text-xs text-slate-400">Hospital Nodes</div>
          </div>
        </div>

        <div className="glass-card p-4 flex items-center gap-3">
          <div className="bg-amber-500/20 p-3 rounded-xl text-amber-300">
            <Users size={22} />
          </div>
          <div>
            <div className="text-xl font-black text-white">{stats?.totalUsers || 0}</div>
            <div className="text-xs text-slate-400">User Accounts</div>
          </div>
        </div>

        <div className="glass-card p-4 flex items-center gap-3">
          <div className="bg-emerald-500/20 p-3 rounded-xl text-emerald-400">
            <ShieldCheck size={22} />
          </div>
          <div>
            <div className="text-xl font-black text-white">{stats?.activeRequests || 0}</div>
            <div className="text-xs text-slate-400">Active Dispatches</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Create Hospital Form (Left) & User Accounts Table (Right) */}
      <div className="grid grid-cols-12 gap-5 flex-1 min-h-0">
        
        {/* Left: Create Hospital Access User Form */}
        <div className="col-span-5 glass-card p-5 border-blue-500/30 flex flex-col justify-between overflow-y-auto">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <PlusCircle size={20} className="text-blue-400" />
              <h3 className="text-base font-extrabold text-white">Create Hospital User Access</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Admin exclusive feature: Provision a new user account that can access the hospital portal.
            </p>

            <form onSubmit={handleCreateHospitalUser} className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Hospital Access Email (Login Field)
                </label>
                <input
                  type="email"
                  required
                  placeholder="hospital.new@centralbank.org"
                  className="input-field text-xs py-2"
                  value={hospitalForm.email}
                  onChange={(e) => setHospitalForm({ ...hospitalForm, email: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Password (Login Field)
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="input-field text-xs py-2"
                  value={hospitalForm.password}
                  onChange={(e) => setHospitalForm({ ...hospitalForm, password: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Hospital Node Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="City Central Hospital & Blood Bank"
                  className="input-field text-xs py-2"
                  value={hospitalForm.hospitalName}
                  onChange={(e) => setHospitalForm({ ...hospitalForm, hospitalName: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    License Number
                  </label>
                  <input
                    type="text"
                    placeholder="HOSP-9900-VERIFIED"
                    className="input-field text-xs py-2"
                    value={hospitalForm.licenseNumber}
                    onChange={(e) => setHospitalForm({ ...hospitalForm, licenseNumber: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    placeholder="City Central"
                    className="input-field text-xs py-2"
                    value={hospitalForm.city}
                    onChange={(e) => setHospitalForm({ ...hospitalForm, city: e.target.value })}
                  />
                </div>
              </div>

              <button type="submit" disabled={creating} className="btn btn-emerald w-full py-2.5 text-xs mt-2">
                {creating ? 'Creating Access...' : '🔑 Create Hospital User Account'}
              </button>
            </form>
          </div>
        </div>

        {/* Right: Accounts & Roles Table */}
        <div className="col-span-7 glass-card p-5 flex flex-col min-h-0">
          <h3 className="text-base font-extrabold text-white mb-3">Platform User Accounts & Roles</h3>
          <div className="flex-1 overflow-y-auto pr-1">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-slate-900/90 backdrop-blur-md">
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2.5 px-3">Name / Org</th>
                  <th className="py-2.5 px-3">Email (Login)</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-slate-100">{u.name}</td>
                    <td className="py-2.5 px-3 text-slate-400">{u.email}</td>
                    <td className="py-2.5 px-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        u.role === 'ADMIN'
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          : u.role === 'HOSPITAL'
                          ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                          : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {u.role !== 'ADMIN' && (
                        <button
                          onClick={() => handleDeleteUser(u._id)}
                          className="p-1.5 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-colors"
                          title="Revoke Access"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}
