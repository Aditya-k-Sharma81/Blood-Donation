import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, Building2, Plus, LogOut, ArrowLeft } from 'lucide-react';

export default function AdminNavbar({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isSignUpPage = location.pathname === '/admin/hospital-signup';

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 shadow-sm">
      <Link to="/admin" className="flex items-center gap-2 font-bold text-lg text-slate-800 hover:text-slate-900">
        <ShieldCheck className="w-6 h-6 text-indigo-600" />
        <span>Admin Portal</span>
      </Link>

      <div className="flex items-center gap-3">
        {user && user.role === 'ADMIN' && (
          isSignUpPage ? (
            <button
              onClick={() => navigate('/admin')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Back to Admin Page</span>
            </button>
          ) : (
            <button
              onClick={() => navigate('/admin/hospital-signup')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              <Building2 size={14} />
              <Plus size={14} />
              <span>Hospital Sign Up</span>
            </button>
          )
        )}

        {user && (
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut size={14} />
            <span>Logout ({user.name || user.email})</span>
          </button>
        )}
      </div>
    </header>
  );
}
