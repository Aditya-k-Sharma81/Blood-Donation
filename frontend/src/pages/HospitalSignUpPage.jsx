import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, User, Mail, Lock, Plus, ArrowLeft } from 'lucide-react';
import Swal from 'sweetalert2';

export default function HospitalSignUpPage() {
  const [formData, setFormData] = useState({
    name: '',
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
      const res = await fetch('/api/auth/hospital/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to create hospital user');
      }

      setLoading(false);

      Swal.fire({
        icon: 'success',
        title: 'Hospital Account Created!',
        html: `Hospital <strong>${data.user.name}</strong> (${data.user.email}) registered successfully.`,
        confirmButtonColor: '#4f46e5',
        background: '#ffffff',
        color: '#0f172a',
      }).then(() => {
        navigate('/admin');
      });
    } catch (err) {
      setLoading(false);
      Swal.fire({
        icon: 'error',
        title: 'Registration Failed',
        text: err.message,
        confirmButtonColor: '#dc2626',
        background: '#ffffff',
        color: '#0f172a',
      });
    }
  };

  return (
    <div className="w-full max-w-lg p-8 bg-white border border-slate-200 rounded-2xl shadow-xl transition-all">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl text-sky-600">
            <Building2 size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Hospital Sign Up</h2>
            <p className="text-xs text-slate-500">Create new hospital access credentials</p>
          </div>
        </div>

        <button
          onClick={() => navigate('/admin')}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Back</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Hospital Name</label>
          <div className="relative flex items-center">
            <User className="absolute left-3.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              name="name"
              className="w-full bg-slate-50 border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 rounded-xl text-slate-900 text-sm pl-10 pr-4 py-2.5 outline-none transition-all placeholder:text-slate-400"
              placeholder="City Central Hospital"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Hospital Email Address</label>
          <div className="relative flex items-center">
            <Mail className="absolute left-3.5 w-4 h-4 text-slate-400" />
            <input
              type="email"
              name="email"
              className="w-full bg-slate-50 border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 rounded-xl text-slate-900 text-sm pl-10 pr-4 py-2.5 outline-none transition-all placeholder:text-slate-400"
              placeholder="hospital@central.org"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Set Hospital Password</label>
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

        <div className="pt-2 flex flex-col gap-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            <Plus size={16} />
            {loading ? 'Creating Credentials...' : 'Register Hospital Account'}
          </button>
        </div>
      </form>
    </div>
  );
}
