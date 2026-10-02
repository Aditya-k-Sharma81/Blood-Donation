import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Building2, Mail, Lock, Key, ArrowRight } from 'lucide-react';

export default function HospitalLogin() {
  const { loginHospital, user, error, setError } = useAuth();
  const navigate = useNavigate();

  // Pre-filled with Hospital staff credentials as requested!
  const [email, setEmail] = useState('hospital@centralbank.org');
  const [password, setPassword] = useState('hospital123');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await loginHospital(email, password);
    setLoading(false);

    if (result && result.success) {
      navigate('/hospital/dashboard');
    }
  };

  const fillDemoHospital = () => {
    setEmail('hospital@centralbank.org');
    setPassword('hospital123');
  };

  if (user && user.role === 'HOSPITAL') {
    return (
      <div className="h-[calc(100vh-73px)] overflow-hidden flex items-center justify-center px-4">
        <div className="glass-card p-10 max-w-md w-full text-center border-blue-500/40">
          <Building2 size={52} className="text-blue-400 mx-auto mb-4" />
          <h2 className="text-2xl font-extrabold text-white">Welcome, Central Hospital Staff!</h2>
          <p className="text-slate-400 text-sm my-4">
            Manage blood stock gauges, dispatch emergency requests, and mark donor blood collections.
          </p>
          <button onClick={() => navigate('/hospital/dashboard')} className="btn btn-blue w-full py-3">
            Open Hospital Dashboard <ArrowRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-73px)] overflow-hidden flex items-center justify-center px-4">
      <div className="glass-card p-8 max-w-md w-full border-blue-500/30">
        
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/20 text-blue-300 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-500/20 border border-blue-500/30">
            <Building2 size={32} />
          </div>
          <h2 className="text-2xl font-extrabold text-white">Central Hospital Login</h2>
          <p className="text-xs text-slate-400 mt-1">
            Medical Staff Portal for Inventory & Emergency Dispatches
          </p>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/20 p-2.5 rounded-lg text-xs text-blue-300 mb-5">
          ℹ️ Note: Hospital user credentials are created directly by the <strong>System Admin</strong>.
        </div>

        {error && (
          <div className="bg-rose-500/15 border border-rose-500/40 p-3 rounded-lg text-rose-300 text-xs mb-5">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Hospital Staff Email
            </label>
            <div className="relative">
              <Mail size={17} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                type="email"
                required
                placeholder="hospital@centralbank.org"
                className="input-field pl-10"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Hospital Password
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

          <button type="submit" disabled={loading} className="btn btn-blue w-full py-3 mt-2">
            {loading ? 'Authenticating...' : 'Sign In as Hospital Staff'}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-800 text-center">
          <button
            type="button"
            onClick={fillDemoHospital}
            className="btn btn-secondary w-full text-xs py-2.5"
          >
            <Key size={14} /> Reset Hospital Credentials (hospital@centralbank.org / hospital123)
          </button>
        </div>

      </div>
    </div>
  );
}
