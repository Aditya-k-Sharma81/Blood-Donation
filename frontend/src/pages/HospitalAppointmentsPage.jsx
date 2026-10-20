import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
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
  RefreshCw,
  Search,
  Filter,
  Check,
  Copy,
  Printer,
  X,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Mail,
  ChevronRight,
  LayoutGrid,
  List,
  CheckSquare,
  XCircle,
  Clock4,
  Layers,
  ArrowLeft,
  UserCheck
} from 'lucide-react';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function HospitalAppointmentsPage({ user, onLogout }) {
  const [appointments, setAppointments] = useState([]);
  const [metrics, setMetrics] = useState({
    total: 0,
    scheduled: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    todayCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [hospitalName, setHospitalName] = useState(
    user?.hospitalName || user?.name || 'City Central Hospital'
  );

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'TODAY' | 'Scheduled' | 'Confirmed' | 'Completed' | 'Cancelled'
  const [bloodGroupFilter, setBloodGroupFilter] = useState('ALL');
  const [scopeFilter, setScopeFilter] = useState('all'); // 'hospital' (My Hospital Only) | 'all' (All Network Bookings)
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  // Detailed Modal / Slide-over (Navbar is NEVER hidden)
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);
  const [staffNote, setStaffNote] = useState('');

  // Fetch Appointments from API
  const fetchAppointments = async (silent = false) => {
    try {
      if (!silent) setLoading(true);

      const params = new URLSearchParams();
      if (scopeFilter === 'hospital' && hospitalName) {
        params.append('hospitalName', hospitalName);
      } else {
        params.append('scope', 'all');
      }

      if (user?.email) {
        params.append('staffEmail', user.email);
      }
      if (user?.id || user?._id) {
        params.append('staffId', user?.id || user?._id);
      }
      if (user?.role) {
        params.append('role', user.role);
      }

      const headers = {
        'x-user-id': user?.id || user?._id || '',
        'x-hospital-id': user?.id || user?._id || '',
        'x-user-email': user?.email || '',
        'x-user-role': user?.role || '',
      };
      if (user?.token) {
        headers['Authorization'] = `Bearer ${user.token}`;
      }

      const res = await fetch(`/api/hospital/appointments?${params.toString()}`, { headers });
      const data = await res.json();

      if (res.ok && data.success && Array.isArray(data.appointments)) {
        setAppointments(data.appointments);
        if (data.metrics) setMetrics(data.metrics);
        setLastRefreshed(new Date());
      } else {
        throw new Error(data.message || 'Failed to load appointments');
      }
    } catch (err) {
      console.error('Fetch Appointments Error:', err);
      if (!silent) {
        Swal.fire({
          icon: 'error',
          title: 'Load Failed',
          text: err.message || 'Could not retrieve appointments from server.',
          confirmButtonColor: '#e11d48',
        });
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [user, scopeFilter]);

  // Update Status handler (Scheduled -> Confirmed -> Completed or Cancelled)
  const handleUpdateStatus = async (appointmentId, newStatus, reason = '') => {
    try {
      setUpdatingStatusId(appointmentId);

      const headers = {
        'Content-Type': 'application/json',
        'x-user-id': user?.id || user?._id || '',
      };
      if (user?.token) {
        headers['Authorization'] = `Bearer ${user.token}`;
      }

      const res = await fetch(`/api/appointments/${appointmentId}/status`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          status: newStatus,
          cancelledReason: reason,
          notes: staffNote ? staffNote : undefined,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Update local list (remove if cancelled since hospital only shows non-cancelled)
        if (newStatus === 'Cancelled') {
          setAppointments((prev) => prev.filter((item) => item._id !== appointmentId));
          if (selectedAppointment && selectedAppointment._id === appointmentId) {
            setSelectedAppointment(null);
          }
        } else {
          setAppointments((prev) =>
            prev.map((item) => (item._id === appointmentId ? data.appointment : item))
          );
          if (selectedAppointment && selectedAppointment._id === appointmentId) {
            setSelectedAppointment(data.appointment);
          }
        }

        Swal.fire({
          icon: 'success',
          title: `Status: ${newStatus}`,
          text: newStatus === 'Cancelled'
            ? `Appointment ${data.appointment.bookingReference} cancelled and removed from active list.`
            : `Appointment ${data.appointment.bookingReference} marked as ${newStatus}.`,
          timer: 1600,
          showConfirmButton: false,
          iconColor: '#10b981',
        });
      } else {
        throw new Error(data.message || 'Could not update status');
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: err.message,
        confirmButtonColor: '#e11d48',
      });
    } finally {
      setUpdatingStatusId(null);
    }
  };

  // Prompt cancellation reason before cancelling
  const handlePromptCancel = (appointment) => {
    Swal.fire({
      title: 'Cancel Appointment?',
      html: `Are you sure you want to cancel booking <strong class="text-red-600">${appointment.bookingReference}</strong> for <strong>${appointment.donorName}</strong>?<br/><span class="text-xs text-slate-500 mt-1 block">This appointment will be marked as Cancelled and removed from the /hospital appointments view.</span>`,
      input: 'text',
      inputPlaceholder: 'Reason for cancellation (e.g. Donor rescheduled, Not eligible)',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Cancel Booking',
      confirmButtonColor: '#e11d48',
      cancelButtonText: 'Keep Active',
      cancelButtonColor: '#64748b',
    }).then((result) => {
      if (result.isConfirmed) {
        handleUpdateStatus(appointment._id, 'Cancelled', result.value || 'Hospital staff cancelled');
      }
    });
  };

  // Copy reference code to clipboard
  const handleCopyCode = (code, e) => {
    if (e) e.stopPropagation();
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    }
  };

  // Filtered appointments computation (Exclude Cancelled appointments as requested)
  const filteredAppointments = useMemo(() => {
    return appointments.filter((item) => {
      // STRICT FILTER: Jiska status cancelled hai woh /hospital me show NA ho
      if (item.status === 'Cancelled') {
        return false;
      }

      // Status tab filter
      if (statusFilter === 'TODAY') {
        const itemDate = new Date(item.appointmentDate);
        const today = new Date();
        const isSameDay =
          itemDate.getFullYear() === today.getFullYear() &&
          itemDate.getMonth() === today.getMonth() &&
          itemDate.getDate() === today.getDate();
        if (!isSameDay) return false;
      } else if (statusFilter !== 'ALL' && item.status !== statusFilter) {
        return false;
      }

      // Blood Group filter
      if (bloodGroupFilter !== 'ALL' && item.bloodGroup !== bloodGroupFilter) {
        return false;
      }

      // Search query (matches donor name, email, phone, reference, or notes)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = (item.donorName || '').toLowerCase().includes(q);
        const emailMatch = (item.donorEmail || '').toLowerCase().includes(q);
        const phoneMatch = (item.donorPhone || '').toLowerCase().includes(q);
        const refMatch = (item.bookingReference || '').toLowerCase().includes(q);
        const hospMatch = (item.hospitalName || '').toLowerCase().includes(q);
        const noteMatch = (item.notes || '').toLowerCase().includes(q);

        if (!nameMatch && !emailMatch && !phoneMatch && !refMatch && !hospMatch && !noteMatch) {
          return false;
        }
      }

      return true;
    });
  }, [appointments, statusFilter, bloodGroupFilter, searchQuery]);

  return (
    <div className="w-full max-w-6xl my-4 space-y-6 self-start relative">
      {/* Hospital Staff Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-100 text-red-600 flex items-center justify-center shrink-0 shadow-xs">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                Donation Appointments
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Live Schedule</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
              <span>Center: <strong>{hospitalName}</strong></span>
              <span>•</span>
              <span>Logged Staff: <strong>{user?.name || user?.email || 'Authorized Staff'}</strong></span>
              <span>•</span>
              <span>Refreshed: {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </p>
          </div>
        </div>

        {/* Header Quick Actions */}
        <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
          <Link
            to="/hospital"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all cursor-pointer shadow-xs"
            title="Go to Blood Inventory Management"
          >
            <Layers size={14} className="text-slate-500" />
            <span className="hidden sm:inline">Blood Stock</span>
          </Link>

          <button
            onClick={() => fetchAppointments()}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all cursor-pointer shadow-xs disabled:opacity-50"
            title="Refresh appointments"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-red-600' : 'text-slate-500'} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Active Appointments */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Active Bookings</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
              <Calendar size={15} />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {metrics.total} <span className="text-xs font-medium text-slate-500">Slots</span>
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Valid non-cancelled bookings</p>
        </div>

        {/* Today's Appointments */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'TODAY' ? 'ALL' : 'TODAY')}
          className={`p-4 rounded-2xl shadow-xs transition-all cursor-pointer border ${statusFilter === 'TODAY'
            ? 'bg-amber-100/70 border-amber-400 ring-2 ring-amber-300'
            : 'bg-white border-amber-200/80 hover:border-amber-300'
            }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider">Today's Visits</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Clock4 size={15} />
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-900 mt-2">
            {metrics.todayCount} <span className="text-xs font-medium text-amber-700">Today</span>
          </p>
          <p className="text-[11px] text-amber-700 mt-0.5 font-medium">Click to filter today</p>
        </div>

        {/* Scheduled / Pending */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'Scheduled' ? 'ALL' : 'Scheduled')}
          className={`p-4 rounded-2xl shadow-xs transition-all cursor-pointer border ${statusFilter === 'Scheduled'
            ? 'bg-blue-100/70 border-blue-400 ring-2 ring-blue-300'
            : 'bg-white border-blue-200/80 hover:border-blue-300'
            }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider">Scheduled</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <Clock size={15} />
            </div>
          </div>
          <p className="text-2xl font-bold text-blue-900 mt-2">
            {metrics.scheduled} <span className="text-xs font-medium text-slate-500">Pending</span>
          </p>
          <p className="text-[11px] text-blue-600 mt-0.5">Awaiting verification</p>
        </div>

        {/* Confirmed */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'Confirmed' ? 'ALL' : 'Confirmed')}
          className={`p-4 rounded-2xl shadow-xs transition-all cursor-pointer border ${statusFilter === 'Confirmed'
            ? 'bg-purple-100/70 border-purple-400 ring-2 ring-purple-300'
            : 'bg-white border-purple-200/80 hover:border-purple-300'
            }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-purple-700 uppercase tracking-wider">Confirmed</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
              <CheckSquare size={15} />
            </div>
          </div>
          <p className="text-2xl font-bold text-purple-900 mt-2">
            {metrics.confirmed} <span className="text-xs font-medium text-slate-500">Ready</span>
          </p>
          <p className="text-[11px] text-purple-600 mt-0.5">Slot approved</p>
        </div>

        {/* Completed */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'Completed' ? 'ALL' : 'Completed')}
          className={`p-4 rounded-2xl shadow-xs transition-all cursor-pointer border ${statusFilter === 'Completed'
            ? 'bg-emerald-100/70 border-emerald-400 ring-2 ring-emerald-300'
            : 'bg-white border-emerald-200/80 hover:border-emerald-300'
            }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">Completed</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 size={15} />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-900 mt-2">
            {metrics.completed} <span className="text-xs font-medium text-slate-500">Donated</span>
          </p>
          <p className="text-[11px] text-emerald-600 mt-0.5">Successfully collected</p>
        </div>
      </div>

      {/* Staff Personal Portal Banner */}
      {user?.role === 'HOSPITAL' && (
        <div className="bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-rose-200 flex items-center justify-center text-rose-600 shrink-0 shadow-2xs">
              <UserCheck size={20} />
            </div>
            <div>
              <p className="font-bold text-slate-800 text-sm">
                Staff Portal: Your Assigned Appointments
              </p>
              <p className="text-slate-500 text-xs mt-0.5">
                Showing only blood donation bookings assigned to <strong>{user?.name || user?.email}</strong> ({user?.email})
              </p>
            </div>
          </div>
          <span className="bg-white text-rose-700 font-bold px-3 py-1.5 rounded-xl text-xs border border-rose-200 shadow-2xs self-start sm:self-auto flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            <span>{filteredAppointments.length} Active Booking{filteredAppointments.length !== 1 ? 's' : ''}</span>
          </span>
        </div>
      )}

      {/* Filter and Control Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Status Filter Tabs (Only Non-Cancelled Appointments) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer whitespace-nowrap ${statusFilter === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
            >
              All Active ({filteredAppointments.length})
            </button>

            <button
              onClick={() => setStatusFilter('TODAY')}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer whitespace-nowrap ${statusFilter === 'TODAY'
                ? 'bg-amber-600 text-white shadow-xs font-bold'
                : 'text-amber-800 hover:bg-amber-50'
                }`}
            >
              <Clock4 size={12} />
              <span>Today ({metrics.todayCount})</span>
            </button>

            <button
              onClick={() => setStatusFilter('Scheduled')}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer whitespace-nowrap ${statusFilter === 'Scheduled'
                ? 'bg-blue-600 text-white shadow-xs font-bold'
                : 'text-blue-700 hover:bg-blue-50'
                }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              <span>Scheduled ({metrics.scheduled})</span>
            </button>

            <button
              onClick={() => setStatusFilter('Confirmed')}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer whitespace-nowrap ${statusFilter === 'Confirmed'
                ? 'bg-purple-600 text-white shadow-xs font-bold'
                : 'text-purple-700 hover:bg-purple-50'
                }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
              <span>Confirmed ({metrics.confirmed})</span>
            </button>

            <button
              onClick={() => setStatusFilter('Completed')}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer whitespace-nowrap ${statusFilter === 'Completed'
                ? 'bg-emerald-600 text-white shadow-xs font-bold'
                : 'text-emerald-700 hover:bg-emerald-50'
                }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Completed ({metrics.completed})</span>
            </button>
          </div>

          {/* Hospital Scope Selector Toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/80 self-start lg:self-auto shrink-0">
            <button
              onClick={() => setScopeFilter('all')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${scopeFilter === 'all'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
                }`}
              title="View all appointments across blood banks"
            >
              All Bookings
            </button>
            <button
              onClick={() => setScopeFilter('hospital')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${scopeFilter === 'hospital'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
                }`}
              title="Filter to this hospital only"
            >
              This Hospital Only
            </button>
          </div>
        </div>

        {/* Second Row: Search, Blood Group Dropdown, View Mode */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2.5 flex-1">
            {/* Search Input */}
            <div className="relative flex items-center flex-1 max-w-md">
              <Search className="absolute left-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search donor name, phone, email, or RKT-APT code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-slate-400 focus:bg-white text-xs pl-9 pr-8 py-2 rounded-xl outline-none transition-all placeholder:text-slate-400 font-medium text-slate-800"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 text-slate-400 hover:text-slate-600 text-xs p-0.5"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Blood Group Select */}
            <select
              value={bloodGroupFilter}
              onChange={(e) => setBloodGroupFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs px-3 py-2 rounded-xl font-semibold text-slate-700 outline-none focus:border-slate-400 transition-all cursor-pointer"
            >
              <option value="ALL">All Blood Groups</option>
              {BLOOD_GROUPS.map((bg) => (
                <option key={bg} value={bg}>
                  Blood Group {bg}
                </option>
              ))}
            </select>
          </div>

          {/* View Mode Toggle: Grid vs Table */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/80 self-end sm:self-auto shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewMode === 'grid'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
                }`}
              title="Card Grid View"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewMode === 'table'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
                }`}
              title="Compact Table View"
            >
              <List size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Appointments Display */}
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-16 flex flex-col items-center justify-center text-slate-500 shadow-xs">
          <RefreshCw className="w-8 h-8 animate-spin text-red-600 mb-3" />
          <p className="text-sm font-medium text-slate-700">Loading Donor Appointments...</p>
          <p className="text-xs text-slate-400 mt-1">Retrieving scheduled bookings from database</p>
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs">
          <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-800">No Appointments Match Current Filters</p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {appointments.length === 0
              ? 'No appointments currently recorded in the system.'
              : 'Try clearing the search query or status filters to view all entries.'}
          </p>
          <button
            onClick={() => {
              setStatusFilter('ALL');
              setBloodGroupFilter('ALL');
              setSearchQuery('');
              setScopeFilter('all');
            }}
            className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 rounded-xl transition-all cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW OF APPOINTMENTS */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAppointments.map((appt) => {
            const apptDateObj = new Date(appt.appointmentDate);
            const isToday =
              apptDateObj.getFullYear() === new Date().getFullYear() &&
              apptDateObj.getMonth() === new Date().getMonth() &&
              apptDateObj.getDate() === new Date().getDate();

            const formattedDate = !isNaN(apptDateObj.getTime())
              ? apptDateObj.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })
              : appt.appointmentDate;

            return (
              <div
                key={appt._id}
                onClick={() => setSelectedAppointment(appt)}
                className={`bg-white border rounded-2xl p-5 shadow-xs hover:border-red-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group ${selectedAppointment?._id === appt._id ? 'border-red-500 ring-2 ring-red-100' : 'border-slate-200'
                  }`}
              >
                <div>
                  {/* Top: Booking Reference & Status Badge */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="text-[11px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200/80 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <span>{appt.bookingReference}</span>
                    </span>

                    {/* Status Badge */}
                    <div>
                      {appt.status === 'Scheduled' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
                          <span>Scheduled</span>
                        </span>
                      )}
                      {appt.status === 'Confirmed' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>
                          <span>Confirmed</span>
                        </span>
                      )}
                      {appt.status === 'Completed' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                          <span>Completed</span>
                        </span>
                      )}
                      {appt.status === 'Cancelled' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200 line-through">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                          <span>Cancelled</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Donor & Blood Group Card Header */}
                  <div className="flex items-center gap-3 mb-3 pb-3 border-b border-slate-100">
                    <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-200 text-red-700 flex flex-col items-center justify-center font-extrabold text-base shrink-0 shadow-2xs group-hover:bg-red-100 transition-colors">
                      <Droplets size={12} className="text-red-500 fill-red-500/20" />
                      <span>{appt.bloodGroup}</span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-slate-900 text-sm truncate group-hover:text-red-700 transition-colors">
                        {appt.donorName}
                      </h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1 truncate mt-0.5">
                        <Phone size={11} className="text-slate-400 shrink-0" />
                        <span>{appt.donorPhone}</span>
                      </p>
                      {appt.donorEmail && (
                        <p className="text-[11px] text-slate-400 truncate">
                          {appt.donorEmail}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Date & Time Slot Information */}
                  <div className="space-y-1.5 text-xs text-slate-600 mb-3 bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                    <div className="flex items-center justify-between font-semibold text-slate-800">
                      <span className="flex items-center gap-1 text-red-600">
                        <Calendar size={12} />
                        <span>{formattedDate}</span>
                      </span>
                      {isToday && (
                        <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 font-bold text-[9px] rounded-full uppercase tracking-wider">
                          Today
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-slate-600 text-[11px]">
                      <span className="flex items-center gap-1">
                        <Clock size={11} className="text-slate-400" />
                        <span>{appt.timeSlot}</span>
                      </span>
                      <span className="text-[10px] font-medium text-slate-500">
                        {appt.donationType || 'Blood Donation'}
                      </span>
                    </div>

                    {/* Assigned Staff */}
                    <div className="text-[11px] text-slate-600 truncate pt-1 border-t border-slate-200/50 flex items-center gap-1.5">
                      <UserCheck size={12} className="text-rose-600 shrink-0" />
                      <span className="font-semibold text-slate-800">{appt.staffName || 'Duty Staff'}</span>
                      {appt.staffEmail && <span className="text-slate-400 font-mono text-[10px]">({appt.staffEmail})</span>}
                    </div>

                    <div className="text-[11px] text-slate-500 truncate pt-1 border-t border-slate-200/50 flex items-center gap-1">
                      <Building size={11} className="text-slate-400 shrink-0" />
                      <span className="truncate">{appt.hospitalName}</span>
                    </div>
                  </div>
                </div>

                {/* Card Footer: View Details CTA */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-red-600 font-semibold group-hover:text-red-700">
                  <span className="flex items-center gap-1 text-[11px]">
                    <ShieldCheck size={12} className="text-emerald-600" />
                    <span>Eligible Donor</span>
                  </span>
                  <div className="flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    <span>Full Details</span>
                    <ChevronRight size={13} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW OF APPOINTMENTS */
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3.5">Reference & Date</th>
                  <th className="px-5 py-3.5">Donor Profile</th>
                  <th className="px-5 py-3.5">Blood Group</th>
                  <th className="px-5 py-3.5">Assigned Staff</th>
                  <th className="px-5 py-3.5">Center Venue</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAppointments.map((appt) => {
                  const apptDateObj = new Date(appt.appointmentDate);
                  const isToday =
                    apptDateObj.getFullYear() === new Date().getFullYear() &&
                    apptDateObj.getMonth() === new Date().getMonth() &&
                    apptDateObj.getDate() === new Date().getDate();

                  const formattedDate = !isNaN(apptDateObj.getTime())
                    ? apptDateObj.toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })
                    : appt.appointmentDate;

                  return (
                    <tr
                      key={appt._id}
                      onClick={() => setSelectedAppointment(appt)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    >
                      {/* Reference & Date */}
                      <td className="px-5 py-3.5">
                        <span className="font-mono font-bold text-slate-800 block text-[11px]">
                          {appt.bookingReference}
                        </span>
                        <div className="flex items-center gap-1.5 text-slate-500 mt-0.5">
                          <span className="font-semibold text-slate-700">{formattedDate}</span>
                          <span>•</span>
                          <span>{appt.timeSlot}</span>
                          {isToday && (
                            <span className="px-1 py-0.2 bg-amber-100 text-amber-800 font-bold text-[9px] rounded">
                              TODAY
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Donor Profile */}
                      <td className="px-5 py-3.5">
                        <span className="font-bold text-slate-900 block">{appt.donorName}</span>
                        <span className="text-slate-500 text-[11px]">{appt.donorPhone}</span>
                      </td>

                      {/* Blood Group */}
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-50 border border-red-200 text-red-700 font-extrabold text-xs shadow-2xs">
                          🩸 {appt.bloodGroup}
                        </span>
                      </td>

                      {/* Assigned Staff */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <UserCheck size={14} className="text-rose-600 shrink-0" />
                          <div>
                            <span className="font-bold text-slate-900 block text-xs">
                              {appt.staffName || 'Duty Staff'}
                            </span>
                            {appt.staffEmail && (
                              <span className="text-[10px] text-slate-500 block font-mono">
                                {appt.staffEmail}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Hospital Venue */}
                      <td className="px-5 py-3.5 text-slate-600 font-medium">
                        <span className="truncate block max-w-xs">{appt.hospitalName}</span>
                        <span className="text-[10px] text-slate-400 block truncate">
                          {appt.hospitalCity || appt.hospitalAddress || 'Main Blood Wing'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5">
                        {appt.status === 'Scheduled' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                            <span>Scheduled</span>
                          </span>
                        )}
                        {appt.status === 'Confirmed' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>
                            <span>Confirmed</span>
                          </span>
                        )}
                        {appt.status === 'Completed' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                            <span>Completed</span>
                          </span>
                        )}
                        {appt.status === 'Cancelled' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200 line-through">
                            <span>Cancelled</span>
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAppointment(appt);
                          }}
                          className="px-3 py-1.5 text-[11px] font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FULL DETAILS DRAWER / SLIDE-OVER (CRITICAL: NAVBAR IS NEVER HIDDEN)      */}
      {/* Positioned strictly at top-[60px] to preserve full visibility of Navbar */}
      {/* ========================================================================= */}
      {selectedAppointment && (
        <>
          {/* Backdrop below top-15 / navbar */}
          <div
            onClick={() => setSelectedAppointment(null)}
            className="fixed top-[58px] inset-x-0 bottom-0 bg-slate-900/40 backdrop-blur-xs z-30 transition-opacity"
            title="Click to close details"
          />

          {/* Slide-over Full Detail Panel */}
          <div
            className="fixed top-[58px] right-0 bottom-0 w-full sm:w-[500px] md:w-[560px] bg-white shadow-2xl border-l border-slate-200 z-40 flex flex-col overflow-hidden animate-in slide-in-from-right duration-200"
          >
            {/* Drawer Header */}
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shadow-2xs">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm md:text-base font-bold text-slate-900">
                    Appointment Full Details
                  </h2>
                  <p className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5">
                    <span>{selectedAppointment.bookingReference}</span>
                    <button
                      onClick={(e) => handleCopyCode(selectedAppointment.bookingReference, e)}
                      className="text-slate-400 hover:text-slate-700 cursor-pointer"
                      title="Copy reference code"
                    >
                      {copiedCode === selectedAppointment.bookingReference ? (
                        <Check size={12} className="text-emerald-600" />
                      ) : (
                        <Copy size={12} />
                      )}
                    </button>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
                  title="Print Slip"
                >
                  <Printer size={16} />
                </button>
                <button
                  onClick={() => setSelectedAppointment(null)}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
                  title="Close details (ESC)"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Drawer Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Status Header Badge Banner */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">
                    Booking Status
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {selectedAppointment.status === 'Scheduled' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                        <Clock size={12} />
                        <span>Scheduled (Awaiting Approval)</span>
                      </span>
                    )}
                    {selectedAppointment.status === 'Confirmed' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
                        <CheckSquare size={12} />
                        <span>Confirmed (Slot Reserved)</span>
                      </span>
                    )}
                    {selectedAppointment.status === 'Completed' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 size={12} />
                        <span>Donation Completed</span>
                      </span>
                    )}
                    {selectedAppointment.status === 'Cancelled' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-200 text-slate-700 border border-slate-300">
                        <XCircle size={12} />
                        <span>Cancelled</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Blood Group Display */}
                <div className="text-right">
                  <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">
                    Blood Group
                  </span>
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-50 border border-red-200 text-red-700 font-extrabold text-sm rounded-xl mt-0.5 shadow-2xs">
                    🩸 {selectedAppointment.bloodGroup}
                  </span>
                </div>
              </div>

              {/* 1. Donor Information Card */}
              <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <User size={13} className="text-red-600" />
                    <span>Donor Profile</span>
                  </span>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md font-semibold flex items-center gap-1">
                    <ShieldCheck size={11} />
                    <span>Eligible Donor</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[11px] text-slate-400 block">Full Name</span>
                    <span className="font-bold text-slate-900 text-sm block">
                      {selectedAppointment.donorName}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-400 block">Phone Number</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <a
                        href={`tel:${selectedAppointment.donorPhone}`}
                        className="font-bold text-slate-900 hover:text-red-600 transition-colors"
                      >
                        {selectedAppointment.donorPhone}
                      </a>
                      <button
                        onClick={(e) => handleCopyCode(selectedAppointment.donorPhone, e)}
                        className="text-slate-400 hover:text-slate-600 cursor-pointer"
                        title="Copy phone"
                      >
                        <Copy size={12} />
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-400 block">Email Address</span>
                    <div className="flex items-center gap-1.5 mt-0.5 truncate">
                      <a
                        href={`mailto:${selectedAppointment.donorEmail}`}
                        className="text-slate-800 hover:text-red-600 transition-colors font-medium truncate"
                      >
                        {selectedAppointment.donorEmail}
                      </a>
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-400 block">Donation Type</span>
                    <span className="font-bold text-slate-800">
                      {selectedAppointment.donationType || 'Whole Blood'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Assigned Medical Staff Card */}
              <div className="p-4 bg-rose-50/60 border border-rose-200 rounded-2xl shadow-xs space-y-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-rose-100">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <UserCheck size={14} className="text-rose-600" />
                    <span>Assigned Medical Staff</span>
                  </span>
                  <span className="text-[10px] font-bold text-rose-700 bg-rose-100/70 border border-rose-200 px-2.5 py-0.5 rounded-full">
                    Consulting Officer
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="text-sm font-bold text-slate-900 block">
                      {selectedAppointment.staffName || 'Duty Medical Staff'}
                    </span>
                    <span className="text-slate-500 text-[11px] block font-mono mt-0.5">
                      {selectedAppointment.staffEmail || 'staff@hospital.org'}
                    </span>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-white border border-rose-200 flex items-center justify-center text-rose-600 shadow-2xs">
                    <UserCheck size={16} />
                  </div>
                </div>
              </div>

              {/* 2. Schedule & Hospital Venue Card */}
              <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar size={13} className="text-red-600" />
                    <span>Schedule & Venue</span>
                  </span>
                  <span className="text-xs font-bold text-red-600">
                    {new Date(selectedAppointment.appointmentDate).toLocaleDateString('en-US', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-slate-500 font-medium">Time Slot Window:</span>
                    <span className="font-bold text-slate-900 flex items-center gap-1">
                      <Clock size={12} className="text-slate-400" />
                      {selectedAppointment.timeSlot}
                    </span>
                  </div>

                  <div className="pt-1">
                    <span className="text-[11px] text-slate-400 block">Center / Hospital</span>
                    <p className="font-bold text-slate-900">{selectedAppointment.hospitalName}</p>
                    {selectedAppointment.hospitalAddress && (
                      <p className="text-slate-500 text-[11px] flex items-start gap-1 mt-0.5">
                        <MapPin size={12} className="text-slate-400 shrink-0 mt-0.5" />
                        <span>
                          {selectedAppointment.hospitalAddress}
                          {selectedAppointment.hospitalCity ? `, ${selectedAppointment.hospitalCity}` : ''}
                        </span>
                      </p>
                    )}
                    {selectedAppointment.hospitalPhone && (
                      <p className="text-slate-500 text-[11px] flex items-center gap-1 mt-0.5">
                        <Phone size={12} className="text-slate-400 shrink-0" />
                        <span>Contact: {selectedAppointment.hospitalPhone}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* 3. Donor Notes / Medical Remarks */}
              {selectedAppointment.notes && (
                <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl text-xs space-y-1">
                  <span className="font-bold text-amber-900 flex items-center gap-1.5">
                    <AlertCircle size={13} className="text-amber-600" />
                    <span>Donor Instructions / Notes</span>
                  </span>
                  <p className="text-amber-800">{selectedAppointment.notes}</p>
                </div>
              )}

              {/* Cancellation Reason if cancelled */}
              {selectedAppointment.status === 'Cancelled' && (
                <div className="p-4 bg-slate-100 border border-slate-200 rounded-2xl text-xs space-y-1">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    <AlertTriangle size={13} className="text-slate-500" />
                    <span>Cancellation Reason</span>
                  </span>
                  <p className="text-slate-600">
                    {selectedAppointment.cancelledReason || 'No explicit reason provided.'}
                  </p>
                </div>
              )}

              {/* 4. Staff Status Controls (Interactive Status Transitions) */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Hospital Staff Actions
                </span>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  {/* Confirm Button */}
                  <button
                    onClick={() => handleUpdateStatus(selectedAppointment._id, 'Confirmed')}
                    disabled={updatingStatusId === selectedAppointment._id || selectedAppointment.status === 'Confirmed'}
                    className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs ${selectedAppointment.status === 'Confirmed'
                      ? 'bg-purple-100 text-purple-800 border border-purple-200 opacity-60 cursor-not-allowed'
                      : 'bg-purple-600 hover:bg-purple-700 text-white'
                      }`}
                  >
                    <CheckSquare size={13} />
                    <span>Confirm Slot</span>
                  </button>

                  {/* Mark Completed Button */}
                  <button
                    onClick={() => handleUpdateStatus(selectedAppointment._id, 'Completed')}
                    disabled={updatingStatusId === selectedAppointment._id || selectedAppointment.status === 'Completed'}
                    className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs ${selectedAppointment.status === 'Completed'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 opacity-60 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                  >
                    <CheckCircle2 size={13} />
                    <span>Mark Completed</span>
                  </button>

                  {/* Revert to Scheduled */}
                  <button
                    onClick={() => handleUpdateStatus(selectedAppointment._id, 'Scheduled')}
                    disabled={updatingStatusId === selectedAppointment._id || selectedAppointment.status === 'Scheduled'}
                    className="py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-semibold transition-all cursor-pointer shadow-2xs"
                  >
                    Set as Scheduled
                  </button>

                  {/* Cancel Appointment Button */}
                  <button
                    onClick={() => handlePromptCancel(selectedAppointment)}
                    disabled={updatingStatusId === selectedAppointment._id || selectedAppointment.status === 'Cancelled'}
                    className="py-2 px-3 bg-white hover:bg-rose-50 text-rose-700 border border-slate-200 hover:border-rose-300 rounded-xl font-semibold transition-all cursor-pointer shadow-2xs"
                  >
                    Cancel Booking
                  </button>
                </div>
              </div>

              {/* Timestamp Information */}
              <div className="text-[11px] text-slate-400 space-y-0.5 pt-2 border-t border-slate-100">
                <p>Created: {new Date(selectedAppointment.createdAt).toLocaleString()}</p>
                {selectedAppointment.updatedAt && (
                  <p>Last Updated: {new Date(selectedAppointment.updatedAt).toLocaleString()}</p>
                )}
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <button
                onClick={() => setSelectedAppointment(null)}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs"
              >
                Close Details
              </button>

              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <Printer size={13} />
                <span>Print Intake Slip</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
