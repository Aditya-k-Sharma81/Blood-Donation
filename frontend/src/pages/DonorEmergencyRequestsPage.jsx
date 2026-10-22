import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  HeartPulse,
  Radio,
  MapPin,
  Phone,
  Clock,
  CheckCircle2,
  AlertTriangle,
  X,
  RefreshCw,
  Award,
  Printer,
  Calendar,
  ShieldCheck,
  Droplets,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import Swal from 'sweetalert2';

export default function DonorEmergencyRequestsPage({ user }) {
  const [requests, setRequests] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [respondingId, setRespondingId] = useState(null);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [filterTab, setFilterTab] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'RESOLVED' | 'RECEIPTS'
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const donorId = user?.id || user?._id || '';
  const donorEmail = user?.email || '';

  // Cooldown calculation
  const cooldownInfo = useMemo(() => {
    if (!user?.lastDonationDate) return { isCooldown: false, daysLeft: 0, daysSince: 999 };
    const lastDate = new Date(user.lastDonationDate).getTime();
    const now = Date.now();
    const daysSince = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));
    if (daysSince < 90) {
      return { isCooldown: true, daysLeft: 90 - daysSince, daysSince };
    }
    return { isCooldown: false, daysLeft: 0, daysSince };
  }, [user?.lastDonationDate]);

  // Fetch emergency requests & receipts
  const fetchData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);

      const headers = {
        'x-user-id': donorId,
        'x-donor-id': donorId,
        'x-user-email': donorEmail,
      };
      if (user?.token) headers['Authorization'] = `Bearer ${user.token}`;

      const res = await fetch(`/api/donor/emergency-requests?donorId=${donorId}&email=${encodeURIComponent(donorEmail)}`, {
        headers,
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setRequests(data.requests || []);
        setReceipts(data.receipts || []);
        setLastRefreshed(new Date());
      } else {
        throw new Error(data.message || 'Failed to fetch emergency requests');
      }
    } catch (err) {
      console.error('Fetch Emergency Requests Error:', err);
      if (!silent) {
        Swal.fire({
          icon: 'error',
          title: 'Retrieval Failed',
          text: err.message || 'Could not load emergency requests at this time.',
          confirmButtonColor: '#e11d48',
        });
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (donorId || donorEmail) {
      fetchData();
      // Auto-refresh every 20 seconds for live updates
      const interval = setInterval(() => fetchData(true), 20000);
      return () => clearInterval(interval);
    }
  }, [donorId, donorEmail]);

  // Handle Accept or Decline
  const handleRespond = async (requestId, action) => {
    try {
      setRespondingId(requestId);

      const headers = {
        'Content-Type': 'application/json',
        'x-user-id': donorId,
        'x-donor-id': donorId,
        'x-user-email': donorEmail,
      };
      if (user?.token) headers['Authorization'] = `Bearer ${user.token}`;

      const res = await fetch(`/api/donor/emergency-requests/${requestId}/respond`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ action, donorId, donorEmail }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        // Optimistically update
        setRequests((prev) =>
          prev.map((r) =>
            r._id === requestId
              ? {
                  ...r,
                  myResponseStatus: action === 'ACCEPT' ? 'ACCEPTED' : 'DECLINED',
                  respondedAt: new Date(),
                }
              : r
          )
        );

        if (action === 'ACCEPT') {
          Swal.fire({
            icon: 'success',
            title: 'Emergency Request Accepted!',
            html: `<div class="text-left text-xs space-y-2 text-slate-700">
              <p class="font-bold text-slate-900">Thank you for your willingness to save a life!</p>
              <p>The hospital has been notified that you accepted. Please proceed directly to the hospital's Emergency / Blood Bank department.</p>
              <p class="text-rose-600 font-semibold mt-2">Bring a valid photo ID and report to duty staff on arrival.</p>
            </div>`,
            confirmButtonColor: '#059669',
            confirmButtonText: 'Understood, Reporting Now',
          });
        } else {
          Swal.fire({
            icon: 'info',
            title: 'Request Declined',
            text: 'Your response has been logged. Thank you for staying active in the voluntary donor network.',
            confirmButtonColor: '#64748b',
          });
        }
      } else {
        throw new Error(data.message || 'Failed to update response.');
      }
    } catch (err) {
      console.error('Emergency Response Error:', err);
      Swal.fire({
        icon: 'error',
        title: 'Action Failed',
        text: err.message,
        confirmButtonColor: '#e11d48',
      });
    } finally {
      setRespondingId(null);
    }
  };

  // Filtered lists
  const activeRequests = useMemo(() => requests.filter((r) => r.status === 'ACTIVE'), [requests]);
  const resolvedRequests = useMemo(() => requests.filter((r) => r.status === 'FULFILLED'), [requests]);

  const displayedRequests = useMemo(() => {
    if (filterTab === 'ACTIVE') return activeRequests;
    if (filterTab === 'RESOLVED') return resolvedRequests;
    return requests;
  }, [filterTab, requests, activeRequests, resolvedRequests]);

  return (
    <div className="w-full max-w-6xl mx-auto my-6 px-4 space-y-6">
      {/* Top Emergency Lifeline Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-red-600 via-rose-600 to-rose-700 rounded-3xl p-6 sm:p-7 text-white shadow-xl shadow-red-600/15">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-[11px] font-extrabold uppercase tracking-wider text-rose-100 border border-white/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
              <span>Live Emergency Dispatch Network</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Emergency Blood Requests
            </h1>
            <p className="text-xs sm:text-sm text-rose-100 max-w-2xl leading-relaxed">
              Urgent blood requests dispatched directly by verified hospitals within your area. Your prompt response can save a critical patient in emergency care.
            </p>
          </div>

          {/* Donor Cooldown Status Badge */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 shrink-0 text-left md:text-right">
            <span className="text-[10px] uppercase tracking-wider text-rose-200 block font-semibold">
              Medical Donation Eligibility
            </span>
            {cooldownInfo.isCooldown ? (
              <div>
                <span className="text-sm font-black text-amber-200 flex items-center gap-1.5 md:justify-end mt-0.5">
                  <Clock size={15} />
                  <span>90-Day Cooldown Active</span>
                </span>
                <p className="text-[11px] text-rose-100 mt-0.5">
                  Eligible in <strong>{cooldownInfo.daysLeft} days</strong> (donated {cooldownInfo.daysSince} days ago)
                </p>
              </div>
            ) : (
              <div>
                <span className="text-sm font-black text-emerald-200 flex items-center gap-1.5 md:justify-end mt-0.5">
                  <ShieldCheck size={15} />
                  <span>Eligible to Donate</span>
                </span>
                <p className="text-[11px] text-rose-100 mt-0.5">
                  Registered Blood Group: <strong>{user?.bloodGroup || 'Voluntary'}</strong>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Decorative background circle */}
        <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
      </div>

      {/* KPI Metric Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Urgent</span>
            <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
              <Radio size={16} className="animate-pulse" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{activeRequests.length}</p>
          <p className="text-[11px] text-red-600 mt-1 font-medium">Pending hospital response</p>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Accepted by You</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {requests.filter((r) => r.myResponseStatus === 'ACCEPTED' || r.myResponseStatus === 'DONATED').length}
          </p>
          <p className="text-[11px] text-emerald-600 mt-1 font-medium">Confirmed willingness</p>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Donation Slips</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <Award size={16} />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{receipts.length}</p>
          <p className="text-[11px] text-rose-600 mt-1 font-medium">Emergency blood donated</p>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Resolved</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShieldCheck size={16} />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{resolvedRequests.length}</p>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">Emergencies fulfilled</p>
        </div>
      </div>

      {/* Tabs Control Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilterTab('ALL')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              filterTab === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            All Requests ({requests.length})
          </button>
          <button
            onClick={() => setFilterTab('ACTIVE')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              filterTab === 'ACTIVE'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-red-700 hover:bg-red-50'
            }`}
          >
            <Radio size={12} className="animate-pulse" />
            <span>Active Urgent ({activeRequests.length})</span>
          </button>
          <button
            onClick={() => setFilterTab('RESOLVED')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              filterTab === 'RESOLVED'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Resolved ({resolvedRequests.length})
          </button>
          <button
            onClick={() => setFilterTab('RECEIPTS')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              filterTab === 'RECEIPTS'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-rose-700 hover:bg-rose-50'
            }`}
          >
            <Award size={12} />
            <span>Donation Receipts ({receipts.length})</span>
          </button>
        </div>

        <button
          onClick={() => fetchData()}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer shadow-xs self-start sm:self-auto shrink-0"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin text-rose-600' : 'text-slate-500'} />
          <span>Refresh Feed</span>
        </button>
      </div>

      {/* Main Content Area */}
      {filterTab === 'RECEIPTS' ? (
        /* Receipts Section */
        <div className="space-y-4">
          {receipts.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500 mx-auto mb-3">
                <Award size={24} />
              </div>
              <h3 className="text-sm font-bold text-slate-900">No Emergency Donation Slips Yet</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                When you respond to a hospital emergency and donate blood, your official digital certificate & slip will appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {receipts.map((rec) => (
                <div
                  key={rec._id}
                  className="bg-white border border-slate-200 hover:border-rose-300 rounded-2xl p-5 shadow-xs transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                          Emergency Transfusion Donation
                        </span>
                        <h4 className="text-base font-bold text-slate-900 mt-1.5">{rec.hospitalName}</h4>
                        <p className="text-xs text-slate-500">{rec.hospitalLocation || 'Emergency Ward'}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-mono">Receipt No</span>
                        <span className="text-xs font-bold font-mono text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {rec.receiptNumber}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-500 block">Blood Group</span>
                        <strong className="text-rose-600 font-black text-sm">{rec.bloodGroup}</strong>
                        <span className="text-[10px] text-slate-400 block mt-0.5">Bag: {rec.bagVolume}</span>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-500 block">Date of Donation</span>
                        <strong className="text-slate-800 font-semibold text-xs">
                          {new Date(rec.donationDate).toLocaleDateString([], {
                            dateStyle: 'medium',
                          })}
                        </strong>
                        <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">
                          Direct Patient Care
                        </span>
                      </div>
                    </div>

                    <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-xl text-[11px] text-amber-900 flex items-center justify-between">
                      <span>90-Day Cooldown Until:</span>
                      <strong>
                        {rec.cooldownUntil
                          ? new Date(rec.cooldownUntil).toLocaleDateString([], { dateStyle: 'medium' })
                          : '90 Days Post-Donation'}
                      </strong>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-end mt-4">
                    <button
                      type="button"
                      onClick={() => setSelectedReceipt(rec)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
                    >
                      <Award size={13} />
                      <span>View Official Slip</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Emergency Feed Section */
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-16 flex flex-col items-center justify-center text-slate-500 shadow-xs">
              <RefreshCw className="w-8 h-8 animate-spin text-rose-600 mb-3" />
              <p className="text-sm font-medium text-slate-700">Connecting to Emergency Lifeline Feed...</p>
              <p className="text-xs text-slate-400 mt-1">Checking for active urgent hospital dispatch requests</p>
            </div>
          ) : displayedRequests.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 mx-auto mb-3">
                <CheckCircle2 size={24} />
              </div>
              <h3 className="text-sm font-bold text-slate-900">No Emergency Requests Found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {filterTab === 'ACTIVE'
                  ? 'There are currently no active urgent emergency blood requests dispatched to your profile.'
                  : 'You have no emergency request records in this category.'}
              </p>
            </div>
          ) : (
            displayedRequests.map((req) => {
              const isFulfilled = req.status === 'FULFILLED';
              const isCancelled = req.status === 'CANCELLED';
              const isAcceptedByMe = req.myResponseStatus === 'ACCEPTED';
              const isDeclinedByMe = req.myResponseStatus === 'DECLINED';
              const isDonatedByMe = req.myResponseStatus === 'DONATED';

              return (
                <div
                  key={req._id}
                  className={`bg-white border rounded-3xl p-5 sm:p-6 shadow-xs transition-all space-y-4 ${
                    isFulfilled
                      ? 'border-emerald-200/90 bg-emerald-50/20'
                      : isCancelled
                      ? 'border-slate-200 opacity-70'
                      : isAcceptedByMe
                      ? 'border-emerald-300 ring-2 ring-emerald-500/10'
                      : 'border-red-200 hover:border-red-300 ring-2 ring-red-500/10'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-100 pb-3.5">
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-xs shrink-0 ${
                          isFulfilled
                            ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                            : 'bg-red-50 text-red-600 border border-red-200'
                        }`}
                      >
                        {isFulfilled ? (
                          <CheckCircle2 className="w-6 h-6" />
                        ) : (
                          <HeartPulse className="w-6 h-6 animate-pulse" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-black text-slate-900 tracking-tight">
                            {req.hospitalName}
                          </h3>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                              isFulfilled
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                : req.urgency === 'CRITICAL'
                                ? 'bg-red-100 text-red-800 border-red-200'
                                : 'bg-amber-100 text-amber-800 border-amber-200'
                            }`}
                          >
                            {isFulfilled ? 'Fulfilled / Closed' : req.urgency}
                          </span>
                        </div>

                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 flex-wrap">
                          <MapPin size={13} className="text-rose-500 shrink-0" />
                          <span>{req.hospitalLocation || 'Hospital Emergency Desk'}</span>
                          {req.distanceKm > 0 && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span className="font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200/60">
                                ~{req.distanceKm} km away
                              </span>
                            </>
                          )}
                          <span className="text-slate-300">•</span>
                          <span className="text-slate-400">
                            Dispatched {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Blood Group Needed Badge */}
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-semibold uppercase">Requested</span>
                        <span className="text-lg font-black text-rose-600 bg-rose-50 px-3 py-0.5 rounded-xl border border-rose-200 inline-block">
                          🩸 {req.bloodGroup}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Emergency Message */}
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-700 leading-relaxed font-medium">
                    <p className="font-semibold text-slate-900 mb-0.5">Emergency Message from Hospital:</p>
                    <p className="text-slate-600">{req.message}</p>
                  </div>

                  {/* Status & Resolution Alerts */}
                  {isFulfilled ? (
                    isDonatedByMe ? (
                      /* This donor actually donated! */
                      <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2 text-emerald-900">
                          <Award className="w-5 h-5 text-emerald-600 shrink-0" />
                          <div>
                            <p className="font-bold">You Donated Blood For This Emergency!</p>
                            <p className="text-[11px] text-emerald-700">
                              Your life-saving donation has been officially completed. 90-day cooldown active.
                            </p>
                          </div>
                        </div>
                        {receipts.find((r) => r.emergencyRequestId === req._id) && (
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedReceipt(receipts.find((r) => r.emergencyRequestId === req._id))
                            }
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer"
                          >
                            View Receipt
                          </button>
                        )}
                      </div>
                    ) : (
                      /* Another donor fulfilled the emergency */
                      <div className="p-3.5 rounded-2xl bg-teal-50 border border-teal-200 flex items-start gap-2.5 text-xs text-teal-950">
                        <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-black text-teal-900 text-sm">
                            Emergency Resolved — Blood Requirement Fulfilled
                          </p>
                          <p className="text-teal-800 text-xs mt-0.5 leading-relaxed">
                            The urgent blood requirement for <strong>{req.bloodGroup}</strong> at{' '}
                            <strong>{req.hospitalName}</strong> has been fulfilled by a responding donor. You do not need to report to the hospital. Thank you for your readiness to save lives!
                          </p>
                        </div>
                      </div>
                    )
                  ) : isAcceptedByMe ? (
                    /* Donor has accepted this active emergency */
                    <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 space-y-2 text-xs">
                      <div className="flex items-center gap-2 text-emerald-900 font-bold">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        <span>You Accepted this Emergency! Please Report to the Hospital</span>
                      </div>
                      <p className="text-emerald-800 text-[11px] leading-relaxed">
                        Hospital staff are expecting you. Please visit the Blood Bank / Emergency Department at{' '}
                        <strong>{req.hospitalName}</strong> ({req.hospitalLocation}).
                      </p>
                      {req.hospitalPhone && (
                        <div className="pt-2 border-t border-emerald-200/80 flex items-center justify-between">
                          <span className="text-[11px] text-emerald-800 font-semibold">
                            Direct Hospital Emergency Line:
                          </span>
                          <a
                            href={`tel:${req.hospitalPhone}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs transition-all"
                          >
                            <Phone size={12} />
                            <span>Call {req.hospitalPhone}</span>
                          </a>
                        </div>
                      )}
                    </div>
                  ) : isDeclinedByMe ? (
                    /* Donor declined */
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-500 flex items-center justify-between">
                      <span>You previously declined this emergency request.</span>
                      <button
                        type="button"
                        onClick={() => handleRespond(req._id, 'ACCEPT')}
                        disabled={respondingId === req._id}
                        className="text-rose-600 hover:text-rose-700 font-bold underline cursor-pointer"
                      >
                        Change to Accept
                      </button>
                    </div>
                  ) : (
                    /* Active Request - Needs Donor Response */
                    <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        {req.hospitalPhone && (
                          <a
                            href={`tel:${req.hospitalPhone}`}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all shadow-xs"
                          >
                            <Phone size={13} className="text-rose-600" />
                            <span>Call {req.hospitalPhone}</span>
                          </a>
                        )}
                      </div>

                      {/* Primary Actions: Accept & Decline */}
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => handleRespond(req._id, 'DECLINE')}
                          disabled={respondingId === req._id}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                        >
                          Decline
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRespond(req._id, 'ACCEPT')}
                          disabled={respondingId === req._id}
                          className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white rounded-xl text-xs font-extrabold shadow-md shadow-rose-600/25 transition-all hover:-translate-y-0.5 cursor-pointer disabled:opacity-50"
                        >
                          <CheckCircle2 size={15} />
                          <span>
                            {respondingId === req._id ? 'Responding...' : 'Accept & Report to Hospital'}
                          </span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Official Emergency Donation Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm overflow-y-auto p-2 sm:p-4 flex min-h-full items-center justify-center">
          <div className="relative w-full max-w-xl my-auto bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Top Header */}
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200">
                  <Award size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Official Emergency Donation Receipt</h3>
                  <p className="text-[11px] text-slate-500">Government & Clinical Transfusion Proof</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Printable Certificate Content */}
            <div id="emergency-receipt-print" className="p-6 space-y-4 text-xs">
              <div className="border border-slate-200 rounded-2xl p-5 bg-gradient-to-br from-rose-50/30 via-white to-slate-50/40 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between border-b border-slate-200 pb-3">
                  <div>
                    <span className="text-[10px] font-black tracking-wider uppercase text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-md border border-rose-200">
                      EMERGENCY DISPATCH CERTIFIED
                    </span>
                    <h4 className="text-base font-black text-slate-900 mt-1">{selectedReceipt.hospitalName}</h4>
                    <p className="text-xs text-slate-500">{selectedReceipt.hospitalLocation || 'Emergency Transfusion Medicine'}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-mono">Receipt Number</span>
                    <span className="text-xs font-bold font-mono text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {selectedReceipt.receiptNumber}
                    </span>
                  </div>
                </div>

                {/* Donor Details Card */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Voluntary Donor</span>
                    <strong className="text-slate-900 text-sm font-bold">{selectedReceipt.donorName}</strong>
                    <span className="text-[11px] text-slate-500 block mt-0.5">{selectedReceipt.donorPhone || selectedReceipt.donorEmail}</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Patient / Ward</span>
                    <strong className="text-slate-900 text-sm font-bold">{selectedReceipt.patientName || 'Emergency Patient'}</strong>
                    <span className="text-[11px] text-slate-500 block mt-0.5">{selectedReceipt.patientWard || 'Emergency / ICU'}</span>
                  </div>
                </div>

                {/* Blood Specs */}
                <div className="bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-2xl p-4 flex items-center justify-between shadow-sm">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-rose-100 block">
                      Donated Blood Group
                    </span>
                    <div className="text-3xl font-black">{selectedReceipt.bloodGroup}</div>
                    <span className="text-xs text-rose-100 font-medium">Bag Size: {selectedReceipt.bagVolume}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-rose-100 block">
                      Quantity Donated
                    </span>
                    <div className="text-3xl font-black">{selectedReceipt.units} Unit</div>
                    <span className="text-[10px] text-rose-200 block">Direct Emergency Transfusion</span>
                  </div>
                </div>

                {/* Cooldown Information */}
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 space-y-1">
                  <div className="flex items-center justify-between font-bold text-xs">
                    <span>Clinical 90-Day Cooldown Protocol:</span>
                    <span>ACTIVE</span>
                  </div>
                  <p className="text-[11px] text-amber-800">
                    In compliance with medical guidelines, your next voluntary blood donation eligibility begins on{' '}
                    <strong>
                      {selectedReceipt.cooldownUntil
                        ? new Date(selectedReceipt.cooldownUntil).toLocaleDateString([], { dateStyle: 'long' })
                        : '90 Days Post-Donation'}
                    </strong>.
                  </p>
                </div>

                {/* Footer Signature */}
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
                  <span>
                    Officer: <strong>{selectedReceipt.collectedByStaffName}</strong>
                  </span>
                  <span>
                    Donated On:{' '}
                    {new Date(selectedReceipt.donationDate).toLocaleString([], {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Bottom Buttons */}
            <div className="px-5 py-3 border-t border-slate-100 bg-white flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer"
              >
                <Printer size={14} />
                <span>Print Certificate</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
