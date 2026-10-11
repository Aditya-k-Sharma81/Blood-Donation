import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, Building2, Plus, LogOut, ArrowLeft, User, ChevronDown } from 'lucide-react';

export default function AdminNavbar({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isSignUpPage = location.pathname === '/admin/hospital-signup';
  const isProfilePage = location.pathname === '/admin/profile';
  const isProfileSet = Boolean(
    user?.isProfileSet ||
    (user?.phone?.trim() && user?.city?.trim() && user?.address?.trim())
  );

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-3.5 bg-white border-b border-slate-200 shadow-xs">
      <Link to="/admin" className="flex items-center gap-2.5 font-bold text-lg text-slate-800 hover:text-indigo-600 transition-colors">
        <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <span className="tracking-tight">Admin Portal</span>
      </Link>

      <div className="flex items-center gap-3">
        {user && user.role === 'ADMIN' && (
          <>
            {isSignUpPage || isProfilePage ? (
              <button
                onClick={() => navigate('/admin')}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
              >
                <ArrowLeft size={14} />
                <span>Back to Dashboard</span>
              </button>
            ) : (
              <button
                onClick={() => navigate('/admin/hospital-signup')}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all cursor-pointer shadow-xs"
              >
                <Building2 size={14} />
                <Plus size={14} />
                <span>Hospital Sign Up</span>
              </button>
            )}

            {/* Profile Picture with Hover Dropdown (Task 1) */}
            <div className="relative group py-1.5">
              <button
                type="button"
                className="flex items-center gap-2 p-1 rounded-full hover:bg-slate-100 transition-all cursor-pointer focus:outline-none"
                aria-label="Admin Profile Menu"
              >
                <div className="relative w-9 h-9 rounded-full ring-2 ring-indigo-500/20 shadow-xs flex items-center justify-center overflow-hidden bg-gradient-to-tr from-indigo-600 to-violet-500 text-white font-bold text-sm">
                  {user.profilePic ? (
                    <img
                      src={user.profilePic}
                      alt={user.name || 'Admin'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback on broken image link
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <span>{(user.name || user.email || 'A')[0].toUpperCase()}</span>
                  )}
                  {/* Active Online Indicator */}
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
                </div>
                <ChevronDown size={14} className="text-slate-400 group-hover:text-slate-600 transition-transform group-hover:rotate-180 duration-200" />
              </button>

              {/* Hover Dropdown Menu */}
              <div className="absolute right-0 top-full pt-2 w-64 z-50 transition-all duration-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible translate-y-1 group-hover:translate-y-0">
                <div className="bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden divide-y divide-slate-100">
                  {/* User Profile Header */}
                  <div className="px-4 py-3 bg-slate-50/70">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full ring-2 ring-indigo-500/20 overflow-hidden flex items-center justify-center bg-indigo-600 text-white font-bold text-base shrink-0">
                        {user.profilePic ? (
                          <img
                            src={user.profilePic}
                            alt={user.name || 'Admin'}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>{(user.name || user.email || 'A')[0].toUpperCase()}</span>
                        )}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-sm font-bold text-slate-800 truncate">
                          {user.name || 'System Admin'}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {user.email}
                        </p>
                        <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-md">
                          System Admin
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Dropdown Action Links */}
                  <div className="p-1.5 space-y-0.5">
                    <button
                      onClick={() => navigate('/admin/profile')}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl transition-colors cursor-pointer text-left ${
                        isProfilePage
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'text-slate-700 hover:text-indigo-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <User size={15} className="text-indigo-600" />
                        <span>{isProfileSet ? 'Update Profile' : 'Set Profile'}</span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          isProfileSet
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {isProfileSet ? 'Update' : 'Set'}
                      </span>
                    </button>

                    <button
                      onClick={onLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50/70 rounded-xl transition-colors cursor-pointer text-left"
                    >
                      <LogOut size={15} className="text-rose-600" />
                      <span>Logout Session</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
