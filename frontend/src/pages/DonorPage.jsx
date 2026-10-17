import React from 'react';
import { useNavigate } from 'react-router-dom';
import { HeartHandshake, LogOut, User, Droplets, MapPin, Calendar, ClipboardList } from 'lucide-react';

export default function DonorPage({ user, onLogout, autoLocation }) {
  const navigate = useNavigate();
  const isProfileSet = Boolean(
    user?.isProfileSet ||
    (user?.phone?.trim() && (user?.lastLocation?.trim() || user?.permanentLocation?.trim() || user?.currentLocation?.trim()) && user?.bloodGroup?.trim())
  );

  const formatLastSync = (dateVal) => {
    if (!dateVal) return 'Syncs every 5 mins';
    try {
      const d = new Date(dateVal);
      return `Synced at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return 'Every 5 mins';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center text-center p-8 md:p-12 bg-white border border-slate-200 rounded-3xl shadow-xl max-w-xl w-full">
      <div className="p-4 bg-rose-50 border border-rose-200 rounded-full text-rose-600 mb-6 shadow-sm">
        <HeartHandshake className="w-16 h-16" />
      </div>

      <h1 className="text-3xl md:text-4xl font-extrabold text-rose-600 tracking-tight mb-3">
        Voluntary Donor Portal
      </h1>

      {user && (
        <div className="flex flex-col items-center gap-2 mb-6 w-full">
          <div className="inline-flex items-center gap-2 bg-slate-100 border border-slate-200 px-4 py-2 rounded-full text-xs md:text-sm text-slate-700">
            <span>Logged in as: <strong className="text-rose-600">{user.name || user.email}</strong></span>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-center mb-2">
            {user.bloodGroup ? (
              <span className="px-3 py-1 bg-red-50 text-red-700 border border-red-200 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-xs">
                <Droplets size={13} className="text-red-600 fill-red-600/20" />
                <span>Blood Group: {user.bloodGroup}</span>
              </span>
            ) : (
              <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-semibold">
                ⚠️ Blood group not configured in profile
              </span>
            )}

            {(user.lastLocation || user.currentLocation) && (
              <span className="px-3 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-full text-xs font-medium flex items-center gap-1.5">
                <MapPin size={12} className="text-slate-500" />
                <span className="max-w-[200px] truncate">{user.lastLocation || user.currentLocation}</span>
              </span>
            )}
          </div>

          {/* Automatic GPS Background Sync Status Card */}
          <div className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-left shadow-xs mt-2">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Automatic GPS Sync (Every 5 Mins)
                </span>
              </div>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/70 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                Active
              </span>
            </div>

            <p className="text-xs text-slate-600 mb-2 leading-relaxed">
              {user.lastLocation || user.currentLocation ? (
                <>
                  Last Location: <strong className="text-slate-800">{user.lastLocation || user.currentLocation}</strong>
                </>
              ) : (
                'Auto-detecting and saving last location to database every 5 minutes...'
              )}
            </p>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-200/60">
              <span className="font-mono text-[10px] text-slate-500">
                {user.latitude && user.longitude
                  ? `Coords: ${Number(user.latitude).toFixed(4)}, ${Number(user.longitude).toFixed(4)}`
                  : 'Coordinates pending'}
              </span>
              <span className="text-slate-500 font-medium">
                {formatLastSync(user.lastLocationUpdate)}
              </span>
            </div>
          </div>
        </div>
      )}

      <p className="text-slate-500 text-sm max-w-md mb-8 leading-relaxed">
        {isProfileSet
          ? 'Your donor profile is complete and active for automated RBC matching during emergency hospital callouts.'
          : 'Please complete your donor profile with contact phone, permanent location, and blood group.'}
      </p>

      <div className="flex items-center gap-3 flex-wrap justify-center">
        <button
          onClick={() => navigate('/appointment')}
          className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition-all shadow-md cursor-pointer text-xs md:text-sm"
        >
          <Calendar size={16} />
          <span>Book Donation Appointment</span>
        </button>

        <button
          onClick={() => navigate('/my-bookings')}
          className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 hover:text-rose-600 border border-slate-200 rounded-xl font-bold transition-all shadow-xs cursor-pointer text-xs md:text-sm"
        >
          <ClipboardList size={16} className="text-rose-600" />
          <span>My Bookings</span>
        </button>

        <button
          onClick={() => navigate('/profile')}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-all shadow-xs cursor-pointer text-xs md:text-sm"
        >
          <User size={16} />
          <span>{isProfileSet ? 'Edit Profile' : 'Set Profile'}</span>
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
