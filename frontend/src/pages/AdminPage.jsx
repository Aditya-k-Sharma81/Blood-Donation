import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, LogOut, User } from 'lucide-react';

export default function AdminPage({ user, onLogout }) {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 md:p-12 bg-white border border-slate-200 rounded-3xl shadow-xl max-w-xl w-full mx-auto my-6">
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

      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/admin/profile')}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-all shadow-md cursor-pointer text-xs md:text-sm"
        >
          <User size={16} />
          <span>Edit Profile</span>
        </button>

        <button
          onClick={onLogout}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 hover:border-rose-300 rounded-xl font-medium transition-all shadow-xs cursor-pointer text-xs md:text-sm"
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
