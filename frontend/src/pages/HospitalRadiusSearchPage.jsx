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
  Send,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  X,
  Phone,
  Clock,
  AlertCircle,
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

  // Checkbox Selection for Emergency Request
  const [selectedDonorIds, setSelectedDonorIds] = useState([]);

  // Emergency Request Modal State
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestUrgency, setRequestUrgency] = useState('CRITICAL');
  const [requestMessage, setRequestMessage] = useState('');
  const [requestPhone, setRequestPhone] = useState(user?.phone || user?.emergencyContact || '');
  const [sendingRequest, setSendingRequest] = useState(false);

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

  // Eligible donors from the filtered list (90-day cooldown verified)
  const eligibleDonors = useMemo(() => {
    return filteredNearbyDonors.filter((d) => d.isEligibleForDonation !== false);
  }, [filteredNearbyDonors]);

  const isAllEligibleSelected = useMemo(() => {
    if (eligibleDonors.length === 0) return false;
    return eligibleDonors.every((d) => selectedDonorIds.includes(d._id || d.id));
  }, [eligibleDonors, selectedDonorIds]);

  const handleToggleSelectAll = () => {
    if (isAllEligibleSelected) {
      setSelectedDonorIds([]);
    } else {
      setSelectedDonorIds(eligibleDonors.map((d) => d._id || d.id));
    }
  };

  const handleToggleDonor = (donorId, isEligible, daysSince, daysLeft) => {
    if (!isEligible) {
      Swal.fire({
        icon: 'warning',
        title: 'Donor Ineligible (90-Day Cooldown)',
        html: `<div class="text-left text-xs space-y-1.5 text-slate-700">
          <p>This donor donated <strong>${daysSince ?? 0} days ago</strong>.</p>
          <p>Under medical regulations, voluntary donors must complete at least a <strong>90-day cooldown period</strong> before donating again.</p>
          <p class="text-red-600 font-bold mt-2">Cooldown remaining: ${daysLeft ?? 90} day(s)</p>
        </div>`,
        confirmButtonColor: '#e11d48',
      });
      return;
    }
    setSelectedDonorIds((prev) =>
      prev.includes(donorId) ? prev.filter((id) => id !== donorId) : [...prev, donorId]
    );
  };

  const handleOpenRequestModal = () => {
    if (selectedDonorIds.length === 0) {
      Swal.fire({
        icon: 'info',
        title: 'Select Donors',
        text: 'Please select one or more eligible donors using the checkboxes on the left side of the list.',
        confirmButtonColor: '#e11d48',
      });
      return;
    }
    const bgText = donorBloodFilter !== 'ALL' ? `${donorBloodFilter} ` : '';
    setRequestMessage(
      `Emergency: Urgent ${bgText}blood replenishment required at ${hospitalName}. Registered voluntary donors are requested to contact or visit the hospital emergency department as soon as possible.`
    );
    if (!requestPhone) {
      setRequestPhone(user?.phone || user?.emergencyContact || '');
    }
    setIsRequestModalOpen(true);
  };

  const handleSendEmergencyRequest = async (e) => {
    if (e) e.preventDefault();
    if (selectedDonorIds.length === 0) return;

    try {
      setSendingRequest(true);
      const headers = {
        'Content-Type': 'application/json',
        'x-user-id': user?.id || user?._id || '',
        'x-hospital-id': user?.id || user?._id || '',
      };
      if (user?.token) headers['Authorization'] = `Bearer ${user.token}`;

      const payload = {
        donorIds: selectedDonorIds,
        hospitalName,
        bloodGroup: donorBloodFilter !== 'ALL' ? donorBloodFilter : '',
        urgency: requestUrgency,
        message: requestMessage,
        contactPhone: requestPhone,
        radiusKm: selectedRadius,
      };

      const res = await fetch('/api/hospital/send-emergency-request', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setIsRequestModalOpen(false);
        const count = data.sentCount || selectedDonorIds.length;
        setSelectedDonorIds([]);
        Swal.fire({
          icon: 'success',
          title: 'Emergency Request Dispatched!',
          html: `<div class="text-left text-xs space-y-2 text-slate-700">
            <p>Urgent notifications have been sent to <strong>${count} eligible voluntary donor(s)</strong> within <strong>${selectedRadius} km</strong>.</p>
            ${
              data.ineligibleCount > 0
                ? `<p class="text-amber-700 font-semibold">⚠️ ${data.ineligibleCount} donor(s) were excluded because they donated within the last 90 days.</p>`
                : ''
            }
          </div>`,
          confirmButtonColor: '#10b981',
        });
      } else {
        throw new Error(data.message || 'Failed to dispatch emergency request');
      }
    } catch (err) {
      console.error('Send Emergency Request Error:', err);
      Swal.fire({
        icon: 'error',
        title: 'Dispatch Failed',
        text: err.message || 'Could not send emergency request to donors.',
        confirmButtonColor: '#e11d48',
      });
    } finally {
      setSendingRequest(false);
    }
  };

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
        <div className="space-y-4">
          {/* Emergency Outreach Action Toolbar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shrink-0 shadow-xs">
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                    Emergency Blood Outreach Dispatch
                  </h4>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <ShieldCheck size={11} className="text-emerald-600" />
                    <span>90-Day Cooldown Protection Active</span>
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {selectedDonorIds.length === 0 ? (
                    <span>
                      Check the boxes on the left to select voluntary donors who can be sent an urgent emergency blood request.
                    </span>
                  ) : (
                    <span>
                      <strong className="text-red-700 font-extrabold">{selectedDonorIds.length}</strong> eligible donor{selectedDonorIds.length > 1 ? 's' : ''} currently selected for immediate emergency dispatch.
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
              {selectedDonorIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedDonorIds([])}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all cursor-pointer"
                >
                  Clear Selection
                </button>
              )}

              <button
                type="button"
                onClick={handleOpenRequestModal}
                disabled={selectedDonorIds.length === 0}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer ${
                  selectedDonorIds.length > 0
                    ? 'bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/25'
                    : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
                }`}
                title={selectedDonorIds.length === 0 ? 'Select donors using the checkboxes to send request' : 'Send emergency request to selected donors'}
              >
                <Send size={13} className={selectedDonorIds.length > 0 ? 'animate-bounce' : ''} />
                <span>Send Emergency Request {selectedDonorIds.length > 0 ? `(${selectedDonorIds.length})` : ''}</span>
              </button>
            </div>
          </div>

          {/* TABLE VIEW OF DONORS */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="px-3 py-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={isAllEligibleSelected}
                        onChange={handleToggleSelectAll}
                        disabled={eligibleDonors.length === 0}
                        title={eligibleDonors.length === 0 ? 'No eligible donors to select' : 'Select all eligible donors'}
                        className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                      />
                    </th>
                    <th className="px-5 py-3">Donor Name</th>
                    <th className="px-5 py-3">Blood Group</th>
                    <th className="px-5 py-3">Distance</th>
                    <th className="px-5 py-3">Last Recorded Location</th>
                    <th className="px-5 py-3">90-Day Eligibility</th>
                    <th className="px-5 py-3">Contact Number</th>
                    <th className="px-5 py-3">Email</th>
                    <th className="px-5 py-3">Availability</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {filteredNearbyDonors.map((donor) => {
                    const donorId = donor._id || donor.id;
                    const isEligible = donor.isEligibleForDonation !== false;
                    const isSelected = selectedDonorIds.includes(donorId);

                    return (
                      <tr
                        key={donorId}
                        className={`transition-colors ${
                          isSelected
                            ? 'bg-red-50/60'
                            : !isEligible
                            ? 'bg-slate-50/40 opacity-80'
                            : 'hover:bg-slate-50/80'
                        }`}
                      >
                        {/* Checkbox Column */}
                        <td className="px-3 py-3.5 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() =>
                              handleToggleDonor(
                                donorId,
                                isEligible,
                                donor.daysSinceLastDonation,
                                donor.daysUntilEligible
                              )
                            }
                            disabled={!isEligible}
                            title={
                              !isEligible
                                ? `Cannot select: Donated ${donor.daysSinceLastDonation ?? 0} days ago. Mandatory 90-day cooldown active (${donor.daysUntilEligible ?? 90} days remaining).`
                                : isSelected
                                ? 'Click to deselect donor'
                                : 'Select donor for emergency request'
                            }
                            className={`w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500 ${
                              isEligible
                                ? 'cursor-pointer'
                                : 'opacity-25 cursor-not-allowed'
                            }`}
                          />
                        </td>

                        {/* Donor Name Column */}
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

                        {/* Blood Group Column */}
                        <td className="px-5 py-3.5">
                          <span className="px-2.5 py-1 rounded-lg bg-red-50 border border-red-200 text-red-700 font-extrabold text-xs">
                            {donor.bloodGroup || '—'}
                          </span>
                        </td>

                        {/* Distance Column */}
                        <td className="px-5 py-3.5">
                          <span className="font-bold text-red-700 bg-red-50/80 px-2.5 py-1 rounded-lg border border-red-100">
                            {donor.distanceKm < 1
                              ? `${donor.distanceMeters || Math.round(donor.distanceKm * 1000)} m`
                              : `${donor.distanceKm} km`}
                          </span>
                        </td>

                        {/* Last Recorded Location Column */}
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

                        {/* 90-Day Eligibility Column */}
                        <td className="px-5 py-3.5">
                          {isEligible ? (
                            <div className="flex flex-col items-start gap-0.5">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 size={11} className="text-emerald-600" />
                                <span>Eligible</span>
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {donor.daysSinceLastDonation !== null && donor.daysSinceLastDonation !== undefined
                                  ? `Donated ${donor.daysSinceLastDonation}d ago (≥90d)`
                                  : 'No prior donation record'}
                              </span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-start gap-0.5">
                              <span
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200"
                                title={`Must wait ${donor.daysUntilEligible} more day(s) before next eligible donation`}
                              >
                                <AlertTriangle size={11} className="text-amber-600" />
                                <span>Cooldown: {donor.daysUntilEligible}d left</span>
                              </span>
                              <span className="text-[10px] text-amber-700">
                                Donated {donor.daysSinceLastDonation}d ago
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Contact Column */}
                        <td className="px-5 py-3.5 font-medium">
                          {donor.phone ? (
                            <a href={`tel:${donor.phone}`} className="hover:text-red-600">
                              {donor.phone}
                            </a>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        {/* Email Column */}
                        <td className="px-5 py-3.5 text-slate-600">
                          <a href={`mailto:${donor.email}`} className="hover:text-red-600">
                            {donor.email}
                          </a>
                        </td>

                        {/* Availability Column */}
                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <span>Available</span>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Emergency Request Modal */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shadow-xs">
                  <Radio size={20} className="animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Send Emergency Blood Request
                  </h3>
                  <p className="text-xs text-slate-500">
                    Dispatch urgent alerts to nearby voluntary donors
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => !sendingRequest && setIsRequestModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Recipients Summary Pill */}
            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Targeted Donors:</span>
                <span className="font-bold text-red-600 bg-red-50 px-2.5 py-0.5 rounded-full border border-red-100">
                  {selectedDonorIds.length} Eligible Donor(s)
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Search Radius:</span>
                <span className="font-semibold text-slate-800">{selectedRadius} km from {hospitalName}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Requested Blood Group:</span>
                <span className="font-bold text-slate-900">
                  {donorBloodFilter === 'ALL' ? 'Any Blood Group / Selected Donors' : donorBloodFilter}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium pt-1 border-t border-slate-200/60">
                <ShieldCheck size={13} className="text-emerald-600 shrink-0" />
                <span>All selected recipients have satisfied the mandatory 90-day cooldown safety requirement.</span>
              </div>
            </div>

            {/* Form Fields */}
            <form onSubmit={handleSendEmergencyRequest} className="space-y-4">
              {/* Urgency Level */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Urgency Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'CRITICAL', label: 'Critical', sub: 'Immediate', color: 'border-red-300 text-red-700 bg-red-50' },
                    { id: 'URGENT', label: 'Urgent', sub: '< 2 Hours', color: 'border-amber-300 text-amber-800 bg-amber-50' },
                    { id: 'MODERATE', label: 'Moderate', sub: 'Today', color: 'border-blue-300 text-blue-700 bg-blue-50' },
                  ].map((lvl) => (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => setRequestUrgency(lvl.id)}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        requestUrgency === lvl.id
                          ? `${lvl.color} font-bold shadow-xs ring-2 ring-red-500/20`
                          : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                      }`}
                    >
                      <span className="block text-xs font-bold">{lvl.label}</span>
                      <span className="block text-[10px] text-slate-400 mt-0.5">{lvl.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Emergency Message */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Emergency Message to Donors
                </label>
                <textarea
                  rows={3}
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  placeholder="Enter details about the emergency blood need..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none text-slate-800 placeholder:text-slate-400 resize-none font-medium"
                  required
                />
              </div>

              {/* Contact Phone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Hospital Contact Phone for Donors
                </label>
                <div className="relative">
                  <Phone size={14} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type="tel"
                    value={requestPhone}
                    onChange={(e) => setRequestPhone(e.target.value)}
                    placeholder="e.g. +91 9876543210"
                    className="w-full text-xs pl-8 pr-3 py-2.5 rounded-xl border border-slate-200 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none font-medium text-slate-800 placeholder:text-slate-400"
                    required
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRequestModalOpen(false)}
                  disabled={sendingRequest}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={sendingRequest || selectedDonorIds.length === 0}
                  className="flex items-center gap-1.5 px-5 py-2 text-xs font-extrabold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-md shadow-red-600/25 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingRequest ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Transmitting Alerts...</span>
                    </>
                  ) : (
                    <>
                      <Send size={14} />
                      <span>Dispatch to {selectedDonorIds.length} Donor(s)</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
