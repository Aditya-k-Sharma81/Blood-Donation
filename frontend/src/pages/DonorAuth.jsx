import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Droplet, User, Mail, Lock, Heart, ArrowRight, ShieldCheck, Activity, MapPin, Sparkles, Key } from 'lucide-react';

export default function DonorAuth() {
  const [isSignup, setIsSignup] = useState(false);
  const { loginDonor, signupDonor, user, error, setError } = useAuth();
  const navigate = useNavigate();

  // Form states - Name, Email, Password
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
    setError(null);

    if (isSignup && formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      setLoading(false);
      return;
    }

    let result;
    if (isSignup) {
      result = await signupDonor({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });
    } else {
      result = await loginDonor(formData.email, formData.password);
    }

    setLoading(false);

    if (result && result.success) {
      navigate('/donor/dashboard');
    }
  };

  const fillDemoDonor = () => {
    setFormData({
      ...formData,
      email: 'donor@example.com',
      password: 'donor123',
    });
  };

  if (user && user.role === 'DONOR') {
    return (
      <div className="h-[calc(100vh-73px)] overflow-hidden flex items-center justify-center px-4 bg-slate-950/60">
        <div className="glass-card p-10 max-w-md w-full text-center border-rose-500/40 relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl" />
          <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-500 flex items-center justify-center mx-auto mb-4 border border-rose-500/30 shadow-lg shadow-rose-500/20">
            <Droplet size={36} className="fill-rose-500" />
          </div>
          <h2 className="text-2xl font-black text-white font-['Outfit']">Welcome back, {user.name}!</h2>
          <p className="text-slate-400 text-sm my-4">
            You are logged in as a Voluntary Blood Donor.
          </p>
          <button onClick={() => navigate('/donor/dashboard')} className="btn btn-primary w-full py-3.5 text-sm flex items-center justify-center gap-2">
            Go to Donor Dashboard <ArrowRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-73px)] flex items-center justify-center px-6 py-10">
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* Left Column: Premium Hero Details & Features */}
        <div className="lg:col-span-7 space-y-8">
          
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-rose-400 bg-rose-500/10 border border-rose-500/30 shadow-sm">
              <span className="pulse-dot" />
              <Heart size={14} className="fill-rose-400" /> Voluntary Donor Portal (Route: /)
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight font-['Outfit'] tracking-tight">
              Every Drop <span className="bg-gradient-to-r from-rose-400 via-rose-500 to-red-600 bg-clip-text text-transparent">Saves a Life</span>
            </h1>

            <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-xl">
              Connect directly with Central Hospital & Blood Bank. Receive automated 90-day eligibility invites and instant ICU emergency dispatches.
            </p>
          </div>

          {/* Interactive Feature Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="glass-card p-4 space-y-2 border-slate-800/90 hover:border-emerald-500/40 transition-all duration-300">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                <Activity size={20} />
              </div>
              <div className="font-extrabold text-white text-sm font-['Outfit']">90-Day Engine</div>
              <div className="text-xs text-slate-400 leading-snug">
                Auto recovery interval countdown tracking.
              </div>
            </div>

            <div className="glass-card p-4 space-y-2 border-slate-800/90 hover:border-rose-500/40 transition-all duration-300">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center border border-rose-500/20">
                <Sparkles size={20} />
              </div>
              <div className="font-extrabold text-white text-sm font-['Outfit']">ICU Alerts</div>
              <div className="text-xs text-slate-400 leading-snug">
                Instant match alerts for critical dispatches.
              </div>
            </div>

            <div className="glass-card p-4 space-y-2 border-slate-800/90 hover:border-blue-500/40 transition-all duration-300">
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center border border-blue-500/20">
                <MapPin size={20} />
              </div>
              <div className="font-extrabold text-white text-sm font-['Outfit']">Hospital Map</div>
              <div className="text-xs text-slate-400 leading-snug">
                Geo-coordinates & direct navigation route.
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Premium Auth Card */}
        <div className="lg:col-span-5">
          <div className="glass-card p-8 border-rose-500/30 relative overflow-hidden shadow-2xl shadow-rose-950/20">
            
            {/* Pill Tab Switcher */}
            <div className="flex bg-slate-950/80 p-1.5 rounded-xl mb-6 border border-slate-800">
              <button
                type="button"
                onClick={() => { setIsSignup(false); setError(null); }}
                className={`flex-1 py-2.5 rounded-lg font-extrabold text-xs transition-all duration-200 ${
                  !isSignup
                    ? 'bg-gradient-to-r from-rose-500 to-rose-700 text-white shadow-lg shadow-rose-600/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Donor Login
              </button>
              <button
                type="button"
                onClick={() => { setIsSignup(true); setError(null); }}
                className={`flex-1 py-2.5 rounded-lg font-extrabold text-xs transition-all duration-200 ${
                  isSignup
                    ? 'bg-gradient-to-r from-rose-500 to-rose-700 text-white shadow-lg shadow-rose-600/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Donor Signup
              </button>
            </div>

            <div className="mb-5 text-center">
              <h3 className="text-xl font-black text-white font-['Outfit']">
                {isSignup ? 'Join as Voluntary Donor' : 'Welcome Back, Hero'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {isSignup ? 'Create your donor profile with Name, Email & Password' : 'Sign in to access your donor dashboard'}
              </p>
            </div>

            {error && (
              <div className="bg-rose-500/15 border border-rose-500/40 p-3 rounded-xl text-rose-300 text-xs mb-5 flex items-center gap-2">
                <span>⚠️</span> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Full Name Field (Signup Only) */}
              {isSignup && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <User size={18} className="absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="text"
                      name="name"
                      required
                      placeholder="e.g. John Doe"
                      className="input-field pl-10"
                      value={formData.name}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              )}

              {/* Email Address Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="donor@example.com"
                    className="input-field pl-10"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="password"
                    name="password"
                    required
                    placeholder="••••••••"
                    className="input-field pl-10"
                    value={formData.password}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button type="submit" disabled={loading} className="btn btn-primary w-full py-3.5 text-sm mt-2 font-bold tracking-wide">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Processing...
                  </span>
                ) : isSignup ? (
                  'Create Voluntary Donor Account'
                ) : (
                  'Sign In as Donor'
                )}
              </button>
            </form>

            {/* Fast-Fill Demo Credentials */}
            {!isSignup && (
              <div className="mt-6 pt-5 border-t border-slate-800 text-center">
                <button
                  type="button"
                  onClick={fillDemoDonor}
                  className="btn btn-secondary w-full text-xs py-2.5 flex items-center justify-center gap-2"
                >
                  <Key size={14} className="text-amber-400" /> Fast Fill Demo Credentials (donor@example.com)
                </button>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
