import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Mail, Lock, Plus, ArrowLeft, ShieldAlert } from 'lucide-react';
import Swal from 'sweetalert2';

export default function HospitalSignUpPage({ user }) {
  const navigate = useNavigate();

  // Get initial hospital name from user prop or saved session
  const [formData, setFormData] = useState(() => {
    let initialHospitalName = user?.hospitalName || '';
    if (!initialHospitalName) {
      try {
        const saved = localStorage.getItem('rakt_user');
        if (saved) {
          const parsed = JSON.parse(saved);
          initialHospitalName = parsed?.hospitalName || '';
        }
      } catch (e) {}
    }
    return {
      name: initialHospitalName,
      email: '',
      password: '',
    };
  });

  const [loading, setLoading] = useState(false);
  const [fetchingProfile, setFetchingProfile] = useState(false);

  // Sync latest hospital name directly from Admin Profile in database
  useEffect(() => {
    const fetchAdminHospitalDetails = async () => {
      try {
        setFetchingProfile(true);
        const headers = {
          'Content-Type': 'application/json',
          'x-admin-id': user?.id || user?._id || '',
          'x-admin-email': user?.email || '',
        };
        if (user?.token) {
          headers['Authorization'] = `Bearer ${user.token}`;
        }

        const res = await fetch('/api/admin/profile', { headers });
        const data = await res.json();

        if (res.ok && data.success && data.admin) {
          if (data.admin.hospitalName) {
            setFormData((prev) => ({
              ...prev,
              name: data.admin.hospitalName,
            }));
          }
        }
      } catch (err) {
        console.warn('Could not fetch admin profile:', err);
      } finally {
        setFetchingProfile(false);
      }
    };

    fetchAdminHospitalDetails();
  }, [user]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name?.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Hospital Name Missing',
        text: 'Please set your Hospital Name in Admin Profile before creating a hospital account.',
        confirmButtonColor: '#4f46e5',
        showCancelButton: true,
        confirmButtonText: 'Go to Profile',
      }).then((result) => {
        if (result.isConfirmed) {
          navigate('/admin/profile');
        }
      });
      return;
    }

    setLoading(true);

    try {
      const headers = {
        'Content-Type': 'application/json',
        'x-admin-id': user?.id || user?._id || '',
        'x-admin-email': user?.email || '',
      };
      if (user?.token) {
        headers['Authorization'] = `Bearer ${user.token}`;
      }

      const res = await fetch('/api/auth/hospital/create', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          adminId: user?.id || user?._id,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to create hospital user');
      }

      setLoading(false);

      Swal.fire({
        icon: 'success',
        title: 'Hospital Account Created!',
        html: `Hospital <strong>${data.user.name}</strong> (${data.user.email}) registered successfully under your administration.`,
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
    <div className="w-full max-w-lg p-8 bg-white border border-slate-200 rounded-3xl shadow-xl transition-all">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-sky-50 border border-sky-200 rounded-2xl text-sky-600">
            <Building2 size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Hospital Sign Up</h2>
            <p className="text-xs text-slate-500">Create new hospital access credentials</p>
          </div>
        </div>

        <button
          onClick={() => navigate('/admin')}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Back</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Hospital Name (Pre-filled from Admin Profile & Read-only) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Hospital Name
            </label>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Lock size={10} /> Read-only
            </span>
          </div>
          <div className="relative flex items-center">
            <Building2 className="absolute left-3.5 w-4 h-4 text-indigo-500" />
            <input
              type="text"
              name="name"
              readOnly
              className="w-full bg-slate-100/90 border border-slate-200 rounded-xl text-slate-600 text-sm pl-10 pr-9 py-2.5 outline-none font-semibold cursor-not-allowed select-none"
              placeholder={fetchingProfile ? 'Loading hospital name...' : 'No hospital name configured in profile'}
              value={formData.name}
              required
              title="Hospital name is automatically populated from your Admin Profile and cannot be edited here."
            />
            <Lock className="absolute right-3.5 w-3.5 h-3.5 text-slate-400" />
          </div>

          {!formData.name && !fetchingProfile && (
            <div className="mt-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
              <ShieldAlert size={15} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span>Hospital name is not configured in your Admin Profile.</span>
                <button
                  type="button"
                  onClick={() => navigate('/admin/profile')}
                  className="block mt-0.5 text-indigo-600 font-semibold underline hover:text-indigo-800 cursor-pointer"
                >
                  Configure Hospital Name in Profile →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Hospital Email */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Hospital Login Email Address
          </label>
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

        {/* Hospital Password */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Set Hospital Password
          </label>
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

        {/* Submit Button */}
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
