import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { HeartPulse, User, LogOut, ChevronDown, Droplets, MapPin, Calendar, ClipboardList, Bell, AlertTriangle, CheckCircle2, Radio, Phone } from 'lucide-react';
import MedicalReportModal from '../MedicalReportModal';

export default function DonorNavbar({ user, onLogout, autoLocation }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Notification States
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const notifRef = useRef(null);

  const isProfilePage = location.pathname === '/profile' || location.pathname === '/donor/profile';
  const isProfileSet = Boolean(
    user?.isProfileSet ||
    (user?.phone?.trim() && (user?.lastLocation?.trim() || user?.permanentLocation?.trim() || user?.currentLocation?.trim()) && user?.bloodGroup?.trim())
  );

  // Fetch Notifications
  const fetchNotifications = async () => {
    try {
      const donorId = user?.id || user?._id || '';
      const donorEmail = user?.email || '';
      if (!donorId && !donorEmail) return;

      const headers = {
        'x-user-id': donorId,
        'x-donor-id': donorId,
        'x-user-email': donorEmail,
      };
      if (user?.token) {
        headers['Authorization'] = `Bearer ${user.token}`;
      }

      const params = new URLSearchParams();
      if (donorId) params.append('donorId', donorId);
      if (donorEmail) params.append('email', donorEmail);

      const res = await fetch(`/api/donor/notifications?${params.toString()}`, { headers });
      const data = await res.json();
      if (res.ok && data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) { }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 25000);
    return () => clearInterval(interval);
  }, [user?.id, user?._id, user?.email]);

  const handleMarkRead = async (notifId, e) => {
    if (e) e.stopPropagation();
    try {
      await fetch(`/api/donor/notifications/${notifId}/read`, {
        method: 'PATCH',
      });
      setNotifications((prev) =>
        prev.map((n) => (n._id === notifId ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) { }
  };

  const handleMarkAllRead = async () => {
    try {
      const donorId = user?.id || user?._id || '';
      const donorEmail = user?.email || '';
      await fetch('/api/donor/notifications/read-all', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ donorId, donorEmail }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) { }
  };

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifDropdownOpen(false);
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

            {/* Notification Bell with Badge & Dropdown */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setNotifDropdownOpen((prev) => !prev)}
                className="relative p-2 rounded-xl text-slate-600 hover:text-rose-600 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Notifications & Medical Alerts"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-600 text-white text-[9px] font-black items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  </span>
                )}
              </button>

              {/* Notification Dropdown Menu */}
              {notifDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden divide-y divide-slate-100 animate-in fade-in duration-150">
                  {/* Header */}
                  <div className="px-4 py-3 bg-slate-50/80 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                      <Bell size={14} className="text-rose-600" />
                      <span>Notifications & Alerts</span>
                      {unreadCount > 0 && (
                        <span className="px-1.5 py-0.2 bg-rose-100 text-rose-800 text-[10px] font-bold rounded-full">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAllRead}
                        className="text-[11px] text-rose-600 hover:text-rose-800 font-semibold cursor-pointer"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  {/* List of Notifications */}
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400">
                        No notifications at this time.
                      </div>
                    ) : (
                      notifications.map((notif) => {
                        const isMismatch = notif.type === 'BLOOD_GROUP_MISMATCH';
                        const isEmergency = notif.type === 'EMERGENCY_REQUEST';
                        return (
                          <div
                            key={notif._id}
                            onClick={() => {
                              if (!notif.isRead) handleMarkRead(notif._id);
                              if (notif.details && !isEmergency) {
                                setSelectedReport(notif);
                                setNotifDropdownOpen(false);
                              }
                            }}
                            className={`p-3.5 hover:bg-slate-50 transition-colors cursor-pointer text-xs space-y-1.5 ${
                              !notif.isRead
                                ? isEmergency
                                  ? 'bg-red-50/90 border-l-4 border-l-red-600'
                                  : isMismatch
                                  ? 'bg-amber-50/60'
                                  : 'bg-rose-50/40'
                                : isEmergency
                                ? 'bg-red-50/30'
                                : 'bg-white'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span
                                className={`font-bold flex items-center gap-1.5 leading-snug ${
                                  isEmergency
                                    ? 'text-red-900'
                                    : isMismatch
                                    ? 'text-amber-900'
                                    : 'text-slate-900'
                                }`}
                              >
                                {isEmergency ? (
                                  <Radio size={14} className="text-red-600 animate-pulse shrink-0" />
                                ) : isMismatch ? (
                                  <AlertTriangle size={14} className="text-amber-600 shrink-0" />
                                ) : (
                                  <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                                )}
                                <span>{notif.title}</span>
                              </span>
                              {!notif.isRead && (
                                <span className="w-2 h-2 rounded-full bg-rose-600 shrink-0 mt-1 animate-ping"></span>
                              )}
                            </div>

                            <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                              {notif.message}
                            </p>

                            {isEmergency && notif.details?.contactPhone && (
                              <div className="p-2 bg-white rounded-lg border border-red-200 text-[11px] text-red-950 flex items-center justify-between">
                                <span>
                                  Hospital: <strong className="text-red-700">{notif.details.hospitalName || 'Emergency Desk'}</strong>
                                </span>
                                <a
                                  href={`tel:${notif.details.contactPhone}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-[10px] text-white bg-red-600 hover:bg-red-700 font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs"
                                >
                                  <Phone size={10} />
                                  <span>Call {notif.details.contactPhone}</span>
                                </a>
                              </div>
                            )}

                            {isMismatch && notif.details?.verifiedBloodGroup && (
                              <div className="p-2 bg-white rounded-lg border border-amber-200/80 text-[11px] text-amber-950 flex items-center justify-between">
                                <span>
                                  Verified: <strong className="text-rose-700">{notif.details.verifiedBloodGroup}</strong> (Profile was {notif.details.registeredBloodGroup})
                                </span>
                                <span className="text-[10px] text-amber-800 font-bold underline">
                                  View Medical Report →
                                </span>
                              </div>
                            )}

                            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                              <span>
                                {new Date(notif.createdAt).toLocaleDateString([], {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                              {notif.details && (
                                <span className="text-rose-600 font-semibold hover:underline">
                                  View Full Report
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

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

    {/* Full Medical & Blood Group Cross-Match Report Modal */}
    <MedicalReportModal
      isOpen={Boolean(selectedReport)}
      onClose={() => setSelectedReport(null)}
      report={selectedReport}
    />
    </header>
  );
}
