import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import {
  Calendar,
  Clock,
  MapPin,
  Building,
  Droplets,
  CheckCircle2,
  Phone,
  User,
  FileText,
  ArrowLeft,
  Printer,
  RefreshCw,
  Plus,
  AlertCircle,
  X,
  Mail,
  Copy,
  Check,
  ClipboardList,
  ShieldCheck,
  UserCheck,
  HeartPulse,
  AlertTriangle
} from 'lucide-react';
import MedicalReportModal from '../components/MedicalReportModal';

export default function MyBookingsPage({ user }) {
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL'); // 'ALL' | 'UPCOMING' | 'COMPLETED' | 'CANCELLED'
  const [selectedPass, setSelectedPass] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);

  // Medical Record & Mismatch Alert States
  const [selectedMedicalReport, setSelectedMedicalReport] = useState(null);
  const [mismatchAlert, setMismatchAlert] = useState(null);

  const activeUser = useMemo(() => {
    if (user && (user.id || user._id || user.email)) return user;
    try {
      const saved = localStorage.getItem('rakt_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  }, [user]);

  // Fetch appointments strictly for the logged-in donor
  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const donorId = activeUser?.id || activeUser?._id || '';
      const donorEmail = activeUser?.email || '';

      if (!donorId && !donorEmail) {
        setAppointments([]);
        setLoading(false);
        return;
      }

      const headers = {
        'x-user-id': donorId,
        'x-donor-id': donorId,
        'x-user-email': donorEmail,
      };
      if (activeUser?.token) {
        headers['Authorization'] = `Bearer ${activeUser.token}`;
      }

      const queryParams = new URLSearchParams();
      if (donorId) queryParams.append('donorId', donorId);
      if (donorEmail) queryParams.append('email', donorEmail);

      const res = await fetch(`/api/appointments/my?${queryParams.toString()}`, { headers });
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.appointments)) {
        setAppointments(data.appointments);
      } else {
        setAppointments([]);
      }
    } catch (err) {
      console.warn('Error fetching donor appointments:', err);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [activeUser?.id, activeUser?._id, activeUser?.email]);

  // Check if donor has any Blood Group Mismatch notifications
  useEffect(() => {
    const checkMismatchAlert = async () => {
      try {
        const donorId = activeUser?.id || activeUser?._id || '';
        const donorEmail = activeUser?.email || '';
        if (!donorId && !donorEmail) return;

        const params = new URLSearchParams();
        if (donorId) params.append('donorId', donorId);
        if (donorEmail) params.append('email', donorEmail);

        const res = await fetch(`/api/donor/notifications?${params.toString()}`);
        const data = await res.json();
        if (res.ok && data.success && Array.isArray(data.notifications)) {
          const mismatch = data.notifications.find((n) => n.type === 'BLOOD_GROUP_MISMATCH');
          if (mismatch) {
            setMismatchAlert(mismatch);
          }
        }
      } catch (e) { }
    };
    checkMismatchAlert();
  }, [activeUser?.id, activeUser?._id, activeUser?.email]);

  // Handler to open full medical report from separate MongoDB collection
  const handleViewMedicalReport = async (appointmentId) => {
    try {
      const res = await fetch(`/api/appointments/${appointmentId}/donation-record`);
      const data = await res.json();
      if (res.ok && data.success && data.donationRecord) {
        setSelectedMedicalReport(data.donationRecord);
      } else {
        Swal.fire({
          icon: 'info',
          title: 'Donation Record',
          text: 'The medical officer is currently finalizing the clinical report for this appointment.',
          confirmButtonColor: '#e11d48',
        });
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Report Unavailable',
        text: err.message || 'Could not retrieve clinical donation record.',
        confirmButtonColor: '#e11d48',
      });
    }
  };

  // Filtered list based on status tab
  const filteredAppointments = useMemo(() => {
    if (filterStatus === 'ALL') return appointments;
    if (filterStatus === 'UPCOMING') {
      return appointments.filter(
        (a) => a.status === 'Scheduled' || a.status === 'Confirmed'
      );
    }
    if (filterStatus === 'COMPLETED') {
      return appointments.filter((a) => a.status === 'Completed');
    }
    if (filterStatus === 'CANCELLED') {
      return appointments.filter((a) => a.status === 'Cancelled');
    }
    return appointments;
  }, [appointments, filterStatus]);

  // Quick statistics
  const counts = useMemo(() => {
    const upcoming = appointments.filter(
      (a) => a.status === 'Scheduled' || a.status === 'Confirmed'
    ).length;
    const completed = appointments.filter((a) => a.status === 'Completed').length;
    const cancelled = appointments.filter((a) => a.status === 'Cancelled').length;
    return {
      all: appointments.length,
      upcoming,
      completed,
      cancelled,
    };
  }, [appointments]);

  // Copy reference code to clipboard
  const handleCopyCode = (code) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    }
  };

  // Cancel Appointment handler with confirmation dialog & reason prompt
  const handleCancelAppointment = (id, refCode) => {
    Swal.fire({
      title: 'Cancel Blood Donation Appointment?',
      html: `Are you sure you want to cancel booking <strong class="text-rose-600">${refCode}</strong>?<br/><span class="text-xs text-slate-500">You can book another slot anytime.</span>`,
      icon: 'warning',
      input: 'text',
      inputPlaceholder: 'Reason for cancellation (optional)',
      showCancelButton: true,
      confirmButtonColor: '#e11d48',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, Cancel Appointment',
      cancelButtonText: 'No, Keep It',
      background: '#ffffff',
      color: '#0f172a',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const headers = {
            'Content-Type': 'application/json',
            'x-user-id': user?.id || user?._id || '',
            'x-donor-id': user?.id || user?._id || '',
            'x-user-email': user?.email || '',
          };
          if (user?.token) {
            headers['Authorization'] = `Bearer ${user.token}`;
          }

          const res = await fetch(`/api/appointments/${id}/cancel`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({ reason: result.value || 'Donor cancelled' }),
          });

          const data = await res.json();
          if (res.ok && data.success) {
            Swal.fire({
              icon: 'success',
              title: 'Appointment Cancelled',
              text: 'Your appointment has been cancelled successfully.',
              timer: 1600,
              showConfirmButton: false,
              confirmButtonColor: '#e11d48',
            });
            fetchAppointments();
            if (selectedPass?._id === id) {
              setSelectedPass(null);
            }
          } else {
            throw new Error(data.message || 'Cancellation failed');
          }
        } catch (e) {
          Swal.fire({
            icon: 'error',
            title: 'Action Failed',
            text: e.message,
            confirmButtonColor: '#e11d48',
          });
        }
      }
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-6 px-4 sm:px-6">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
        <div>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-rose-600 transition-colors mb-2 cursor-pointer"
          >
            <ArrowLeft size={14} /> Back to Donor Home
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-600 shadow-xs">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                My Blood Donation Bookings
              </h1>
              <p className="text-xs text-slate-500">
                Manage your scheduled appointments, view complete details, and access digital donation passes.
              </p>
              {activeUser && (
                <p className="text-[11px] text-rose-700 font-medium mt-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>Logged in as: <strong>{activeUser.name || 'Donor'}</strong> ({activeUser.email})</span>
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-center">
          <button
            onClick={fetchAppointments}
            disabled={loading}
            title="Refresh bookings"
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-rose-600 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin text-rose-600' : ''} />
          </button>

          <button
            onClick={() => navigate('/appointment')}
            className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs md:text-sm font-bold shadow-sm transition-all cursor-pointer"
          >
            <Plus size={15} />
            <span>Book New Appointment</span>
          </button>
        </div>
      </div>

      {/* Blood Group Mismatch Notice Banner if Alert Exists */}
      {mismatchAlert && (
        <div className="mb-6 p-4.5 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-2 border-amber-300 rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <AlertTriangle size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black text-amber-950 uppercase tracking-wider">
                  Important Medical Alert: Blood Group Verification Discrepancy
                </span>
                <span className="text-[10px] font-bold bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-full">
                  Clinical Cross-Match Notice
                </span>
              </div>
              <p className="text-xs text-amber-900 mt-1 leading-relaxed">
                {mismatchAlert.message}
              </p>
              {mismatchAlert.details?.verifiedBloodGroup && (
                <p className="text-[11px] text-amber-800 mt-1 font-semibold">
                  Lab Tested Blood Group: <strong className="text-rose-700 font-bold">{mismatchAlert.details.verifiedBloodGroup}</strong> (was registered as {mismatchAlert.details.registeredBloodGroup})
                </p>
              )}
            </div>
          </div>

          <button
            onClick={() => setSelectedMedicalReport(mismatchAlert)}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-200 cursor-pointer shrink-0 self-start md:self-auto flex items-center gap-1.5"
          >
            <FileText size={14} />
            <span>View Full Clinical Report</span>
          </button>
        </div>
      )}

      {/* Summary KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
            Total Bookings
          </span>
          <span className="text-2xl font-extrabold text-slate-900 mt-0.5 block">
            {counts.all}
          </span>
        </div>

        <div className="p-3.5 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl shadow-xs">
          <span className="text-[11px] font-semibold text-emerald-700 block uppercase tracking-wider">
            Upcoming
          </span>
          <span className="text-2xl font-extrabold text-emerald-800 mt-0.5 block">
            {counts.upcoming}
          </span>
        </div>

        <div className="p-3.5 bg-blue-50/60 border border-blue-200/80 rounded-2xl shadow-xs">
          <span className="text-[11px] font-semibold text-blue-700 block uppercase tracking-wider">
            Completed
          </span>
          <span className="text-2xl font-extrabold text-blue-800 mt-0.5 block">
            {counts.completed}
          </span>
        </div>

        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider">
            Cancelled
          </span>
          <span className="text-2xl font-extrabold text-slate-700 mt-0.5 block">
            {counts.cancelled}
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-6 text-xs font-semibold scrollbar-none">
        <button
          type="button"
          onClick={() => setFilterStatus('ALL')}
          className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            filterStatus === 'ALL'
              ? 'bg-rose-600 text-white shadow-xs font-bold'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          All Appointments ({counts.all})
        </button>

        <button
          type="button"
          onClick={() => setFilterStatus('UPCOMING')}
          className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            filterStatus === 'UPCOMING'
              ? 'bg-rose-600 text-white shadow-xs font-bold'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Upcoming ({counts.upcoming})
        </button>

        <button
          type="button"
          onClick={() => setFilterStatus('COMPLETED')}
          className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            filterStatus === 'COMPLETED'
              ? 'bg-rose-600 text-white shadow-xs font-bold'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Completed ({counts.completed})
        </button>

        <button
          type="button"
          onClick={() => setFilterStatus('CANCELLED')}
          className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            filterStatus === 'CANCELLED'
              ? 'bg-rose-600 text-white shadow-xs font-bold'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Cancelled ({counts.cancelled})
        </button>
      </div>

      {/* Appointments List State */}
      {loading ? (
        <div className="py-20 bg-white border border-slate-200 rounded-3xl text-center flex flex-col items-center justify-center gap-3">
          <RefreshCw size={28} className="animate-spin text-rose-600" />
          <p className="text-xs font-semibold text-slate-500">
            Loading your blood donation bookings...
          </p>
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div className="py-16 px-6 bg-white border border-slate-200 rounded-3xl text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mx-auto">
            <Calendar size={28} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              No Appointments Found
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {filterStatus === 'ALL'
                ? "You haven't booked any blood donation appointments yet. Schedule your first visit today to save lives!"
                : `No appointments found matching status "${filterStatus}".`}
            </p>
          </div>
          <button
            onClick={() => navigate('/appointment')}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer shadow-md"
          >
            <Plus size={15} />
            <span>Book Blood Donation</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAppointments.map((appt) => {
            const isUpcoming =
              appt.status === 'Scheduled' || appt.status === 'Confirmed';
            const apptDateObj = new Date(appt.appointmentDate);
            const formattedDate = !isNaN(apptDateObj.getTime())
              ? apptDateObj.toLocaleDateString('en-US', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })
              : appt.appointmentDate;

            const createdDateStr = appt.createdAt
              ? new Date(appt.createdAt).toLocaleString('en-US', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })
              : null;

            return (
              <div
                key={appt._id}
                className="bg-white border border-slate-200 hover:border-slate-300 rounded-3xl p-5 sm:p-6 shadow-xs transition-all relative overflow-hidden"
              >
                {/* Top Reference & Status Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                      <span>{appt.bookingReference}</span>
                      <button
                        onClick={() => handleCopyCode(appt.bookingReference)}
                        className="text-rose-400 hover:text-rose-700 cursor-pointer ml-1"
                        title="Copy ticket reference"
                      >
                        {copiedCode === appt.bookingReference ? (
                          <Check size={12} className="text-emerald-600" />
                        ) : (
                          <Copy size={12} />
                        )}
                      </button>
                    </span>

                    {/* Status Badge */}
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 ${
                        appt.status === 'Scheduled'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : appt.status === 'Confirmed'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : appt.status === 'Completed'
                          ? 'bg-blue-50 text-blue-800 border border-blue-200'
                          : 'bg-slate-100 text-slate-500 border border-slate-200 line-through'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          appt.status === 'Scheduled'
                            ? 'bg-amber-500'
                            : appt.status === 'Confirmed'
                            ? 'bg-emerald-500'
                            : appt.status === 'Completed'
                            ? 'bg-blue-500'
                            : 'bg-slate-400'
                        }`}
                      ></span>
                      {appt.status}
                    </span>

                    {/* Blood Group Badge */}
                    <span className="text-[11px] font-bold text-red-700 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-md inline-flex items-center gap-1">
                      <Droplets size={11} className="text-red-600 fill-red-600/20" />
                      <span>{appt.bloodGroup}</span>
                    </span>

                    {/* Type badge */}
                    <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                      {appt.donationType || 'Blood Donation'}
                    </span>
                  </div>

                  {createdDateStr && (
                    <span className="text-[11px] text-slate-400">
                      Booked on: {createdDateStr}
                    </span>
                  )}
                </div>

                {/* Main Information Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
                  {/* Left Column: Hospital Details */}
                  <div className="p-3.5 bg-slate-50/70 border border-slate-200/70 rounded-2xl space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      <Building size={13} className="text-rose-600" />
                      <span>Hospital / Donation Center</span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900">
                      {appt.hospitalName}
                    </h3>

                    {appt.hospitalAddress && (
                      <p className="text-xs text-slate-600 flex items-start gap-1.5">
                        <MapPin size={13} className="text-slate-400 shrink-0 mt-0.5" />
                        <span>
                          {appt.hospitalAddress}
                          {appt.hospitalCity ? `, ${appt.hospitalCity}` : ''}
                        </span>
                      </p>
                    )}

                    {appt.hospitalPhone && (
                      <p className="text-xs text-slate-600 flex items-center gap-1.5 pt-1">
                        <Phone size={13} className="text-slate-400 shrink-0" />
                        <a
                          href={`tel:${appt.hospitalPhone}`}
                          className="hover:text-rose-600 transition-colors font-medium"
                        >
                          {appt.hospitalPhone}
                        </a>
                      </p>
                    )}
                  </div>

                  {/* Right Column: Schedule & Donor Info */}
                  <div className="p-3.5 bg-slate-50/70 border border-slate-200/70 rounded-2xl space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      <Calendar size={13} className="text-rose-600" />
                      <span>Schedule & Donor Info</span>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                      <span className="text-rose-600">{formattedDate}</span>
                      <span>•</span>
                      <span className="text-slate-700 flex items-center gap-1">
                        <Clock size={12} className="text-slate-400" />
                        {appt.timeSlot}
                      </span>
                    </div>

                    <div className="space-y-1 pt-1 text-xs text-slate-600">
                      <p className="flex items-center gap-1.5">
                        <User size={13} className="text-slate-400 shrink-0" />
                        <span>
                          Donor: <strong className="text-slate-800">{appt.donorName}</strong>
                        </span>
                      </p>

                      <p className="flex items-center gap-1.5">
                        <Phone size={13} className="text-slate-400 shrink-0" />
                        <span>
                          Phone: <strong className="text-slate-800">{appt.donorPhone}</strong>
                        </span>
                      </p>

                      {appt.donorEmail && (
                        <p className="flex items-center gap-1.5">
                          <Mail size={13} className="text-slate-400 shrink-0" />
                          <span className="text-slate-600 truncate">{appt.donorEmail}</span>
                        </p>
                      )}

                      <p className="flex items-center gap-1.5 pt-1 border-t border-slate-100">
                        <UserCheck size={13} className="text-rose-600 shrink-0" />
                        <span>
                          Medical Staff: <strong className="text-slate-800">{appt.staffName || 'Duty Staff'}</strong>
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Notes or Cancellation Reason if any */}
                {appt.notes && (
                  <div className="mb-4 p-3 bg-amber-50/60 border border-amber-200/70 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                    <AlertCircle size={14} className="text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Donor Note:</strong> {appt.notes}
                    </span>
                  </div>
                )}

                {appt.status === 'Cancelled' && appt.cancelledReason && (
                  <div className="mb-4 p-3 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-700 flex items-start gap-2">
                    <AlertCircle size={14} className="text-slate-500 shrink-0 mt-0.5" />
                    <span>
                      <strong>Cancellation Reason:</strong> {appt.cancelledReason}
                    </span>
                  </div>
                )}

                {/* Bottom Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                    <ShieldCheck size={13} className="text-emerald-600" />
                    <span>Official Voluntary Blood Donation Ticket</span>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
                    {appt.status === 'Completed' && (
                      <button
                        onClick={() => handleViewMedicalReport(appt._id)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
                        title="View Doctor Clinical Record & Vitals"
                      >
                        <HeartPulse size={13} />
                        <span>View Medical Report</span>
                      </button>
                    )}

                    {isUpcoming && (
                      <button
                        onClick={() =>
                          handleCancelAppointment(appt._id, appt.bookingReference)
                        }
                        className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:border-rose-300 hover:bg-rose-50 text-slate-600 hover:text-rose-700 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Cancel Appointment
                      </button>
                    )}

                    <button
                      onClick={() => setSelectedPass(appt)}
                      className="flex items-center gap-1.5 px-4 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                    >
                      <FileText size={13} />
                      <span>View & Print Pass</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FULL DIGITAL PASS MODAL */}
      {selectedPass && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border-2 border-rose-300 rounded-3xl max-w-lg w-full shadow-2xl p-6 sm:p-8 relative overflow-hidden animate-in fade-in duration-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
                  <Droplets className="w-5 h-5 fill-rose-600/20" />
                </div>
                <div>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                      selectedPass.status === 'Cancelled'
                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                        : selectedPass.status === 'Completed'
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : selectedPass.status === 'Confirmed'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {selectedPass.status}
                  </span>
                  <h2 className="text-base font-extrabold text-slate-900 mt-0.5">
                    Blood Donation Digital Pass
                  </h2>
                </div>
              </div>

              <button
                onClick={() => setSelectedPass(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Pass Content Details */}
            <div className="space-y-3.5 bg-slate-50 p-5 rounded-2xl text-xs border border-slate-200/70">
              <div className="flex justify-between items-center pb-2.5 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Reference Code:</span>
                <span className="font-mono font-bold text-rose-600 text-sm tracking-wide">
                  {selectedPass.bookingReference}
                </span>
              </div>

              <div className="flex justify-between items-start pb-2.5 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Hospital Center:</span>
                <div className="text-right">
                  <p className="font-bold text-slate-900">{selectedPass.hospitalName}</p>
                  <p className="text-[11px] text-slate-500">
                    {selectedPass.hospitalAddress}
                    {selectedPass.hospitalCity ? `, ${selectedPass.hospitalCity}` : ''}
                  </p>
                  {selectedPass.hospitalPhone && (
                    <p className="text-[11px] text-slate-400">
                      Tel: {selectedPass.hospitalPhone}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center pb-2.5 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Date & Time Slot:</span>
                <span className="font-bold text-slate-800">
                  {new Date(selectedPass.appointmentDate).toLocaleDateString('en-US', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}{' '}
                  • {selectedPass.timeSlot}
                </span>
              </div>

              <div className="flex justify-between items-center pb-2.5 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Donor Name:</span>
                <span className="font-bold text-slate-900">{selectedPass.donorName}</span>
              </div>

              <div className="flex justify-between items-center pb-2.5 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Donor Contact:</span>
                <span className="font-bold text-slate-800">{selectedPass.donorPhone}</span>
              </div>

              <div className="flex justify-between items-center pb-2.5 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Blood Group:</span>
                <span className="font-extrabold text-red-600 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-md text-sm">
                  🩸 {selectedPass.bloodGroup}
                </span>
              </div>

              <div className="flex justify-between items-center pb-2.5 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Assigned Medical Staff:</span>
                <span className="font-bold text-slate-800">
                  {selectedPass.staffName || 'Duty Medical Staff'}
                </span>
              </div>

              {selectedPass.status === 'Cancelled' && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 space-y-1">
                  <span className="font-bold block text-[11px]">Cancellation Notice:</span>
                  <p className="text-xs">{selectedPass.cancelledReason || 'This appointment was cancelled.'}</p>
                </div>
              )}

              {selectedPass.notes && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 space-y-1">
                  <span className="font-bold block text-[11px]">Donor Note:</span>
                  <p className="text-xs">{selectedPass.notes}</p>
                </div>
              )}
            </div>

            {/* Simulated Barcode Banner */}
            <div className="my-4 py-2 px-4 bg-slate-100 rounded-xl flex flex-col items-center justify-center border border-slate-200">
              <div className="flex items-center gap-1 font-mono text-[9px] text-slate-400 tracking-[0.3em] uppercase">
                ||| | |||| | ||| |||| | || | ||| | ||||
              </div>
              <span className="text-[10px] font-mono text-slate-500 mt-1 font-bold">
                {selectedPass.bookingReference}
              </span>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5">
              <button
                onClick={() => setSelectedPass(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                <Printer size={14} />
                <span>Print Pass</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Clinical Donation Record & Blood Group Cross-Match Report Modal */}
      <MedicalReportModal
        isOpen={Boolean(selectedMedicalReport)}
        onClose={() => setSelectedMedicalReport(null)}
        report={selectedMedicalReport}
      />
    </div>
  );
}
