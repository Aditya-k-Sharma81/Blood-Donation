import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Droplet, LogOut, Heart } from 'lucide-react';

export default function DonorHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 text-white no-underline group">
          <div className="bg-rose-600 p-2 rounded-xl flex shadow-lg shadow-rose-600/40 group-hover:scale-105 transition-transform duration-200">
            <Droplet size={24} className="text-white fill-white" />
          </div>
          <div>
            <div className="font-extrabold text-xl tracking-tight font-['Outfit']">
              BLOOD<span className="text-rose-500">SYNC</span>
            </div>
            <div className="text-[11px] text-rose-300 uppercase tracking-wider font-semibold">
              🩸 Voluntary Donor Portal
            </div>
          </div>
        </Link>

        {/* User Status / Auth */}
        {user && user.role === 'DONOR' ? (
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-semibold text-slate-100">{user.name}</div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-rose-300 bg-rose-500/10 border border-rose-500/30 px-2.5 py-0.5 rounded-full">
                <Heart size={12} className="fill-rose-400" /> Voluntary Donor
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg border border-slate-700 transition-all duration-200"
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-rose-400 bg-rose-500/10 border border-rose-500/30 px-3 py-1 rounded-full">
            Donor Login & Signup
          </span>
        )}

      </div>
    </header>
  );
}
