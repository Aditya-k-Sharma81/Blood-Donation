import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, LogOut, Droplets } from 'lucide-react';

export default function HospitalNavbar({ user, onLogout }) {
  const hospitalName = user?.hospitalName || user?.name || 'City Central Hospital';

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-3.5 bg-white border-b border-slate-200 shadow-xs">
      <Link to="/hospital" className="flex items-center gap-2.5 font-bold text-lg text-slate-800 hover:text-red-700 transition-colors">
        <div className="w-9 h-9 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shadow-xs">
          <Droplets className="w-5 h-5 fill-red-600/20" />
        </div>
        <div className="flex flex-col">
          <span className="leading-tight text-slate-900 font-bold tracking-tight text-base">Blood Bank & Hospital</span>
          <span className="text-[11px] text-slate-500 font-medium">{hospitalName}</span>
        </div>
      </Link>

      <div className="flex items-center gap-3">
        {user && (
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="font-semibold text-slate-900">{user.name || user.email}</span>
              <span className="text-slate-400">|</span>
              <span className="text-slate-500 text-[11px]">Staff Access</span>
            </div>

            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-rose-700 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-xl transition-all cursor-pointer shadow-xs"
            >
              <LogOut size={14} />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
