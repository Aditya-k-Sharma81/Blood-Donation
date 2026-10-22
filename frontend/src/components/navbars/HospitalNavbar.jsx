import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Building2, LogOut, Droplets, Calendar, Layers, Radio, HeartPulse } from 'lucide-react';

export default function HospitalNavbar({ user, onLogout }) {
  const hospitalName = user?.hospitalName || user?.name || 'City Central Hospital';
  const location = useLocation();

  const isAppointments = location.pathname.startsWith('/hospital/appointment');
  const isRadiusSearch =
    location.pathname.startsWith('/hospital/radius') ||
    location.pathname.startsWith('/hospital/emergency');
  const isIssueBlood = location.pathname.startsWith('/hospital/issue');
  const isStock = location.pathname === '/hospital' && !isAppointments && !isRadiusSearch && !isIssueBlood;

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between px-4 sm:px-6 py-3 bg-white border-b border-slate-200 shadow-xs">
      <div className="flex items-center gap-3 sm:gap-6">
        <Link to="/hospital" className="flex items-center gap-2.5 font-bold text-lg text-slate-800 hover:text-red-700 transition-colors">
          <div className="w-9 h-9 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shadow-xs">
            <Droplets className="w-5 h-5 fill-red-600/20" />
          </div>
          <div className="flex flex-col">
            <span className="leading-tight text-slate-900 font-bold tracking-tight text-sm sm:text-base">Blood Bank & Hospital</span>
            <span className="text-[11px] text-slate-500 font-medium truncate max-w-[130px] sm:max-w-[220px]">{hospitalName}</span>
          </div>
        </Link>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/70">
          <Link
            to="/hospital"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              isStock
                ? 'bg-white text-slate-900 shadow-xs font-bold border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Layers size={14} className={isStock ? 'text-red-600' : 'text-slate-400'} />
            <span className="hidden sm:inline">Blood Stock</span>
            <span className="sm:hidden">Stock</span>
          </Link>

          {/* Issue Blood Tab in Navbar */}
          <Link
            to="/hospital/issue-blood"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              isIssueBlood
                ? 'bg-rose-600 text-white shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <HeartPulse size={14} className={isIssueBlood ? 'text-white' : 'text-rose-600'} />
            <span>Issue Blood</span>
          </Link>

          <Link
            to="/hospital/appointments"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              isAppointments
                ? 'bg-red-600 text-white shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Calendar size={14} className={isAppointments ? 'text-white' : 'text-slate-400'} />
            <span>Appointments</span>
          </Link>

          <Link
            to="/hospital/radius-search"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              isRadiusSearch
                ? 'bg-red-600 text-white shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
            title="Find donors within 5km, 10km, 15km radius of hospital"
          >
            <Radio size={14} className={isRadiusSearch ? 'text-white animate-pulse' : 'text-red-600'} />
            <span>Radius Search</span>
          </Link>
        </nav>
      </div>

      <div className="flex items-center gap-3">
        {user && (
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="font-semibold text-slate-900">{user.name || user.email}</span>
              <span className="text-slate-400">|</span>
              <span className="text-slate-500 text-[11px]">Staff Access</span>
            </div>

            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-rose-700 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-xl transition-all cursor-pointer shadow-xs"
              title="Logout from Hospital Portal"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
