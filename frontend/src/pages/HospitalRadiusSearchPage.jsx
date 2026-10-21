import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  MapPin,
  Radio,
  RefreshCw,
  Search,
  LocateFixed,
  Calendar,
  Layers,
} from 'lucide-react';
import Swal from 'sweetalert2';

export default function HospitalRadiusSearchPage({ user, onLogout }) {
  const hospitalName = user?.hospitalName || user?.name || 'City Central Hospital';

  // Radius Search State (5km, 10km, 15km)
  const [selectedRadius, setSelectedRadius] = useState(5); // 5 | 10 | 15
  const [nearbyDonors, setNearbyDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hospitalLocation, setHospitalLocation] = useState(null);
  const [donorBloodFilter, setDonorBloodFilter] = useState('ALL');
  const [donorSearchQuery, setDonorSearchQuery] = useState('');
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  // Fetch Nearby Donors based on Hospital Permanent Location & Selected Radius
  const fetchNearbyDonors = async (radius = selectedRadius, silent = false) => {
    try {
      if (!silent) setLoading(true);

      const headers = {
        'x-user-id': user?.id || user?._id || '',
        'x-hospital-id': user?.id || user?._id || '',
      };
      if (user?.token) {
        headers['Authorization'] = `Bearer ${user.token}`;
      }

      const params = new URLSearchParams({
        radius: String(radius),
        hospitalName: hospitalName || '',
      });
      if (donorBloodFilter && donorBloodFilter !== 'ALL') {
        params.set('bloodGroup', donorBloodFilter);
      }

      const res = await fetch(`/api/hospital/nearby-donors?${params.toString()}`, {
        headers,
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setNearbyDonors(data.donors || []);
        if (data.hospitalLocation) {
          setHospitalLocation(data.hospitalLocation);
        }
        setLastRefreshed(new Date());
      } else {
        throw new Error(data.message || 'Failed to fetch nearby donors');
      }
    } catch (err) {
      console.error('Fetch Nearby Donors Error:', err);
      if (!silent) {
        Swal.fire({
          icon: 'error',
          title: 'Failed to Locate Donors',
          text: err.message || 'Could not fetch donors within radius.',
          confirmButtonColor: '#e11d48',
        });
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchNearbyDonors(selectedRadius);
  }, [user, selectedRadius, donorBloodFilter]);

  // Filtered nearby donors based on search query and blood group
  const filteredNearbyDonors = useMemo(() => {
    return nearbyDonors.filter((donor) => {
      if (donorBloodFilter !== 'ALL' && donor.bloodGroup !== donorBloodFilter) {
        return false;
      }
      if (donorSearchQuery.trim()) {
        const q = donorSearchQuery.toLowerCase().trim();
        const matchesName = (donor.name || '').toLowerCase().includes(q);
        const matchesPhone = (donor.phone || '').toLowerCase().includes(q);
        const matchesLoc =
          (donor.lastLocation || '').toLowerCase().includes(q) ||
          (donor.city || '').toLowerCase().includes(q);
        const matchesGroup = (donor.bloodGroup || '').toLowerCase().includes(q);
        if (!matchesName && !matchesPhone && !matchesLoc && !matchesGroup) return false;
      }
      return true;
    });
  }, [nearbyDonors, donorBloodFilter, donorSearchQuery]);

  return (
    <div className="w-full max-w-6xl my-4 space-y-6 self-start">
      {/* Page Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-100 text-red-600 flex items-center justify-center shrink-0 shadow-xs">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                Donor Radius Search
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                <span>Proximity Matching</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
              <span>Hospital: <strong>{hospitalName}</strong></span>
              <span>•</span>
              <span>Staff: {user?.name || user?.email || 'Authorized Staff'}</span>
              <span>•</span>
              <span>Refreshed: {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
          <Link
            to="/hospital"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all cursor-pointer shadow-xs"
            title="View blood stock inventory"
          >
            <Layers size={14} className="text-red-600" />
            <span>Blood Stock</span>
          </Link>

          <Link
            to="/hospital/appointments"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-all cursor-pointer shadow-xs"
            title="View voluntary blood donation appointments"
          >
            <Calendar size={14} className="text-red-600" />
            <span>Appointments</span>
          </Link>

          <button
            onClick={() => fetchNearbyDonors(selectedRadius)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all cursor-pointer shadow-xs disabled:opacity-50"
            title="Refresh donors within radius"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-red-600' : 'text-slate-500'} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Hospital Permanent Location Reference Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center shrink-0 shadow-xs">
            <Building2 className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {hospitalLocation?.hospitalName || hospitalName}
              </h2>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <LocateFixed size={12} className="text-emerald-600" />
                <span>Permanent Hospital Location</span>
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1 flex items-center gap-1.5 flex-wrap">
              <MapPin size={13} className="text-red-500 shrink-0" />
              <span>{hospitalLocation?.locationName || hospitalLocation?.address || 'Fixed Hospital Location'}</span>
              {hospitalLocation?.latitude !== null && hospitalLocation?.latitude !== undefined && (
                <>
                  <span className="text-slate-300">•</span>
                  <span className="font-mono text-slate-500">
                    GPS Locked: {Number(hospitalLocation.latitude).toFixed(6)}° N, {Number(hospitalLocation.longitude).toFixed(6)}° E
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-500 flex items-center gap-1.5 self-start md:self-auto bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
          <LocateFixed size={13} className="text-red-600 shrink-0" />
          <span>Fixed Origin Point for Radius Calculation</span>
        </div>
      </div>

      {/* Radius Controls Card (5km, 10km, 15km) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Radio size={16} className="text-red-600" />
              <span>Select Search Radius</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Displays registered donors whose last stored location falls within this distance from the hospital.
            </p>
          </div>

          {/* 3 Prominent Radius Option Buttons: 5km, 10km, 15km */}
          <div className="flex items-center gap-2 p-1 bg-slate-100/90 rounded-2xl border border-slate-200/80 self-start sm:self-auto">
            {[5, 10, 15].map((km) => {
              const isSelected = selectedRadius === km;
              return (
                <button
                  key={km}
                  onClick={() => {
                    setSelectedRadius(km);
                    fetchNearbyDonors(km);
                  }}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <span>{km} km Radius</span>
                  {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Filter and Search Bar for Donors */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Blood Group Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {['ALL', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((bg) => (
              <button
                key={bg}
                onClick={() => setDonorBloodFilter(bg)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                  donorBloodFilter === bg
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {bg === 'ALL' ? 'All Blood Groups' : bg}
              </button>
            ))}
          </div>

          {/* Search Donors by name or location */}
          <div className="relative flex items-center flex-1 sm:w-64">
            <Search className="absolute left-3 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search name, phone, location..."
              value={donorSearchQuery}
              onChange={(e) => setDonorSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-slate-400 focus:bg-white text-xs pl-8 pr-3 py-1.5 rounded-xl outline-none transition-all placeholder:text-slate-400 font-medium text-slate-800"
            />
            {donorSearchQuery && (
              <button
                onClick={() => setDonorSearchQuery('')}
                className="absolute right-2.5 text-slate-400 hover:text-slate-600 text-xs p-0.5"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Results Counter Banner */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <span>
            Found <strong className="text-slate-900 font-bold">{filteredNearbyDonors.length}</strong> {filteredNearbyDonors.length === 1 ? 'registered donor' : 'registered donors'} within <strong className="text-red-700 font-bold">{selectedRadius} km</strong> of {hospitalName}
          </span>
          {donorBloodFilter !== 'ALL' && (
            <span className="font-semibold text-red-600">
              Filtered by: {donorBloodFilter}
            </span>
          )}
        </div>
      </div>

      {/* Donor List Section */}
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-16 flex flex-col items-center justify-center text-slate-500 shadow-xs">
          <RefreshCw className="w-8 h-8 animate-spin text-red-600 mb-3" />
          <p className="text-sm font-medium text-slate-700">Locating Donors within {selectedRadius} km...</p>
          <p className="text-xs text-slate-400 mt-1">Calculating distance from permanent hospital coordinates</p>
        </div>
      ) : filteredNearbyDonors.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-200 text-red-500 flex items-center justify-center mx-auto mb-3">
            <Radio className="w-7 h-7 text-red-600" />
          </div>
          <p className="text-sm font-bold text-slate-800">
            No Donors Found within {selectedRadius} km
          </p>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            There are currently no active registered donors with their last recorded location within {selectedRadius} km of this hospital.
          </p>
          <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
            {selectedRadius < 10 && (
              <button
                onClick={() => {
                  setSelectedRadius(10);
                  fetchNearbyDonors(10);
                }}
                className="px-4 py-2 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-all cursor-pointer shadow-xs"
              >
                Expand to 10 km Radius
              </button>
            )}
            {selectedRadius < 15 && (
              <button
                onClick={() => {
                  setSelectedRadius(15);
                  fetchNearbyDonors(15);
                }}
                className="px-4 py-2 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-all cursor-pointer shadow-xs"
              >
                Expand to 15 km Radius
              </button>
            )}
            {donorBloodFilter !== 'ALL' && (
              <button
                onClick={() => setDonorBloodFilter('ALL')}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
              >
                Reset Blood Filter
              </button>
            )}
          </div>
        </div>
      ) : (
        /* TABLE VIEW OF DONORS */
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-5 py-3">Donor Name</th>
                  <th className="px-5 py-3">Blood Group</th>
                  <th className="px-5 py-3">Distance</th>
                  <th className="px-5 py-3">Last Recorded Location</th>
                  <th className="px-5 py-3">Contact Number</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Availability</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredNearbyDonors.map((donor) => (
                  <tr key={donor._id || donor.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        {donor.profilePic ? (
                          <img
                            src={donor.profilePic}
                            alt={donor.name}
                            className="w-8 h-8 rounded-lg object-cover border border-slate-200"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-red-600 text-white font-bold text-xs flex items-center justify-center">
                            {(donor.name || 'D').charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <span className="font-bold text-slate-900 block">{donor.name}</span>
                          <span className="text-[10px] text-slate-400">Voluntary Donor</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="px-2.5 py-1 rounded-lg bg-red-50 border border-red-200 text-red-700 font-extrabold text-xs">
                        {donor.bloodGroup || '—'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-bold text-red-700 bg-red-50/80 px-2.5 py-1 rounded-lg border border-red-100">
                        {donor.distanceKm < 1
                          ? `${donor.distanceMeters || Math.round(donor.distanceKm * 1000)} m`
                          : `${donor.distanceKm} km`}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 max-w-xs">
                      <span className="truncate block" title={donor.lastLocation}>
                        {donor.lastLocation || donor.city || '—'}
                      </span>
                      {donor.lastLocationUpdate && (
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {new Date(donor.lastLocationUpdate).toLocaleDateString()}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-medium">
                      {donor.phone ? (
                        <a href={`tel:${donor.phone}`} className="hover:text-red-600">
                          {donor.phone}
                        </a>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      <a href={`mailto:${donor.email}`} className="hover:text-red-600">
                        {donor.email}
                      </a>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        <span>Available</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
