import React, { useState, useEffect, useMemo } from 'react';
import {
  Droplets,
  Plus,
  Minus,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Search,
  LayoutGrid,
  List,
  Edit3,
  Building2,
  Clock,
  ShieldCheck,
  ArrowUpRight,
  HelpCircle,
  X,
  Save,
  RotateCcw
} from 'lucide-react';
import Swal from 'sweetalert2';

// Standard blood group compatibility reference notes
const BLOOD_META = {
  'A+': { desc: 'Can receive A+, A-, O+, O-', tag: 'High demand' },
  'A-': { desc: 'Can receive A-, O-', tag: 'Rh- negative' },
  'B+': { desc: 'Can receive B+, B-, O+, O-', tag: 'Standard stock' },
  'B-': { desc: 'Can receive B-, O-', tag: 'Rare stock' },
  'O+': { desc: 'Can receive O+, O-', tag: 'Most common' },
  'O-': { desc: 'Can receive O- only (Universal Donor)', tag: 'Universal Donor' },
  'AB+': { desc: 'Universal Recipient (Can receive all)', tag: 'Universal Recipient' },
  'AB-': { desc: 'Can receive AB-, A-, B-, O-', tag: 'Universal Plasma' },
};

export default function HospitalPage({ user, onLogout }) {
  const [stocks, setStocks] = useState([]);
  const [metrics, setMetrics] = useState({
    totalUnits: 0,
    criticalCount: 0,
    lowCount: 0,
    sufficientCount: 0,
  });
  const [hospitalName, setHospitalName] = useState(
    user?.hospitalName || user?.name || 'City Central Hospital'
  );
  const [loading, setLoading] = useState(true);
  const [updatingGroup, setUpdatingGroup] = useState(null);
  const [filterStatus, setFilterStatus] = useState('ALL'); // ALL, CRITICAL, LOW, SUFFICIENT
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  // Modal State for Manual Quantity Adjustment
  const [editingItem, setEditingItem] = useState(null);
  const [editUnits, setEditUnits] = useState('');
  const [editReason, setEditReason] = useState('Donation Intake');
  const [savingEdit, setSavingEdit] = useState(false);

  // Fetch stocks from backend API
  const fetchStockData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);

      const headers = {
        'x-user-id': user?.id || user?._id || '',
        'x-hospital-id': user?.id || user?._id || '',
      };
      if (user?.token) {
        headers['Authorization'] = `Bearer ${user.token}`;
      }

      const res = await fetch(`/api/hospital/stock?hospitalName=${encodeURIComponent(hospitalName)}`, {
        headers,
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setStocks(data.stocks || []);
        if (data.metrics) setMetrics(data.metrics);
        if (data.hospitalName) setHospitalName(data.hospitalName);
        setLastRefreshed(new Date());
      } else {
        throw new Error(data.message || 'Failed to fetch blood stock');
      }
    } catch (err) {
      console.error('Fetch Blood Stock Error:', err);
      if (!silent) {
        Swal.fire({
          icon: 'error',
          title: 'Stock Retrieval Failed',
          text: err.message || 'Could not connect to inventory database.',
          confirmButtonColor: '#e11d48',
        });
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchStockData();
  }, [user]);

  // Handle Quick +/- adjustment (1 unit delta)
  const handleDeltaChange = async (bloodGroup, delta) => {
    try {
      setUpdatingGroup(bloodGroup);

      const headers = {
        'Content-Type': 'application/json',
        'x-user-id': user?.id || user?._id || '',
      };
      if (user?.token) {
        headers['Authorization'] = `Bearer ${user.token}`;
      }

      const res = await fetch('/api/hospital/stock/update', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          hospitalName,
          bloodGroup,
          delta,
          updatedBy: user?.name || user?.email || 'Hospital Staff',
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStocks(data.stocks || []);
        if (data.metrics) setMetrics(data.metrics);
      } else {
        throw new Error(data.message || 'Could not update stock units');
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: err.message,
        confirmButtonColor: '#e11d48',
      });
    } finally {
      setUpdatingGroup(null);
    }
  };

  // Open Edit Modal for exact unit count
  const handleOpenEdit = (stockItem) => {
    setEditingItem(stockItem);
    setEditUnits(stockItem.units.toString());
    setEditReason('Routine Inventory Audit');
  };

  // Save manual unit adjustment from modal
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingItem) return;

    const parsed = parseInt(editUnits, 10);
    if (isNaN(parsed) || parsed < 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Invalid Units',
        text: 'Please enter a valid non-negative number of units.',
        confirmButtonColor: '#e11d48',
      });
      return;
    }

    try {
      setSavingEdit(true);

      const headers = {
        'Content-Type': 'application/json',
        'x-user-id': user?.id || user?._id || '',
      };
      if (user?.token) {
        headers['Authorization'] = `Bearer ${user.token}`;
      }

      const res = await fetch('/api/hospital/stock/update', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          hospitalName,
          bloodGroup: editingItem.bloodGroup,
          units: parsed,
          updatedBy: `${user?.name || 'Staff'} (${editReason})`,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStocks(data.stocks || []);
        if (data.metrics) setMetrics(data.metrics);
        setEditingItem(null);

        Swal.fire({
          icon: 'success',
          title: `${editingItem.bloodGroup} Stock Updated`,
          text: `Current inventory set to ${parsed} units successfully.`,
          timer: 1500,
          showConfirmButton: false,
          iconColor: '#10b981',
        });
      } else {
        throw new Error(data.message || 'Failed to update stock');
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Update Error',
        text: err.message,
        confirmButtonColor: '#e11d48',
      });
    } finally {
      setSavingEdit(false);
    }
  };

  // Reset all blood stock to 0 in database
  const handleResetStock = async () => {
    Swal.fire({
      title: 'Reset Inventory to 0?',
      text: 'This will reset all 8 blood groups to 0 units in the database.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Reset to 0',
      confirmButtonColor: '#e11d48',
      cancelButtonText: 'Cancel',
      background: '#ffffff',
      color: '#0f172a',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          setLoading(true);
          const res = await fetch('/api/hospital/stock/reset', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ hospitalName }),
          });
          const data = await res.json();
          if (res.ok && data.success) {
            setStocks(data.stocks || []);
            if (data.metrics) setMetrics(data.metrics);
            Swal.fire({
              icon: 'success',
              title: 'Stock Reset to Zero',
              text: 'All blood groups have been updated to 0 units in the database.',
              timer: 1500,
              showConfirmButton: false,
              iconColor: '#10b981',
            });
          }
        } catch (e) {
          Swal.fire({
            icon: 'error',
            title: 'Reset Failed',
            text: e.message,
          });
        } finally {
          setLoading(false);
        }
      }
    });
  };

  // Filter and search computation
  const filteredStocks = useMemo(() => {
    return stocks.filter((item) => {
      // Filter by status tab
      if (filterStatus === 'CRITICAL' && item.status !== 'CRITICAL') return false;
      if (filterStatus === 'LOW' && item.status !== 'LOW') return false;
      if (filterStatus === 'SUFFICIENT' && item.status !== 'SUFFICIENT') return false;

      // Filter by search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesGroup = item.bloodGroup.toLowerCase().includes(q);
        const matchesDesc = (BLOOD_META[item.bloodGroup]?.desc || '').toLowerCase().includes(q);
        if (!matchesGroup && !matchesDesc) return false;
      }

      return true;
    });
  }, [stocks, filterStatus, searchQuery]);

  // Critical groups summary list
  const criticalGroups = stocks.filter((s) => s.status === 'CRITICAL').map((s) => s.bloodGroup);

  return (
    <div className="w-full max-w-6xl my-4 space-y-6 self-start">
      {/* Hospital Staff Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-100 text-red-600 flex items-center justify-center shrink-0 shadow-xs">
            <Droplets className="w-6 h-6 fill-red-600/20" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                {hospitalName}
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Live Inventory Sync</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
              <span>Medical Staff: <strong>{user?.name || user?.email || 'Authorized Staff'}</strong></span>
              <span>•</span>
              <span>Refreshed: {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <button
            onClick={() => fetchStockData()}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all cursor-pointer shadow-xs disabled:opacity-50"
            title="Refresh current inventory numbers"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-red-600' : 'text-slate-500'} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={handleResetStock}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-red-700 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 rounded-xl transition-all cursor-pointer shadow-xs"
            title="Reset all blood groups to 0 in database"
          >
            <RotateCcw size={14} className="text-slate-500" />
            <span className="hidden sm:inline">Reset to 0</span>
          </button>
        </div>
      </div>

      {/* Critical Shortage Warning Banner (If Any) */}
      {criticalGroups.length > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-red-900">
                Critical Shortage Alert: {criticalGroups.length} Blood {criticalGroups.length === 1 ? 'Group' : 'Groups'} Below 5 Units!
              </p>
              <p className="text-xs text-red-700 mt-0.5">
                Immediate donor replenishment required for: <strong className="font-semibold underline">{criticalGroups.join(', ')}</strong>. Please review emergency inventory reserves.
              </p>
            </div>
          </div>
          <button
            onClick={() => setFilterStatus('CRITICAL')}
            className="shrink-0 text-xs font-semibold text-red-700 hover:text-red-800 bg-white border border-red-200 px-3 py-1.5 rounded-lg shadow-xs hover:bg-red-50 cursor-pointer"
          >
            View Critical ({criticalGroups.length})
          </button>
        </div>
      )}

      {/* Metric Summary Cards (Standard Clinical Colors: Neutral, Green, Amber, Red) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Stock */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Inventory</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
              <Droplets size={16} />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {metrics.totalUnits} <span className="text-xs font-medium text-slate-500">Units</span>
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Across all 8 blood groups
          </p>
        </div>

        {/* Sufficient Stock */}
        <div className="bg-white border border-emerald-200/80 p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Sufficient Stock</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {metrics.sufficientCount} <span className="text-xs font-medium text-slate-500">Groups</span>
          </p>
          <p className="text-[11px] text-emerald-700 mt-1 font-medium">
            Optimal level (&gt; 15 units)
          </p>
        </div>

        {/* Low Stock */}
        <div className="bg-white border border-amber-200/80 p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider">Low Reserves</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <AlertCircle size={16} />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {metrics.lowCount} <span className="text-xs font-medium text-slate-500">Groups</span>
          </p>
          <p className="text-[11px] text-amber-700 mt-1 font-medium">
            Moderate level (5 - 15 units)
          </p>
        </div>

        {/* Critical Shortage */}
        <div className="bg-white border border-red-200/80 p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-red-700 uppercase tracking-wider">Critical Shortage</span>
            <div className="w-8 h-8 rounded-lg bg-red-50 text-red-700 flex items-center justify-center">
              <AlertTriangle size={16} />
            </div>
          </div>
          <p className="text-2xl font-bold text-red-700 mt-2">
            {metrics.criticalCount} <span className="text-xs font-medium text-slate-500">Groups</span>
          </p>
          <p className="text-[11px] text-red-600 mt-1 font-medium">
            Urgent (&lt; 5 units)
          </p>
        </div>
      </div>

      {/* Control Bar: Search, Filters, and View Switch */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3.5">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              filterStatus === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            All Groups (8)
          </button>

          <button
            onClick={() => setFilterStatus('CRITICAL')}
            className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              filterStatus === 'CRITICAL'
                ? 'bg-red-700 text-white shadow-xs'
                : 'text-red-700 hover:bg-red-50'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
            <span>Critical ({metrics.criticalCount})</span>
          </button>

          <button
            onClick={() => setFilterStatus('LOW')}
            className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              filterStatus === 'LOW'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-amber-800 hover:bg-amber-50'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            <span>Low ({metrics.lowCount})</span>
          </button>

          <button
            onClick={() => setFilterStatus('SUFFICIENT')}
            className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              filterStatus === 'SUFFICIENT'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Sufficient ({metrics.sufficientCount})</span>
          </button>
        </div>

        {/* Search & View Mode Switch */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center flex-1 sm:w-56">
            <Search className="absolute left-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Filter blood group (e.g. O+)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-slate-400 focus:bg-white text-xs pl-9 pr-3 py-2 rounded-xl outline-none transition-all placeholder:text-slate-400 font-medium text-slate-800"
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

          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/80 shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Grid Cards View"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Detailed Table View"
            >
              <List size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Stock Display: Grid View vs Table View */}
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-16 flex flex-col items-center justify-center text-slate-500 shadow-xs">
          <RefreshCw className="w-8 h-8 animate-spin text-red-600 mb-3" />
          <p className="text-sm font-medium text-slate-700">Loading Blood Bank Stock...</p>
          <p className="text-xs text-slate-400 mt-1">Retrieving inventory metrics for all 8 blood groups</p>
        </div>
      ) : filteredStocks.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs">
          <Droplets className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-800">No Blood Groups Match Filter</p>
          <p className="text-xs text-slate-500 mt-1">Try resetting the status filter or search query.</p>
          <button
            onClick={() => {
              setFilterStatus('ALL');
              setSearchQuery('');
            }}
            className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 rounded-xl transition-all cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW: 8 Blood Group Cards */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredStocks.map((item) => {
            const meta = BLOOD_META[item.bloodGroup] || {};
            const isUpdating = updatingGroup === item.bloodGroup;

            return (
              <div
                key={item.bloodGroup}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                {/* Top: Blood Group Badge & Status Badge */}
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    {/* Blood Group Indicator */}
                    <div className="flex items-center gap-2.5">
                      <div className="w-11 h-11 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-700 font-extrabold text-lg shadow-xs tracking-tight">
                        {item.bloodGroup}
                      </div>
                      <div>
                        <span className="text-[11px] font-semibold text-slate-700 block">
                          Blood Group
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {meta.tag || 'Standard'}
                        </span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div>
                      {item.status === 'CRITICAL' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                          <span>Critical</span>
                        </span>
                      )}
                      {item.status === 'LOW' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                          <span>Low Stock</span>
                        </span>
                      )}
                      {item.status === 'SUFFICIENT' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          <span>Sufficient</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Big Unit Number */}
                  <div className="my-3">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                        {item.units}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        Units (Bags)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1" title={meta.desc}>
                      {meta.desc}
                    </p>
                  </div>

                  {/* Clean Simple Progress Bar */}
                  <div className="mt-2.5 mb-4">
                    <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 mb-1">
                      <span>Capacity</span>
                      <span>{item.units} / {item.capacity} ({item.percentage}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/60">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          item.status === 'CRITICAL'
                            ? 'bg-red-500'
                            : item.status === 'LOW'
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, item.percentage)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Controls: Quick Adjust +/- & Edit Button */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {/* Minus 1 Bag */}
                    <button
                      onClick={() => handleDeltaChange(item.bloodGroup, -1)}
                      disabled={isUpdating || item.units <= 0}
                      className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-sm transition-colors cursor-pointer disabled:opacity-40"
                      title="Dispatch / Deduct 1 Unit"
                    >
                      <Minus size={13} />
                    </button>

                    {/* Plus 1 Bag */}
                    <button
                      onClick={() => handleDeltaChange(item.bloodGroup, 1)}
                      disabled={isUpdating}
                      className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-sm transition-colors cursor-pointer disabled:opacity-40"
                      title="Add 1 Unit (Intake)"
                    >
                      <Plus size={13} />
                    </button>
                  </div>

                  {/* Set Exact Quantity Button */}
                  <button
                    onClick={() => handleOpenEdit(item)}
                    disabled={isUpdating}
                    className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-all cursor-pointer shadow-xs"
                    title="Edit quantity directly"
                  >
                    <Edit3 size={12} className="text-slate-500" />
                    <span>Edit Units</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW: Clean Clinical Inventory Table */
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3.5">Blood Group</th>
                  <th className="px-5 py-3.5">Compatibility & Type</th>
                  <th className="px-5 py-3.5">Units Available</th>
                  <th className="px-5 py-3.5">Storage Capacity</th>
                  <th className="px-5 py-3.5">Stock Status</th>
                  <th className="px-5 py-3.5 text-right">Staff Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStocks.map((item) => {
                  const meta = BLOOD_META[item.bloodGroup] || {};
                  const isUpdating = updatingGroup === item.bloodGroup;

                  return (
                    <tr key={item.bloodGroup} className="hover:bg-slate-50/70 transition-colors">
                      {/* Blood Group */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <span className="w-9 h-9 rounded-lg bg-red-50 border border-red-200 text-red-700 font-black text-sm flex items-center justify-center shadow-xs">
                            {item.bloodGroup}
                          </span>
                          <div>
                            <span className="font-bold text-slate-900 block text-sm">
                              {item.bloodGroup}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {meta.tag || 'Standard'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Compatibility */}
                      <td className="px-5 py-4 text-slate-600 font-medium">
                        {meta.desc}
                      </td>

                      {/* Units Available */}
                      <td className="px-5 py-4">
                        <span className="text-base font-bold text-slate-900">
                          {item.units}
                        </span>
                        <span className="text-[11px] text-slate-500 ml-1">Units (Bags)</span>
                      </td>

                      {/* Storage Gauge */}
                      <td className="px-5 py-4">
                        <div className="w-36">
                          <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                            <span>{item.units} / {item.capacity}</span>
                            <span>{item.percentage}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                item.status === 'CRITICAL'
                                  ? 'bg-red-500'
                                  : item.status === 'LOW'
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.min(100, item.percentage)}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>

                      {/* Stock Status Badge */}
                      <td className="px-5 py-4">
                        {item.status === 'CRITICAL' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                            <span>Critical (&lt;5)</span>
                          </span>
                        )}
                        {item.status === 'LOW' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            <span>Low Stock (5-15)</span>
                          </span>
                        )}
                        {item.status === 'SUFFICIENT' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <span>Sufficient (&gt;15)</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleDeltaChange(item.bloodGroup, -1)}
                            disabled={isUpdating || item.units <= 0}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer disabled:opacity-40"
                            title="Dispatch 1 Unit"
                          >
                            <Minus size={13} />
                          </button>
                          <button
                            onClick={() => handleDeltaChange(item.bloodGroup, 1)}
                            disabled={isUpdating}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer disabled:opacity-40"
                            title="Intake 1 Unit"
                          >
                            <Plus size={13} />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(item)}
                            disabled={isUpdating}
                            className="ml-1 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Manual Quantity Adjustment Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl max-w-sm w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-red-50 border border-red-200 text-red-700 font-black text-sm flex items-center justify-center">
                  {editingItem.bloodGroup}
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Adjust {editingItem.bloodGroup} Stock
                  </h3>
                  <p className="text-[11px] text-slate-500">Direct inventory correction</p>
                </div>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Available Units / Bags
                </label>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    min="0"
                    max="500"
                    value={editUnits}
                    onChange={(e) => setEditUnits(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 focus:border-slate-500 focus:bg-white rounded-xl text-slate-900 text-sm px-3.5 py-2.5 outline-none font-bold text-center"
                    required
                    autoFocus
                  />
                  <span className="absolute right-3.5 text-xs text-slate-400 font-medium">Bags</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 text-center">
                  Current: {editingItem.units} Bags • Storage Capacity: {editingItem.capacity} Bags
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Reason for Adjustment
                </label>
                <select
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-xs px-3 py-2 outline-none font-medium"
                >
                  <option value="Donation Intake">Blood Donation Batch Collected</option>
                  <option value="Emergency Patient Transfusion">Emergency ICU Transfusion Dispatch</option>
                  <option value="Routine Hospital Usage">Routine Surgical Ward Usage</option>
                  <option value="Physical Inventory Audit">Physical Inventory Audit Reconciliation</option>
                  <option value="Expired / Discarded">Expired / Quality Test Discard</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <Save size={14} />
                  <span>{savingEdit ? 'Saving...' : 'Update Stock'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
