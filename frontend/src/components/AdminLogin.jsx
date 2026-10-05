import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ShieldCheck } from 'lucide-react';
import Swal from 'sweetalert2';

export default function AdminLogin({ onLoginSuccess }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/auth/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Admin authentication failed');
      }

      setLoading(false);

      Swal.fire({
        icon: 'success',
        title: 'Admin Authenticated!',
        text: data.message,
        timer: 1800,
        showConfirmButton: false,
        background: '#ffffff',
        color: '#0f172a',
        iconColor: '#4f46e5',
      });

      onLoginSuccess(data.user);
      navigate('/admin');
    } catch (err) {
      setLoading(false);

      Swal.fire({
        icon: 'error',
        title: 'Admin Access Denied',
        text: err.message,
        confirmButtonColor: '#4f46e5',
        background: '#ffffff',
        color: '#0f172a',
      });
    }
  };

  return (
    <div className="w-full max-w-md p-8 bg-white border border-slate-200 rounded-2xl shadow-xl transition-all">
      <div className="text-center mb-6">
        <span className="inline-block bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
          👨‍💼 System Admin
        </span>
        <h2 className="text-2xl font-bold text-slate-900">
          Admin Login
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          System Administrator authentication interface
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5">Admin Email</label>
          <div className="relative flex items-center">
            <Mail className="absolute left-3.5 w-4 h-4 text-slate-400" />
            <input
              type="email"
              name="email"
              className="w-full bg-slate-50 border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 rounded-xl text-slate-900 text-sm pl-10 pr-4 py-2.5 outline-none transition-all placeholder:text-slate-400"
              placeholder="admin@blood.org"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5">Admin Password</label>
          <div className="relative flex items-center">
            <Lock className="absolute left-3.5 w-4 h-4 text-slate-400" />
            <input
              type="password"
              name="password"
              className="w-full bg-slate-50 border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 rounded-xl text-slate-900 text-sm pl-10 pr-4 py-2.5 outline-none transition-all placeholder:text-slate-400"
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
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-xl shadow-md transition-all mt-2 cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            'Authenticating...'
          ) : (
            <>
              <ShieldCheck size={18} /> Authenticate Admin
            </>
          )}
        </button>
      </form>
    </div>
  );
}
