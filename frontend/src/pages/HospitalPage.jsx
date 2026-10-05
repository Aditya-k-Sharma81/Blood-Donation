import React from 'react';
import { Building2, LogOut } from 'lucide-react';

export default function HospitalPage({ user, onLogout }) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 md:p-12 bg-white border border-slate-200 rounded-3xl shadow-xl max-w-xl w-full">
      <div className="p-4 bg-sky-50 border border-sky-200 rounded-full text-sky-600 mb-6 shadow-sm">
        <Building2 className="w-16 h-16" />
      </div>

      <h1 className="text-3xl md:text-4xl font-extrabold text-sky-600 tracking-tight mb-4">
        this is hospital page
      </h1>

      {user && (
        <div className="inline-flex items-center gap-2 bg-slate-100 border border-slate-200 px-4 py-2 rounded-full text-xs md:text-sm text-slate-700 mb-6">
          <span>Logged in as: <strong className="text-sky-600">{user.name || user.email}</strong> (Role: {user.role})</span>
        </div>
      )}

      <p className="text-slate-500 text-sm max-w-md mb-8 leading-relaxed">
        Hospital UI preview session active.
      </p>

      <button
        onClick={onLogout}
        className="flex items-center gap-2 px-6 py-2.5 bg-slate-100 hover:bg-sky-50 text-slate-700 hover:text-sky-700 border border-slate-200 hover:border-sky-300 rounded-xl font-medium transition-all shadow-sm cursor-pointer"
      >
        <LogOut size={16} />
        <span>Logout & Back to Portal</span>
      </button>
    </div>
  );
}
