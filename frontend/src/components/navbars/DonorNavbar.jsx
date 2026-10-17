import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { HeartPulse, User, LogOut, ChevronDown, Droplets, MapPin, Calendar, ClipboardList } from 'lucide-react';

export default function DonorNavbar({ user, onLogout, autoLocation }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const isProfilePage = location.pathname === '/profile' || location.pathname === '/donor/profile';
  const isProfileSet = Boolean(
    user?.isProfileSet ||
    (user?.phone?.trim() && (user?.lastLocation?.trim() || user?.permanentLocation?.trim() || user?.currentLocation?.trim()) && user?.bloodGroup?.trim())
  );

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-3.5 bg-white border-b border-slate-200 shadow-xs">
      <Link to="/" className="flex items-center gap-2.5 font-bold text-lg text-slate-800 hover:text-rose-700 transition-colors">
        <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shadow-xs">
          <HeartPulse className="w-5 h-5 text-rose-600" />
        </div>
        <div className="flex flex-col">
          <span className="leading-tight text-slate-900 font-bold tracking-tight text-base">Rakt - Blood Portal</span>
          <span className="text-[11px] text-slate-500 font-medium">Voluntary Donor Network</span>
        </div>
      </Link>

      <div className="flex items-center gap-3">
        {user && user.role === 'DONOR' && (
          <div className="flex items-center gap-2.5">
            {/* Auto GPS sync indicator */}
            <div
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs cursor-default"
              title="Automatic background sync: Your GPS location is updated every 5 minutes"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Auto-GPS 5m</span>
            </div>

            {/* Quick Book Appointment Link */}
            <Link
              to="/appointment"
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 shadow-xs transition-colors"
            >
              <Calendar size={13} className="text-rose-600" />
              <span>Book Appointment</span>
            </Link>

            {/* Dedicated My Bookings Link */}
            <Link
              to="/my-bookings"
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 hover:text-rose-600 border border-slate-200 shadow-xs transition-colors"
            >
              <ClipboardList size={13} className="text-rose-600" />
              <span>My Bookings</span>
            </Link>

            <div className="relative group" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2 p-1 rounded-full hover:bg-slate-100 transition-all cursor-pointer focus:outline-none"
              aria-label="Donor Profile Menu"
            >
              <div className="relative w-9 h-9 rounded-full ring-2 ring-rose-500/20 shadow-xs flex items-center justify-center overflow-hidden bg-gradient-to-tr from-rose-600 to-red-500 text-white font-bold text-sm">
                {user.profilePic ? (
                  <img
                    src={user.profilePic}
                    alt={user.name || 'Donor'}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <span>{(user.name || user.email || 'D')[0].toUpperCase()}</span>
                )}
                {/* Active Online Indicator */}
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
              </div>
              <ChevronDown
                size={14}
                className={`text-slate-400 group-hover:text-slate-600 transition-transform duration-200 ${
                  dropdownOpen ? 'rotate-180 text-slate-600' : 'group-hover:rotate-180'
                }`}
              />
            </button>

            {/* Dropdown Menu (Hover & Click Supported) */}
            <div
              className={`absolute right-0 top-full pt-2 w-64 z-50 transition-all duration-200 ${
                dropdownOpen
                  ? 'opacity-100 visible translate-y-0 pointer-events-auto'
                  : 'opacity-0 invisible group-hover:opacity-100 group-hover:visible translate-y-1 group-hover:translate-y-0'
              }`}
            >
              <div className="bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden divide-y divide-slate-100">
                {/* User Profile Header */}
                <div className="px-4 py-3 bg-slate-50/70">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full ring-2 ring-rose-500/20 overflow-hidden flex items-center justify-center bg-rose-600 text-white font-bold text-base shrink-0">
                      {user.profilePic ? (
                        <img
                          src={user.profilePic}
                          alt={user.name || 'Donor'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{(user.name || user.email || 'D')[0].toUpperCase()}</span>
                      )}
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-sm font-bold text-slate-800 truncate">
                        {user.name || 'Voluntary Donor'}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {user.email}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className="inline-block px-2 py-0.5 text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-md">
                          Voluntary Donor
                        </span>
                        {user.bloodGroup ? (
                          <span className="inline-block px-2 py-0.5 text-[10px] font-bold text-red-700 bg-red-100 border border-red-200 rounded-md">
                            🩸 {user.bloodGroup}
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-md">
                            No Blood Group
                          </span>
                        )}
                      </div>
                      <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                        <span className="flex items-center gap-1 text-slate-600 font-medium">
                          <MapPin size={11} className="text-emerald-600" />
                          Auto GPS (5m):
                        </span>
                        <span className="font-semibold text-emerald-600 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Active
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dropdown Action Links */}
                <div className="p-1.5 space-y-0.5">
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      navigate('/profile');
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl transition-colors cursor-pointer text-left ${
                      isProfilePage
                        ? 'bg-rose-50 text-rose-700'
                        : 'text-slate-700 hover:text-rose-600 hover:bg-slate-50'
                    }`}
                  >
                    <User size={15} className="text-rose-600" />
                    <span>Profile</span>
                  </button>

                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50/70 rounded-xl transition-colors cursor-pointer text-left"
                  >
                    <LogOut size={15} className="text-rose-600" />
                    <span>Logout Session</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </header>
  );
}
