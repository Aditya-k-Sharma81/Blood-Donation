import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, LogOut } from 'lucide-react';

export default function AdminHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-950/85 backdrop-blur-md border-b border-amber-500/20 px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Admin Brand Logo */}
        <Link to="/admin/dashboard" className="flex items-center gap-3 text-white no-underline group">
          <div className="bg-gradient-to-br from-amber-500 to-amber-700 p-2 rounded-xl flex shadow-lg shadow-amber-500/30 group-hover:scale-105 transition-transform duration-200">
            <ShieldCheck size={24} className="text-white" />
          </div>
          <div>
            <div className="font-extrabold text-xl tracking-tight font-['Outfit']">
              BLOOD<span className="text-amber-400">SYNC</span>
            </div>
            <div className="text-[11px] text-amber-300 uppercase tracking-wider font-semibold">
              👨‍💼 System Admin Portal
            </div>
          </div>
        </Link>

        {/* User Status / Auth */}
        {user && user.role === 'ADMIN' ? (
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-semibold text-slate-100">{user.name}</div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
                <ShieldCheck size={12} /> System Admin
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
          <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full">
            Admin Authentication
          </span>
        )}

      </div>
    </header>
  );
}
