import React from 'react';
import { ShieldCheck, LogOut } from 'lucide-react';

export default function AdminPage({ user, onLogout }) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 md:p-12 bg-white border border-slate-200 rounded-3xl shadow-xl max-w-xl w-full">
      <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-full text-indigo-600 mb-6 shadow-sm">
        <ShieldCheck className="w-16 h-16" />
      </div>

      <h1 className="text-3xl md:text-4xl font-extrabold text-indigo-600 tracking-tight mb-4">
        this is admin page
      </h1>

      {user && (
        <div className="inline-flex items-center gap-2 bg-slate-100 border border-slate-200 px-4 py-2 rounded-full text-xs md:text-sm text-slate-700 mb-6">
          <span>Logged in as: <strong className="text-indigo-600">{user.name || user.email}</strong> (Role: {user.role})</span>
        </div>
      )}

      <p className="text-slate-500 text-sm max-w-md mb-8 leading-relaxed">
        System Admin authenticated via MongoDB MVC Backend. Use <strong>"Hospital Sign Up"</strong> in the top Admin Navbar to register new hospital accounts.
      </p>

      <button
        onClick={onLogout}
        className="flex items-center gap-2 px-6 py-2.5 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 hover:border-indigo-300 rounded-xl font-medium transition-all shadow-sm cursor-pointer"
      >
        <LogOut size={16} />
        <span>Logout & Back to Portal</span>
      </button>
    </div>
  );
}
