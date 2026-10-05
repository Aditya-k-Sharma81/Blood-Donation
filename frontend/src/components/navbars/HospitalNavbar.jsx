import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, LogOut } from 'lucide-react';

export default function HospitalNavbar({ user, onLogout }) {
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 bg-white border-b border-sky-100 shadow-sm">
      <Link to="/hospital" className="flex items-center gap-2 font-bold text-lg text-sky-700 hover:text-sky-800">
        <Building2 className="w-6 h-6 text-sky-600" />
        <span>Hospital Portal</span>
      </Link>

      {user && (
        <button
          onClick={onLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
        >
          <LogOut size={14} />
          <span>Logout ({user.name || user.email})</span>
        </button>
      )}
    </header>
  );
}
