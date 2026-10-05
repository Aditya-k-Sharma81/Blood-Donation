import React, { useState } from 'react';
import { User, Mail, Lock, LogIn, UserPlus } from 'lucide-react';
import Swal from 'sweetalert2';

export default function DonorAuth({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
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

    const endpoint = isLogin ? '/api/auth/donor/login' : '/api/auth/donor/signup';
    const payload = isLogin
      ? { email: formData.email, password: formData.password }
      : { name: formData.name, email: formData.email, password: formData.password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Authentication failed');
      }

      setLoading(false);

      Swal.fire({
        icon: 'success',
        title: isLogin ? 'Welcome Back!' : 'Registration Successful!',
        text: data.message,
        timer: 1800,
        showConfirmButton: false,
        background: '#ffffff',
        color: '#0f172a',
        iconColor: '#e11d48',
      });

      onLoginSuccess(data.user);
    } catch (err) {
      setLoading(false);

      Swal.fire({
        icon: 'error',
        title: isLogin ? 'Donor Login Failed' : 'Signup Failed',
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
        <span className="inline-block bg-rose-50 text-rose-700 border border-rose-200 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
          🩸 Voluntary Donor
        </span>
        <h2 className="text-2xl font-bold text-slate-900">
          {isLogin ? 'Donor Login' : 'Donor Signup'}
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          {isLogin ? 'Welcome back! Enter your login credentials' : 'Register to become a voluntary blood donor'}
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="flex bg-slate-100 p-1 border border-slate-200 rounded-xl mb-6">
        <button
          type="button"
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
            isLogin
              ? 'bg-rose-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          onClick={() => setIsLogin(true)}
        >
          <LogIn size={14} />
          Login
        </button>
        <button
          type="button"
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
            !isLogin
              ? 'bg-rose-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          onClick={() => setIsLogin(false)}
        >
          <UserPlus size={14} />
          Sign Up
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {!isLogin && (
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">Full Name</label>
            <div className="relative flex items-center">
              <User className="absolute left-3.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                name="name"
                className="w-full bg-slate-50 border border-slate-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 rounded-xl text-slate-900 text-sm pl-10 pr-4 py-2.5 outline-none transition-all placeholder:text-slate-400"
                placeholder="Rahul Sharma"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5">Email Address</label>
          <div className="relative flex items-center">
            <Mail className="absolute left-3.5 w-4 h-4 text-slate-400" />
            <input
              type="email"
              name="email"
              className="w-full bg-slate-50 border border-slate-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 rounded-xl text-slate-900 text-sm pl-10 pr-4 py-2.5 outline-none transition-all placeholder:text-slate-400"
              placeholder="donor@example.com"
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
              className="w-full bg-slate-50 border border-slate-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 rounded-xl text-slate-900 text-sm pl-10 pr-4 py-2.5 outline-none transition-all placeholder:text-slate-400"
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
          className="w-full flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold py-3 px-4 rounded-xl shadow-md transition-all mt-2 cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            'Processing...'
          ) : isLogin ? (
            <>
              <LogIn size={18} /> Login to Donor Portal
            </>
          ) : (
            <>
              <UserPlus size={18} /> Create Donor Account
            </>
          )}
        </button>
      </form>

      <div className="mt-6 text-center text-xs text-slate-500">
        {isLogin ? (
          <span>
            Don't have an account?{' '}
            <button
              type="button"
              onClick={() => setIsLogin(false)}
              className="text-rose-600 hover:text-rose-700 font-semibold underline cursor-pointer ml-1"
            >
              Sign Up here
            </button>
          </span>
        ) : (
          <span>
            Already registered?{' '}
            <button
              type="button"
              onClick={() => setIsLogin(true)}
              className="text-rose-600 hover:text-rose-700 font-semibold underline cursor-pointer ml-1"
            >
              Login here
            </button>
          </span>
        )}
      </div>
    </div>
  );
}
