import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Mail,
  Lock,
  Plus,
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  Eye,
  EyeOff,
  CheckCircle2,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import Swal from 'sweetalert2';

export default function HospitalSignUpPage({ user }) {
  const navigate = useNavigate();

  // Initial state for form data
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

  const [adminDetails, setAdminDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchingProfile, setFetchingProfile] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Sync latest hospital details directly from Admin Profile in database
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
          setAdminDetails(data.admin);
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
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name?.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Hospital Name Required',
        text: 'Please configure your Hospital Name in Admin Profile before creating staff credentials.',
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

    if (formData.password.length < 6) {
      Swal.fire({
        icon: 'warning',
        title: 'Weak Password',
        text: 'Password must be at least 6 characters long.',
        confirmButtonColor: '#4f46e5',
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
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password.trim(),
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
        html: `Hospital credentials for <strong>${data.user.name}</strong> (${data.user.email}) have been authorized successfully.`,
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
    <div className="w-full max-w-xl my-4">
      <div className="bg-white border border-slate-200/80 rounded-3xl shadow-xl shadow-slate-200/40 overflow-hidden transition-all">
        {/* Refined Modern Card Header (Blue color removed, matching admin design system) */}
        <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200/70 flex items-center justify-between">
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-indigo-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all cursor-pointer shadow-xs"
          >
            <ArrowLeft size={14} />
            <span>Dashboard</span>
          </button>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <ShieldCheck size={13} className="text-emerald-600" />
            <span>Admin Authorization</span>
          </span>
        </div>

        {/* Card Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Title Header with Icon */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shadow-xs shrink-0">
              <Building2 size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Hospital Portal Access
              </h1>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Register authorized staff login credentials linked to your health institution.
              </p>
            </div>
          </div>

          {/* Linked Hospital Info Chip (if configured) */}
          {formData.name && (
            <div className="p-3 bg-slate-50/80 border border-slate-200/80 rounded-2xl flex items-center justify-between text-xs transition-all shadow-xs">
              <div className="flex items-center gap-2.5 text-slate-900 font-semibold truncate">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 shadow-xs"></span>
                <span className="truncate">Institution: {formData.name}</span>
              </div>
              {adminDetails?.licenseNumber && (
                <span className="shrink-0 text-[10px] font-bold text-slate-700 bg-white px-2.5 py-0.5 rounded-lg border border-slate-200 font-mono shadow-xs">
                  {adminDetails.licenseNumber}
                </span>
              )}
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            {/* Hospital Name (Read-only) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Hospital / Institution Name
                </label>
                <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-1">
                  <Lock size={10} /> Read-only
                </span>
              </div>
              <div className="relative flex items-center">
                <Building2 className="absolute left-3.5 w-4 h-4 text-indigo-500" />
                <input
                  type="text"
                  name="name"
                  readOnly
                  className="w-full bg-slate-100/90 border border-slate-200 rounded-xl text-slate-700 text-sm pl-10 pr-9 py-2.5 outline-none font-semibold cursor-not-allowed select-none"
                  placeholder={fetchingProfile ? 'Loading hospital name...' : 'No hospital configured in profile'}
                  value={formData.name}
                  required
                  title="Hospital name is automatically populated from your Admin Profile and cannot be changed here."
                />
                <Lock className="absolute right-3.5 w-3.5 h-3.5 text-slate-400" />
              </div>

              {/* Alert if Hospital Name is missing */}
              {!formData.name && !fetchingProfile && (
                <div className="mt-2.5 p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-start gap-2.5">
                  <ShieldAlert size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium">Hospital name is not configured in your Admin Profile.</span>
                    <button
                      type="button"
                      onClick={() => navigate('/admin/profile')}
                      className="block mt-1 text-indigo-600 font-semibold underline hover:text-indigo-800 cursor-pointer"
                    >
                      Configure Hospital Name in Profile →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Hospital Login Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Hospital Login Email Address
              </label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3.5 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  name="email"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/15 rounded-xl text-slate-900 text-sm pl-10 pr-4 py-2.5 outline-none transition-all placeholder:text-slate-400 font-medium"
                  placeholder="hospital.staff@cityhealth.org"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Hospital Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Set Staff Access Password
                </label>
                <span className="text-[10px] text-slate-400">Min 6 characters</span>
              </div>
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/15 rounded-xl text-slate-900 text-sm pl-10 pr-10 py-2.5 outline-none transition-all placeholder:text-slate-400 font-medium"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Authority notice */}
            <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-2xl text-[11px] text-slate-600 flex items-center gap-2">
              <ShieldCheck size={14} className="text-indigo-600 shrink-0" />
              <span>
                Account will be authorized under Admin: <strong>{user?.name || user?.email || 'System Admin'}</strong>
              </span>
            </div>

            {/* Actions */}
            <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => navigate('/admin')}
                className="px-5 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-md shadow-indigo-600/20 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Creating Credentials...</span>
                  </>
                ) : (
                  <>
                    <Plus size={15} />
                    <span>Register Hospital Account</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
