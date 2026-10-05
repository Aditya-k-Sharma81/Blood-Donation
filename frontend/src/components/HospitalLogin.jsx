import React, { useState } from 'react';
import { Mail, Lock, Building2 } from 'lucide-react';
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
        title: 'Hospital Login Successful!',
        text: data.message,
        timer: 1800,
        showConfirmButton: false,
        background: '#ffffff',
        color: '#0f172a',
        iconColor: '#0284c7',
      });

      onLoginSuccess(data.user);
    } catch (err) {
      setLoading(false);

      Swal.fire({
        icon: 'error',
        title: 'Hospital Login Failed',
        text: err.message,
        confirmButtonColor: '#0284c7',
        background: '#ffffff',
        color: '#0f172a',
      });
    }
  };

  return (
    <div className="w-full max-w-md p-8 bg-white border border-slate-200 rounded-2xl shadow-xl transition-all">
      <div className="text-center mb-6">
        <span className="inline-block bg-sky-50 text-sky-700 border border-sky-200 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
          🏥 Central Hospital
        </span>
        <h2 className="text-2xl font-bold text-slate-900">
          Hospital Login
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Hospital & Blood Bank Staff Portal
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5">Hospital Email</label>
          <div className="relative flex items-center">
            <Mail className="absolute left-3.5 w-4 h-4 text-slate-400" />
            <input
              type="email"
              name="email"
              className="w-full bg-slate-50 border border-slate-300 focus:border-sky-600 focus:ring-2 focus:ring-sky-600/20 rounded-xl text-slate-900 text-sm pl-10 pr-4 py-2.5 outline-none transition-all placeholder:text-slate-400"
              placeholder="hospital@central.org"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5">Password</label>
          <div className="relative flex items-center">
            <Lock className="absolute left-3.5 w-4 h-4 text-slate-400" />
            <input
              type="password"
              name="password"
              className="w-full bg-slate-50 border border-slate-300 focus:border-sky-600 focus:ring-2 focus:ring-sky-600/20 rounded-xl text-slate-900 text-sm pl-10 pr-4 py-2.5 outline-none transition-all placeholder:text-slate-400"
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
          className="w-full flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold py-3 px-4 rounded-xl shadow-md transition-all mt-2 cursor-pointer disabled:opacity-50"
        >
          <Building2 size={18} />
          {loading ? 'Authenticating...' : 'Hospital Login'}
        </button>
      </form>
    </div>
  );
}
