import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Mail, Lock, Key, ArrowRight } from 'lucide-react';

export default function AdminLogin() {
  const { loginAdmin, user, error, setError } = useAuth();
  const navigate = useNavigate();

  // Pre-filled with Admin credentials as requested!
  const [email, setEmail] = useState('admin@gmail.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await loginAdmin(email, password);
    setLoading(false);

    if (result && result.success) {
      navigate('/admin/dashboard');
    }
  };

  const fillDemoAdmin = () => {
    setEmail('admin@gmail.com');
    setPassword('admin123');
  };

  if (user && user.role === 'ADMIN') {
    return (
      <div className="h-[calc(100vh-73px)] overflow-hidden flex items-center justify-center px-4">
        <div className="glass-card p-10 max-w-md w-full text-center border-amber-500/40">
          <ShieldCheck size={52} className="text-amber-400 mx-auto mb-4" />
          <h2 className="text-2xl font-extrabold text-white">Welcome back, System Admin!</h2>
          <p className="text-slate-400 text-sm my-4">
            You have full administrative privileges over users, hospital access creation, and platform analytics.
          </p>
          <button onClick={() => navigate('/admin/dashboard')} className="btn btn-amber w-full py-3">
            Open Admin Dashboard <ArrowRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-73px)] overflow-hidden flex items-center justify-center px-4">
      <div className="glass-card p-8 max-w-md w-full border-amber-500/30">
        
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-300 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-amber-500/20 border border-amber-500/30">
            <ShieldCheck size={32} />
          </div>
          <h2 className="text-2xl font-extrabold text-white">System Admin Login</h2>
          <p className="text-xs text-slate-400 mt-1">
            Exclusive Admin Portal to manage hospital user access
          </p>
        </div>

        {error && (
          <div className="bg-rose-500/15 border border-rose-500/40 p-3 rounded-lg text-rose-300 text-xs mb-5">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Admin Email Address
            </label>
            <div className="relative">
              <Mail size={17} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                type="email"
                required
                placeholder="admin@gmail.com"
                className="input-field pl-10"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Admin Password
            </label>
            <div className="relative">
              <Lock size={17} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                type="password"
                required
                placeholder="••••••••"
                className="input-field pl-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn btn-amber w-full py-3 mt-2">
            {loading ? 'Authenticating...' : 'Sign In as System Admin'}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-800 text-center">
          <button
            type="button"
            onClick={fillDemoAdmin}
            className="btn btn-secondary w-full text-xs py-2.5"
          >
            <Key size={14} /> Reset Admin Credentials (admin@gmail.com / admin123)
          </button>
        </div>

      </div>
    </div>
  );
}
