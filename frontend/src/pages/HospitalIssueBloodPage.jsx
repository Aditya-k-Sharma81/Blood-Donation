import React, { useState, useEffect, useMemo } from 'react';
import {
  HeartPulse,
  RefreshCw,
  Search,
  Clock,
  Phone,
  Droplets,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Printer,
  X,
  ClipboardList,
  Layers,
  ArrowLeft,
  Calendar,
} from 'lucide-react';
import Swal from 'sweetalert2';

export default function HospitalIssueBloodPage({ user, onLogout }) {
  const [hospitalName, setHospitalName] = useState(
    user?.hospitalName || user?.name || 'City Central Hospital'
  );

  // Available stocks for validation
  const [stocks, setStocks] = useState([]);
  const [loadingStocks, setLoadingStocks] = useState(true);

  // Blood Issue Dispensation History
  const [issueHistory, setIssueHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [historyGroupFilter, setHistoryGroupFilter] = useState('ALL');

  // Issue Blood Modal State
  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [issueFormData, setIssueFormData] = useState({
    patientName: '',
    patientPhone: '',
    patientEmail: '',
    patientAge: '',
    patientGender: 'Not Specified',
    patientHospitalId: '',
    prescribingDoctor: '',
    bloodGroup: 'O+',
    bagSize: '350ml',
    units: 1,
    purpose: 'Emergency Patient Transfusion',
    notes: '',
  });
  const [issuingBlood, setIssuingBlood] = useState(false);

  // Completed Transfusion Pass Modal State
  const [completedIssueSlip, setCompletedIssueSlip] = useState(null);

  // Fetch stocks to know available quantities
  const fetchStockData = async () => {
    try {
      setLoadingStocks(true);
      const headers = {
        'x-user-id': user?.id || user?._id || '',
        'x-hospital-id': user?.id || user?._id || '',
      };
      if (user?.token) headers['Authorization'] = `Bearer ${user.token}`;

      const res = await fetch(`/api/hospital/stock?hospitalName=${encodeURIComponent(hospitalName)}`, { headers });
      const data = await res.json();
      if (res.ok && data.success) {
        setStocks(data.stocks || []);
        if (data.hospitalName) setHospitalName(data.hospitalName);
      }
    } catch (err) {
      console.error('Fetch Stock Error:', err);
    } finally {
      setLoadingStocks(false);
    }
  };

  // Fetch blood dispensation history from backend API
  const fetchIssueHistory = async () => {
    try {
      setLoadingHistory(true);
      const headers = {
        'x-user-id': user?.id || user?._id || '',
        'x-hospital-id': user?.id || user?._id || '',
      };
      if (user?.token) headers['Authorization'] = `Bearer ${user.token}`;

      const res = await fetch(`/api/hospital/blood-issues?hospitalName=${encodeURIComponent(hospitalName)}`, { headers });
      const data = await res.json();
      if (res.ok && data.success) {
        setIssueHistory(data.issues || []);
      }
    } catch (err) {
      console.error('Fetch blood issue history error:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchStockData();
    fetchIssueHistory();
  }, [hospitalName]);

  // Open modal pre-configured
  const handleOpenIssueModal = (defaultGroup = 'O+') => {
    const selectedGroup = defaultGroup || (stocks.length > 0 ? stocks[0].bloodGroup : 'O+');
    setIssueFormData({
      patientName: '',
      patientPhone: '',
      patientEmail: '',
      patientAge: '',
      patientGender: 'Not Specified',
      patientHospitalId: '',
      prescribingDoctor: '',
      bloodGroup: selectedGroup,
      bagSize: '350ml',
      units: 1,
      purpose: 'Emergency Patient Transfusion',
      notes: '',
    });
    setIssueModalOpen(true);
  };

  // Compute live available stock for chosen blood group & bag size
  const selectedStockItem = useMemo(() => {
    return stocks.find((s) => s.bloodGroup === issueFormData.bloodGroup);
  }, [stocks, issueFormData.bloodGroup]);

  const availableUnitsForSelectedSize = useMemo(() => {
    if (!selectedStockItem) return 0;
    if (issueFormData.bagSize === '350ml') return selectedStockItem.units350 ?? 0;
    if (issueFormData.bagSize === '450ml') return selectedStockItem.units450 ?? 0;
    if (issueFormData.bagSize === '500ml') return selectedStockItem.units500 ?? 0;
    return selectedStockItem.units ?? 0;
  }, [selectedStockItem, issueFormData.bagSize]);

  // Handle blood dispensation submission
  const handleIssueBlood = async (e) => {
    e.preventDefault();

    if (!issueFormData.patientName.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Patient Name Required',
        text: 'Please enter the patient full name to issue blood.',
        confirmButtonColor: '#e11d48',
      });
      return;
    }

    if (!issueFormData.patientPhone.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Contact Phone Required',
        text: 'Please enter patient/attendant phone number.',
        confirmButtonColor: '#e11d48',
      });
      return;
    }

    const unitsToIssue = Math.max(1, parseInt(issueFormData.units, 10) || 1);
    if (unitsToIssue > availableUnitsForSelectedSize) {
      Swal.fire({
        icon: 'error',
        title: 'Insufficient Inventory',
        text: `Cannot issue ${unitsToIssue} bag(s) of ${issueFormData.bloodGroup} (${issueFormData.bagSize}). Only ${availableUnitsForSelectedSize} bag(s) available in inventory.`,
        confirmButtonColor: '#e11d48',
      });
      return;
    }

    try {
      setIssuingBlood(true);

      const headers = {
        'Content-Type': 'application/json',
        'x-user-id': user?.id || user?._id || '',
        'x-hospital-id': user?.id || user?._id || '',
        'x-user-name': user?.name || '',
      };
      if (user?.token) headers['Authorization'] = `Bearer ${user.token}`;

      const res = await fetch('/api/hospital/blood-issue', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...issueFormData,
          units: unitsToIssue,
          hospitalName,
          staffName: user?.name || 'Hospital Staff',
          staffEmail: user?.email || '',
          staffId: user?.id || user?._id || null,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to dispense blood.');
      }

      // Close modal and refresh real-time inventory and history
      setIssueModalOpen(false);
      fetchStockData();
      fetchIssueHistory();

      // Show completed printable transfusion slip
      setCompletedIssueSlip(data.issue);

      Swal.fire({
        icon: 'success',
        title: 'Blood Issued Successfully!',
        html: `Dispensed <strong style="color:#e11d48;">${unitsToIssue} bag(s)</strong> of <strong>${issueFormData.bloodGroup} (${issueFormData.bagSize})</strong> to <strong>${issueFormData.patientName}</strong>.<br/><br/><span style="color:#059669; font-weight:600; font-size:12px;">✓ Deducted from ${hospitalName} inventory.</span>`,
        confirmButtonColor: '#e11d48',
        confirmButtonText: 'View Dispatch Slip',
        showCancelButton: true,
        cancelButtonText: 'Done',
        cancelButtonColor: '#64748b',
      }).then((result) => {
        if (!result.isConfirmed) {
          setCompletedIssueSlip(null);
        }
      });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Dispensation Failed',
        text: err.message,
        confirmButtonColor: '#e11d48',
      });
    } finally {
      setIssuingBlood(false);
    }
  };

  // Filter issue history records
  const filteredHistory = useMemo(() => {
    return issueHistory.filter((item) => {
      if (historyGroupFilter !== 'ALL' && item.bloodGroup !== historyGroupFilter) {
        return false;
      }
      if (historySearchQuery.trim()) {
        const q = historySearchQuery.toLowerCase().trim();
        const pName = (item.patientName || '').toLowerCase();
        const pPhone = (item.patientPhone || '').toLowerCase();
        const ref = (item.issueReference || '').toLowerCase();
        const doc = (item.prescribingDoctor || '').toLowerCase();
        const bed = (item.patientHospitalId || '').toLowerCase();
        const reason = (item.purpose || '').toLowerCase();
        if (
          !pName.includes(q) &&
          !pPhone.includes(q) &&
          !ref.includes(q) &&
          !doc.includes(q) &&
          !bed.includes(q) &&
          !reason.includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [issueHistory, historyGroupFilter, historySearchQuery]);

  // Aggregate stats
  const totalBagsDispensed = useMemo(() => {
    return issueHistory.reduce((acc, curr) => acc + (curr.units || 1), 0);
  }, [issueHistory]);

  const totalCurrentStockUnits = useMemo(() => {
    return stocks.reduce((acc, curr) => acc + (curr.units || 0), 0);
  }, [stocks]);

  return (
    <div className="w-full max-w-6xl mx-auto my-6 px-4 space-y-6">

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Dispensed</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <Droplets size={16} />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {totalBagsDispensed} <span className="text-xs font-medium text-slate-500">Bags</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">To patients in need</p>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Official Passes</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Receipt size={16} />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {issueHistory.length} <span className="text-xs font-medium text-slate-500">Slips</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">Logged in hospital records</p>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Available Stock</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Layers size={16} />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {totalCurrentStockUnits} <span className="text-xs font-medium text-slate-500">Bags</span>
          </p>
          <p className="text-[11px] text-emerald-600 mt-1 font-medium">Across 8 blood groups</p>
        </div>

        <div className="bg-gradient-to-br from-rose-500 to-rose-600 text-white p-4 rounded-2xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-100">Quick Dispense</span>
            <HeartPulse size={16} className="text-rose-200" />
          </div>
          <div className="mt-3">
            <button
              type="button"
              onClick={() => handleOpenIssueModal()}
              className="w-full py-1.5 bg-white text-rose-600 hover:bg-rose-50 text-xs font-extrabold rounded-xl transition-all cursor-pointer shadow-xs"
            >
              + Issue Blood Now
            </button>
          </div>
        </div>
      </div>

      {/* Control Bar: Search & Filter */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3.5">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs font-bold text-slate-700 whitespace-nowrap">Filter Group:</span>
          {['ALL', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((bg) => (
            <button
              key={bg}
              type="button"
              onClick={() => setHistoryGroupFilter(bg)}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${historyGroupFilter === bg
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
            >
              {bg}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center flex-1 sm:w-64">
            <Search className="absolute left-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search patient, phone, doctor, ref..."
              value={historySearchQuery}
              onChange={(e) => setHistorySearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-slate-400 focus:bg-white text-xs pl-9 pr-3 py-2 rounded-xl outline-none transition-all placeholder:text-slate-400 font-medium text-slate-800"
            />
            {historySearchQuery && (
              <button
                onClick={() => setHistorySearchQuery('')}
                className="absolute right-2.5 text-slate-400 hover:text-slate-600 text-xs p-0.5 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              fetchIssueHistory();
              fetchStockData();
            }}
            disabled={loadingHistory}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all cursor-pointer shadow-xs shrink-0"
            title="Refresh logs"
          >
            <RefreshCw size={13} className={loadingHistory ? 'animate-spin text-rose-600' : 'text-slate-500'} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* History Table or Empty State */}
      {loadingHistory ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-16 flex flex-col items-center justify-center text-slate-500 shadow-xs">
          <RefreshCw className="w-8 h-8 animate-spin text-rose-600 mb-3" />
          <p className="text-sm font-medium text-slate-700">Loading Dispensation Records...</p>
          <p className="text-xs text-slate-400 mt-1">Retrieving official hospital blood issue history</p>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500 mx-auto mb-3">
            <ClipboardList size={24} />
          </div>
          <p className="text-sm font-semibold text-slate-800">No Dispensation Records Found</p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {historySearchQuery || historyGroupFilter !== 'ALL'
              ? 'No records match your filters. Try clearing your search.'
              : 'No blood units have been issued from this hospital yet. Click "Issue Blood to Patient" to record your first dispensation.'}
          </p>
          {historySearchQuery || historyGroupFilter !== 'ALL' ? (
            <button
              type="button"
              onClick={() => {
                setHistorySearchQuery('');
                setHistoryGroupFilter('ALL');
              }}
              className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 rounded-xl transition-all cursor-pointer"
            >
              Reset Filters
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleOpenIssueModal()}
              className="mt-4 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white rounded-xl transition-all cursor-pointer shadow-sm"
            >
              Dispense Blood Now
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3.5">Date & Ref Code</th>
                  <th className="px-5 py-3.5">Patient / Recipient</th>
                  <th className="px-5 py-3.5">Blood & Bag Size</th>
                  <th className="px-5 py-3.5">Units</th>
                  <th className="px-5 py-3.5">Clinical Indication / Doctor</th>
                  <th className="px-5 py-3.5">Dispensed By</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredHistory.map((item) => (
                  <tr key={item._id || item.issueReference} className="hover:bg-slate-50/70 transition-colors">
                    {/* Date & Ref */}
                    <td className="px-5 py-4">
                      <span className="font-mono text-xs font-bold text-rose-700 block">
                        {item.issueReference}
                      </span>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Clock size={11} />
                        {new Date(item.issueDate || item.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </td>

                    {/* Patient */}
                    <td className="px-5 py-4">
                      <span className="font-bold text-slate-900 block text-xs">
                        {item.patientName}
                      </span>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Phone size={10} className="text-slate-400" />
                          {item.patientPhone}
                        </span>
                        {item.patientAge && (
                          <span>
                            • {item.patientAge}y {item.patientGender !== 'Not Specified' ? item.patientGender : ''}
                          </span>
                        )}
                      </div>
                      {item.patientHospitalId && (
                        <span className="inline-block mt-0.5 text-[10px] font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded border border-slate-200">
                          {item.patientHospitalId}
                        </span>
                      )}
                    </td>

                    {/* Blood & Bag */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-black text-xs flex items-center justify-center shadow-2xs">
                          {item.bloodGroup}
                        </span>
                        <div>
                          <span className="font-bold text-slate-800 text-xs block">
                            {item.bloodGroup}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {item.bagSize || '350ml'} Bag
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Units */}
                    <td className="px-5 py-4">
                      <span className="text-sm font-extrabold text-slate-900">
                        {item.units}
                      </span>
                      <span className="text-[11px] text-slate-500 ml-1">Bag(s)</span>
                    </td>

                    {/* Indication */}
                    <td className="px-5 py-4">
                      <span className="font-semibold text-slate-800 block text-xs">
                        {item.purpose}
                      </span>
                      {item.prescribingDoctor && (
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          Prescribed by: {item.prescribingDoctor}
                        </span>
                      )}
                    </td>

                    {/* Dispensed By */}
                    <td className="px-5 py-4">
                      <span className="font-semibold text-slate-700 block text-xs">
                        {item.dispensedByStaffName || 'Hospital Staff'}
                      </span>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 mt-0.5">
                        <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
                        <span>{item.status || 'ISSUED'}</span>
                      </span>
                    </td>

                    {/* Action */}
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => setCompletedIssueSlip(item)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-rose-700 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-lg transition-colors cursor-pointer shadow-xs"
                        title="View official dispatch slip & print pass"
                      >
                        <Receipt size={13} className="text-rose-600" />
                        <span>View Slip</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. ISSUE BLOOD TO PATIENT MODAL */}
      {issueModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm overflow-y-auto p-2 sm:p-4 flex min-h-full items-center justify-center">
          <div className="relative w-full max-w-xl my-auto bg-white border border-slate-200 rounded-2xl sm:rounded-3xl shadow-2xl max-h-[calc(100vh-1.5rem)] sm:max-h-[calc(100vh-2.5rem)] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-4 py-2.5 sm:px-5 sm:py-3 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shadow-xs shrink-0">
                  <HeartPulse className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                    Issue Blood to Patient
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Dispense blood from <strong className="text-slate-700">{hospitalName}</strong> inventory
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIssueModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form Scrollable Body */}
            <form id="issue-blood-form" onSubmit={handleIssueBlood} className="flex-1 min-h-0 overflow-y-auto px-4 py-3 sm:px-5 sm:py-3.5 space-y-2.5 text-xs overscroll-contain">
              {/* Row 1: Patient Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                    Patient Full Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={issueFormData.patientName}
                    onChange={(e) => setIssueFormData({ ...issueFormData, patientName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 font-medium outline-none focus:bg-white focus:border-rose-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                    Contact Phone <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9876543210"
                    value={issueFormData.patientPhone}
                    onChange={(e) => setIssueFormData({ ...issueFormData, patientPhone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 font-medium outline-none focus:bg-white focus:border-rose-500 transition-all"
                  />
                </div>
              </div>

              {/* Row 2: Age, Gender, Bed/Ward, Doctor */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Age</label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    placeholder="Years"
                    value={issueFormData.patientAge}
                    onChange={(e) => setIssueFormData({ ...issueFormData, patientAge: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-xs text-slate-900 font-medium outline-none focus:bg-white focus:border-rose-500 transition-all text-center"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Gender</label>
                  <select
                    value={issueFormData.patientGender}
                    onChange={(e) => setIssueFormData({ ...issueFormData, patientGender: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-xs text-slate-900 font-medium outline-none focus:bg-white focus:border-rose-500 transition-all cursor-pointer"
                  >
                    <option value="Not Specified">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Bed / IPD No.</label>
                  <input
                    type="text"
                    placeholder="Bed 12 ICU"
                    value={issueFormData.patientHospitalId}
                    onChange={(e) => setIssueFormData({ ...issueFormData, patientHospitalId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 font-medium outline-none focus:bg-white focus:border-rose-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Doctor / Surgeon</label>
                  <input
                    type="text"
                    placeholder="Dr. Verma"
                    value={issueFormData.prescribingDoctor}
                    onChange={(e) => setIssueFormData({ ...issueFormData, prescribingDoctor: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 font-medium outline-none focus:bg-white focus:border-rose-500 transition-all"
                  />
                </div>
              </div>

              {/* Blood Group & Volume Selection Card */}
              <div className="p-2.5 sm:p-3 bg-rose-50/70 border border-rose-200 rounded-xl sm:rounded-2xl space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-black text-rose-950 uppercase tracking-wider flex items-center gap-1.5">
                    <Droplets size={13} className="text-rose-600" />
                    <span>Select Blood Group & Bag Size</span>
                  </span>
                  <span className="text-[10px] font-bold text-rose-700 bg-white px-2 py-0.5 rounded-full border border-rose-200 shrink-0">
                    Stock: {selectedStockItem?.units ?? 0} Bags
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {/* Blood Group Select */}
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Blood Group</label>
                    <select
                      value={issueFormData.bloodGroup}
                      onChange={(e) => setIssueFormData({ ...issueFormData, bloodGroup: e.target.value })}
                      className="w-full bg-white border border-rose-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 font-bold outline-none focus:border-rose-500 cursor-pointer shadow-2xs"
                    >
                      {stocks.map((s) => (
                        <option key={s.bloodGroup} value={s.bloodGroup}>
                          {s.bloodGroup} ({s.units} Bags Total • 350ml: {s.units350 ?? 0}, 450ml: {s.units450 ?? 0}, 500ml: {s.units500 ?? 0})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Units to Issue */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Units to Issue</label>
                    <input
                      type="number"
                      min="1"
                      max={Math.max(1, availableUnitsForSelectedSize)}
                      value={issueFormData.units}
                      onChange={(e) => setIssueFormData({ ...issueFormData, units: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                      required
                      className="w-full bg-white border border-rose-200 rounded-xl px-2 py-1.5 text-center text-xs font-extrabold text-slate-900 outline-none focus:border-rose-500 shadow-2xs"
                    />
                  </div>
                </div>

                {/* Bag Size Chips */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-slate-600">Select Bag Volume:</span>
                    <span className="text-[10px] font-medium text-slate-500">
                      Available: <strong className="text-slate-900">{availableUnitsForSelectedSize} bags</strong> in {issueFormData.bagSize}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {/* 350 mL */}
                    <button
                      type="button"
                      onClick={() => setIssueFormData({ ...issueFormData, bagSize: '350ml' })}
                      className={`py-1.5 px-2 rounded-xl border text-center transition-all cursor-pointer ${issueFormData.bagSize === '350ml'
                          ? 'bg-white border-blue-500 text-blue-900 ring-2 ring-blue-500/20 shadow-xs'
                          : 'bg-white/70 border-slate-200 text-slate-700 hover:bg-white'
                        }`}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-[10px] font-black uppercase text-blue-700">350 mL</span>
                        <span className="text-xs font-extrabold text-slate-900">
                          {selectedStockItem?.units350 ?? 0}
                        </span>
                      </div>
                      <span className="text-[9px] text-slate-400 block -mt-0.5">in stock</span>
                    </button>

                    {/* 450 mL */}
                    <button
                      type="button"
                      onClick={() => setIssueFormData({ ...issueFormData, bagSize: '450ml' })}
                      className={`py-1.5 px-2 rounded-xl border text-center transition-all cursor-pointer ${issueFormData.bagSize === '450ml'
                          ? 'bg-white border-purple-500 text-purple-900 ring-2 ring-purple-500/20 shadow-xs'
                          : 'bg-white/70 border-slate-200 text-slate-700 hover:bg-white'
                        }`}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-[10px] font-black uppercase text-purple-700">450 mL</span>
                        <span className="text-xs font-extrabold text-slate-900">
                          {selectedStockItem?.units450 ?? 0}
                        </span>
                      </div>
                      <span className="text-[9px] text-slate-400 block -mt-0.5">in stock</span>
                    </button>

                    {/* 500 mL */}
                    <button
                      type="button"
                      onClick={() => setIssueFormData({ ...issueFormData, bagSize: '500ml' })}
                      className={`py-1.5 px-2 rounded-xl border text-center transition-all cursor-pointer ${issueFormData.bagSize === '500ml'
                          ? 'bg-white border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20 shadow-xs'
                          : 'bg-white/70 border-slate-200 text-slate-700 hover:bg-white'
                        }`}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-[10px] font-black uppercase text-emerald-700">500 mL</span>
                        <span className="text-xs font-extrabold text-slate-900">
                          {selectedStockItem?.units500 ?? 0}
                        </span>
                      </div>
                      <span className="text-[9px] text-slate-400 block -mt-0.5">in stock</span>
                    </button>
                  </div>
                </div>

                {/* Live Stock Alert */}
                {availableUnitsForSelectedSize > 0 ? (
                  <div className="p-1.5 px-2.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium text-[10px] flex items-center gap-1.5">
                    <CheckCircle2 size={12} className="text-emerald-600 shrink-0" />
                    <span>
                      Ready: Deducting <strong>{issueFormData.units} bag(s)</strong> of {issueFormData.bloodGroup} ({issueFormData.bagSize}).
                    </span>
                  </div>
                ) : (
                  <div className="p-1.5 px-2.5 rounded-lg bg-red-50 text-red-800 border border-red-200 font-medium text-[10px] flex items-center gap-1.5">
                    <AlertTriangle size={12} className="text-red-600 shrink-0" />
                    <span>Out of stock for {issueFormData.bloodGroup} in {issueFormData.bagSize}. Please choose another size.</span>
                  </div>
                )}
              </div>

              {/* Purpose & Notes Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                    Clinical Purpose / Indication
                  </label>
                  <select
                    value={issueFormData.purpose}
                    onChange={(e) => setIssueFormData({ ...issueFormData, purpose: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 font-medium outline-none focus:bg-white focus:border-rose-500 cursor-pointer"
                  >
                    <option value="Emergency Patient Transfusion">Emergency Patient Transfusion (ICU)</option>
                    <option value="Trauma & Accident Surgery">Trauma & Emergency Surgery</option>
                    <option value="Operation Theatre (OT) Surgical Reserve">Operation Theatre (OT) Reserve</option>
                    <option value="Maternal / Caesarean Delivery">Maternal / Delivery Ward</option>
                    <option value="Thalassemia / Dialysis Treatment">Thalassemia / Dialysis Chronic Care</option>
                    <option value="Severe Anemia / Pediatric Ward">Severe Anemia / Pediatric Ward</option>
                    <option value="Routine Hospital Ward Transfusion">Routine Hospital Ward Transfusion</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                    Clinical Remarks (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Cross-matching verified"
                    value={issueFormData.notes}
                    onChange={(e) => setIssueFormData({ ...issueFormData, notes: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 font-medium outline-none focus:bg-white focus:border-rose-500 transition-all"
                  />
                </div>
              </div>
            </form>

            {/* Modal Footer (Fixed at bottom) */}
            <div className="px-4 py-2.5 sm:px-5 sm:py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
              <div className="text-[11px] text-slate-500 truncate max-w-[150px] sm:max-w-xs">
                Staff: <strong className="text-slate-800">{user?.name || user?.email || 'Hospital Staff'}</strong>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIssueModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  form="issue-blood-form"
                  disabled={issuingBlood || availableUnitsForSelectedSize < issueFormData.units || availableUnitsForSelectedSize === 0}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-xl transition-all cursor-pointer shadow-md shadow-rose-600/25"
                >
                  {issuingBlood ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />
                      <span>Dispensing...</span>
                    </>
                  ) : (
                    <>
                      <HeartPulse size={13} />
                      <span>Confirm & Issue Blood</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. OFFICIAL DIGITAL TRANSFUSION DISPATCH SLIP MODAL */}
      {completedIssueSlip && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm overflow-y-auto p-2 sm:p-4 flex min-h-full items-center justify-center">
          <div className="relative w-full max-w-lg my-auto bg-white border border-slate-200 rounded-2xl sm:rounded-3xl shadow-2xl max-h-[calc(100vh-1.5rem)] sm:max-h-[calc(100vh-2.5rem)] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Top Bar (Fixed) */}
            <div className="px-4 py-2.5 sm:px-5 sm:py-3 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 size={11} className="text-emerald-700" />
                  <span>Officially Dispensed</span>
                </span>
                <span className="text-[11px] font-bold text-slate-500">
                  {hospitalName}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setCompletedIssueSlip(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Slip Container (Scrollable Body) */}
            <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 sm:px-5 sm:py-4 space-y-3 bg-slate-50/50 text-xs overscroll-contain">
              {/* Slip Header */}
              <div className="flex items-start justify-between border-b border-slate-200 pb-2.5">
                <div>
                  <h4 className="text-sm font-black text-slate-900 tracking-tight">
                    Blood Transfusion Dispatch Pass
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Department of Transfusion Medicine
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-semibold">Reference No.</span>
                  <span className="font-mono font-bold text-rose-600 text-xs">
                    {completedIssueSlip.issueReference}
                  </span>
                </div>
              </div>

              {/* Patient Details */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Patient & Hospital Information
                </span>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200 space-y-1 shadow-2xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Patient Full Name:</span>
                    <strong className="text-slate-900 text-xs font-bold">{completedIssueSlip.patientName}</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Contact Phone:</span>
                    <strong className="text-slate-800">{completedIssueSlip.patientPhone}</strong>
                  </div>
                  {(completedIssueSlip.patientAge || completedIssueSlip.patientGender !== 'Not Specified') && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Age / Gender:</span>
                      <span className="text-slate-800 font-semibold">
                        {completedIssueSlip.patientAge ? `${completedIssueSlip.patientAge} Years` : ''} • {completedIssueSlip.patientGender}
                      </span>
                    </div>
                  )}
                  {completedIssueSlip.patientHospitalId && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Bed / Ward / IPD No:</span>
                      <span className="text-slate-800 font-semibold">{completedIssueSlip.patientHospitalId}</span>
                    </div>
                  )}
                  {completedIssueSlip.prescribingDoctor && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Prescribing Doctor:</span>
                      <span className="text-slate-800 font-semibold">{completedIssueSlip.prescribingDoctor}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Dispensed Blood Details */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Dispensed Blood Product
                </span>
                <div className="bg-rose-50/70 p-2.5 rounded-xl border border-rose-200 space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-rose-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                        {completedIssueSlip.bloodGroup}
                      </span>
                      <div>
                        <strong className="text-slate-900 block text-xs">
                          {completedIssueSlip.bloodGroup} (Rh Cross-Match Cleared)
                        </strong>
                        <span className="text-[10px] text-rose-700 font-medium">
                          {completedIssueSlip.bagSize} Volume Bag
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-extrabold text-slate-900 block">
                        {completedIssueSlip.units} Unit(s)
                      </span>
                      <span className="text-[9px] text-emerald-700 font-bold">Deducted from stock</span>
                    </div>
                  </div>

                  <div className="pt-1.5 border-t border-rose-200/60 flex justify-between items-center text-[10px]">
                    <span className="text-slate-600">Clinical Purpose:</span>
                    <strong className="text-slate-800">{completedIssueSlip.purpose}</strong>
                  </div>
                  {completedIssueSlip.notes && (
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-600">Clinical Remarks:</span>
                      <span className="text-slate-700 italic">{completedIssueSlip.notes}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Timestamp & Dispensing Officer */}
              <div className="pt-1.5 border-t border-slate-200/80 flex items-center justify-between text-[10px] text-slate-500">
                <span>
                  Dispensed By: <strong>{completedIssueSlip.dispensedByStaffName || 'Hospital Staff'}</strong>
                </span>
                <span>
                  {new Date(completedIssueSlip.issueDate || completedIssueSlip.createdAt).toLocaleString('en-US', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </span>
              </div>
            </div>

            {/* Modal Bottom Actions (Fixed) */}
            <div className="px-4 py-2.5 sm:px-5 sm:py-3 border-t border-slate-100 bg-white flex items-center justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer"
              >
                <Printer size={13} />
                <span>Print Pass</span>
              </button>
              <button
                type="button"
                onClick={() => setCompletedIssueSlip(null)}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer"
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
