import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Building2, LogOut } from 'lucide-react';

export default function HospitalHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/hospital/login');
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-950/85 backdrop-blur-md border-b border-blue-500/20 px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Hospital Brand Logo */}
        <Link to="/hospital/dashboard" className="flex items-center gap-3 text-white no-underline group">
          <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-2 rounded-xl flex shadow-lg shadow-blue-500/30 group-hover:scale-105 transition-transform duration-200">
            <Building2 size={24} className="text-white" />
          </div>
          <div>
            <div className="font-extrabold text-xl tracking-tight font-['Outfit']">
              BLOOD<span className="text-blue-400">SYNC</span>
            </div>
            <div className="text-[11px] text-blue-300 uppercase tracking-wider font-semibold">
              🏥 Central Hospital Staff Portal
            </div>
          </div>
        </Link>

        {/* User Status / Auth */}
        {user && user.role === 'HOSPITAL' ? (
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-semibold text-slate-100">{user.name}</div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-blue-300 bg-blue-500/15 border border-blue-500/30 px-2.5 py-0.5 rounded-full">
                <Building2 size={12} /> Medical Staff
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
          <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 border border-blue-500/30 px-3 py-1 rounded-full">
            Hospital Staff Login
          </span>
        )}

      </div>
    </header>
  );
}
