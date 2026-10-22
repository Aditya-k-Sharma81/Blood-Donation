import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  ShieldCheck,
  ShieldAlert,
  Search,
  Building2,
  Mail,
  ArrowLeft,
  Plus,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Trash2,
  SlidersHorizontal,
  Calendar
} from 'lucide-react';
import Swal from 'sweetalert2';

export default function StaffManagementPage({ user }) {
  const navigate = useNavigate();
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL'); // ALL, ACTIVE, REVOKED
  const [togglingId, setTogglingId] = useState(null);

  // Fetch staff list from backend
  const fetchStaff = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/staff');
      const data = await res.json();
      if (res.ok && data.success) {
        setStaffList(data.staff || []);
      } else {
        throw new Error(data.message || 'Failed to load staff list');
      }
    } catch (err) {
      console.error('Fetch staff error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  // Toggle permission handler
  const handleTogglePermission = async (staffMember) => {
    const actionWord = staffMember.isPermitted ? 'Revoke' : 'Grant';
    const newStatus = !staffMember.isPermitted;

    setTogglingId(staffMember.id || staffMember._id);

    try {
      const res = await fetch(`/api/admin/staff/${staffMember.id || staffMember._id}/toggle-permission`, {
        method: 'PATCH',
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to update permission');
      }

      // Update state locally
      setStaffList((prev) =>
        prev.map((s) =>
          (s.id === staffMember.id || s._id === staffMember._id)
            ? { ...s, isPermitted: newStatus }
            : s
        )
      );

      Swal.fire({
        icon: newStatus ? 'success' : 'info',
        title: newStatus ? 'Access Granted' : 'Access Revoked',
        text: `Login permission has been ${newStatus ? 'activated' : 'suspended'} for ${staffMember.email}.`,
        timer: 1600,
        showConfirmButton: false,
        background: '#ffffff',
        color: '#0f172a',
        iconColor: newStatus ? '#10b981' : '#e11d48',
      });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Action Failed',
        text: err.message,
        confirmButtonColor: '#4f46e5',
      });
    } finally {
      setTogglingId(null);
    }
  };

  // Delete staff account
  const handleDeleteStaff = (staffMember) => {
    Swal.fire({
      title: 'Remove Staff Account?',
      html: `Are you sure you want to delete <strong>${staffMember.name}</strong> (${staffMember.email})? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e11d48',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, Remove',
      cancelButtonText: 'Cancel',
      background: '#ffffff',
      color: '#0f172a',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await fetch(`/api/admin/staff/${staffMember.id || staffMember._id}`, {
            method: 'DELETE',
          });
          const data = await res.json();
          if (res.ok && data.success) {
            setStaffList((prev) =>
              prev.filter((s) => (s.id || s._id) !== (staffMember.id || staffMember._id))
            );
            Swal.fire({
              icon: 'success',
              title: 'Account Removed',
              text: 'Staff user has been deleted successfully.',
              timer: 1500,
              showConfirmButton: false,
            });
          } else {
            throw new Error(data.message || 'Failed to delete');
          }
        } catch (e) {
          Swal.fire({
            icon: 'error',
            title: 'Delete Failed',
            text: e.message,
            confirmButtonColor: '#4f46e5',
          });
        }
      }
    });
  };

  // Filtered staff list
  const filteredStaff = staffList.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      s.name?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.hospitalName?.toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (filterStatus === 'ACTIVE') return s.isPermitted === true;
    if (filterStatus === 'REVOKED') return s.isPermitted === false;
    return true;
  });

  const activeCount = staffList.filter((s) => s.isPermitted).length;
  const revokedCount = staffList.filter((s) => !s.isPermitted).length;

  return (
    <div className="w-full max-w-4xl mx-auto my-6 px-4">
      <div className="bg-white border border-slate-200/80 rounded-3xl shadow-xl shadow-slate-200/40 overflow-hidden transition-all">
        {/* Refined Modern Card Header */}
        <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200/70 flex items-center justify-between">
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-indigo-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all cursor-pointer shadow-xs"
          >
            <ArrowLeft size={14} />
            <span>Dashboard</span>
          </button>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Users size={13} className="text-indigo-600" />
            <span>Staff Management</span>
          </span>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Header Title & Register Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-50 to-sky-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shadow-xs shrink-0">
                <Users size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Hospital Staff Directory
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Manage hospital staff login accounts and toggle their access permissions in real-time.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={fetchStaff}
                disabled={loading}
                className="p-2.5 text-slate-500 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 rounded-xl transition-all cursor-pointer"
                title="Refresh list"
              >
                <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
              </button>

              <button
                onClick={() => navigate('/admin/hospital-signup')}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
              >
                <Plus size={14} />
                <span>Add New Staff</span>
              </button>
            </div>
          </div>

          {/* Metric Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total Users</p>
                <p className="text-2xl font-bold text-slate-900 mt-0.5">{staffList.length}</p>
              </div>
              <div className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 shadow-xs">
                <Users size={18} />
              </div>
            </div>

            <div className="p-4 bg-emerald-50/60 border border-emerald-200/70 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600">Active Permissions</p>
                <p className="text-2xl font-bold text-emerald-900 mt-0.5">{activeCount}</p>
              </div>
              <div className="p-2.5 bg-emerald-100/80 text-emerald-700 rounded-xl shadow-xs">
                <CheckCircle2 size={18} />
              </div>
            </div>

            <div className="p-4 bg-rose-50/60 border border-rose-200/70 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-rose-600">Revoked / Suspended</p>
                <p className="text-2xl font-bold text-rose-900 mt-0.5">{revokedCount}</p>
              </div>
              <div className="p-2.5 bg-rose-100/80 text-rose-700 rounded-xl shadow-xs">
                <XCircle size={18} />
              </div>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
            {/* Search Input */}
            <div className="relative w-full sm:w-72 flex items-center">
              <Search className="absolute left-3.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search staff, email, hospital..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/15 rounded-xl text-slate-900 text-xs pl-10 pr-3.5 py-2.5 outline-none transition-all placeholder:text-slate-400 font-medium"
              />
            </div>

            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-100/80 rounded-xl border border-slate-200/60 text-xs font-semibold self-stretch sm:self-auto">
              <button
                type="button"
                onClick={() => setFilterStatus('ALL')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  filterStatus === 'ALL'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                All ({staffList.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('ACTIVE')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  filterStatus === 'ACTIVE'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Permitted ({activeCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('REVOKED')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  filterStatus === 'REVOKED'
                    ? 'bg-white text-rose-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Revoked ({revokedCount})
              </button>
            </div>
          </div>

          {/* Staff List */}
          {loading ? (
            <div className="p-16 flex flex-col items-center justify-center text-slate-400">
              <RefreshCw className="w-7 h-7 animate-spin text-indigo-600 mb-2.5" />
              <p className="text-xs font-medium">Loading staff accounts...</p>
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="p-12 text-center bg-slate-50/70 border border-slate-200/70 rounded-2xl">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">No staff members found</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {searchQuery
                  ? 'Try searching with different keywords.'
                  : 'Start by creating your first hospital staff account.'}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => navigate('/admin/hospital-signup')}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all cursor-pointer shadow-sm"
                >
                  <Plus size={13} />
                  <span>Register Staff Member</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredStaff.map((staff) => {
                const staffId = staff.id || staff._id;
                const isToggling = togglingId === staffId;

                return (
                  <div
                    key={staffId}
                    className="p-4 bg-white border border-slate-200/80 hover:border-indigo-200 rounded-2xl shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    {/* Left: User Profile Info */}
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                        {(staff.name || staff.email || 'S')[0].toUpperCase()}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-900 truncate">
                            {staff.name || 'Hospital Staff'}
                          </h3>
                          {staff.isPermitted ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200/70">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                              Revoked
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1">
                          <span className="flex items-center gap-1 text-slate-600 font-medium">
                            <Mail size={12} className="text-slate-400" />
                            <span>{staff.email}</span>
                          </span>

                          {staff.hospitalName && (
                            <span className="flex items-center gap-1 text-indigo-700 font-medium bg-indigo-50/70 px-2 py-0.5 rounded-md">
                              <Building2 size={11} className="text-indigo-500" />
                              <span className="truncate max-w-[200px]">{staff.hospitalName}</span>
                            </span>
                          )}

                          {staff.createdAt && (
                            <span className="text-[11px] text-slate-400 flex items-center gap-1">
                              <Calendar size={11} />
                              <span>{new Date(staff.createdAt).toLocaleDateString()}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Permission Toggle Switch & Delete */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      {/* Permission Toggle Control */}
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-semibold text-slate-600 hidden md:inline">
                          {staff.isPermitted ? 'Permitted' : 'Blocked'}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleTogglePermission(staff)}
                          disabled={isToggling}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none cursor-pointer disabled:opacity-50 ${
                            staff.isPermitted ? 'bg-emerald-600' : 'bg-slate-300'
                          }`}
                          title={`Click to ${staff.isPermitted ? 'Revoke' : 'Grant'} access`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                              staff.isPermitted ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => handleDeleteStaff(staff)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete staff account"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
