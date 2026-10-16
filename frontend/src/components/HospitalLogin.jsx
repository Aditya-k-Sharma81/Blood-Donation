import React, { useState } from 'react';
import { Mail, Lock, Building2, Droplets } from 'lucide-react';
import Swal from 'sweetalert2';

export default function HospitalLogin({ onLoginSuccess }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/auth/hospital/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Hospital Login failed');
      }

      setLoading(false);

      Swal.fire({
        icon: 'success',
        title: 'Hospital Login Successful',
        text: `Welcome, ${data.user.name || data.user.email}!`,
        timer: 1500,
        showConfirmButton: false,
        background: '#ffffff',
        color: '#0f172a',
        iconColor: '#10b981',
      });

      onLoginSuccess(data.user);
    } catch (err) {
      setLoading(false);

      Swal.fire({
        icon: 'error',
        title: 'Hospital Login Failed',
        text: err.message,
        confirmButtonColor: '#e11d48',
        background: '#ffffff',
        color: '#0f172a',
      });
    }
  };

  return (
    <div className="w-full max-w-md p-8 bg-white border border-slate-200 rounded-2xl shadow-xl transition-all">
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 mx-auto mb-3 shadow-xs">
          <Droplets className="w-6 h-6 fill-red-600/20" />
        </div>
        <span className="inline-block bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
          Hospital & Blood Bank Portal
        </span>
        <h2 className="text-2xl font-bold text-slate-900">
          Staff Portal Login
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Authorized hospital credentials required to view and manage blood stock
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Hospital Staff Email</label>
          <div className="relative flex items-center">
            <Mail className="absolute left-3.5 w-4 h-4 text-slate-400" />
            <input
              type="email"
              name="email"
              className="w-full bg-slate-50 border border-slate-200 focus:border-slate-500 focus:bg-white rounded-xl text-slate-900 text-sm pl-10 pr-4 py-2.5 outline-none transition-all placeholder:text-slate-400 font-medium"
              placeholder="staff@cityhospital.org"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Password</label>
          <div className="relative flex items-center">
            <Lock className="absolute left-3.5 w-4 h-4 text-slate-400" />
            <input
              type="password"
              name="password"
              className="w-full bg-slate-50 border border-slate-200 focus:border-slate-500 focus:bg-white rounded-xl text-slate-900 text-sm pl-10 pr-4 py-2.5 outline-none transition-all placeholder:text-slate-400 font-medium"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 px-4 rounded-xl shadow-xs transition-all mt-3 cursor-pointer disabled:opacity-50"
        >
          <Building2 size={16} />
          <span>{loading ? 'Authenticating...' : 'Sign In to Hospital Portal'}</span>
        </button>
      </form>
    </div>
  );
}
