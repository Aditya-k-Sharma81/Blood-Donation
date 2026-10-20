import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import {
  Droplets,
  HeartPulse,
  Activity,
  FileText,
  CheckCircle2,
  AlertTriangle,
  X,
  Calendar,
  Clock,
  User,
  Phone,
  ShieldCheck,
  Building,
  Save,
  RefreshCw,
  Barcode,
  Stethoscope,
  Check,
  AlertCircle,
  Thermometer,
  Scale
} from 'lucide-react';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function ClinicalIntakeModal({
  isOpen,
  onClose,
  appointment,
  user,
  onSuccess,
}) {
  const [loading, setLoading] = useState(false);
  const [fetchingRecord, setFetchingRecord] = useState(false);
  const [existingRecord, setExistingRecord] = useState(null);
  const [activeTab, setActiveTab] = useState('form'); // 'form' | 'record'

  // Clinical Form Fields
  const [formData, setFormData] = useState({
    bloodAmountMl: 350,
    unitsCollected: 1,
    bagBarcode: '',
    donationType: 'Whole Blood',
    hemoglobin: 13.5,
    bloodPressure: '120/80',
    pulseRate: 72,
    bodyTemperature: '98.6 °F',
    bodyWeight: 65,
    donorFitness: 'Fit for Donation',
    registeredBloodGroup: '',
    verifiedBloodGroup: '',
    isBloodGroupMatched: true,
    bloodGroupMismatchNote: '',
    adverseReaction: 'None - Normal Recovery',
    medicalRemarks: '',
    donationDate: '',
    nextEligibleDate: '',
    doctorName: '',
    doctorEmail: '',
  });

  // Calculate 90 days ahead
  const getNextEligibleDate = (baseDateStr) => {
    const d = baseDateStr ? new Date(baseDateStr) : new Date();
    d.setDate(d.getDate() + 90);
    return d.toISOString().split('T')[0];
  };

  // Generate random bag barcode
  const generateBarcode = () => {
    const randomCode = `BAG-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    setFormData((prev) => ({ ...prev, bagBarcode: randomCode }));
  };

  // Populate initial state whenever modal opens or appointment changes
  useEffect(() => {
    if (!isOpen || !appointment) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const nextEligibleStr = getNextEligibleDate(todayStr);

    const initialRegGroup = appointment.bloodGroup || 'O+';
    const defaultDoctorName = user?.name || user?.hospitalName || appointment.staffName || 'Dr. Medical Officer';
    const defaultDoctorEmail = user?.email || appointment.staffEmail || '';

    setFormData({
      bloodAmountMl: 350,
      unitsCollected: 1,
      bagBarcode: `BAG-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`,
      donationType: appointment.donationType || 'Whole Blood',
      hemoglobin: 13.5,
      bloodPressure: '120/80',
      pulseRate: 72,
      bodyTemperature: '98.6 °F',
      bodyWeight: 65,
      donorFitness: 'Fit for Donation',
      registeredBloodGroup: initialRegGroup,
      verifiedBloodGroup: initialRegGroup,
      isBloodGroupMatched: true,
      bloodGroupMismatchNote: '',
      adverseReaction: 'None - Normal Recovery',
      medicalRemarks: '',
      donationDate: todayStr,
      nextEligibleDate: nextEligibleStr,
      doctorName: defaultDoctorName,
      doctorEmail: defaultDoctorEmail,
    });

    setExistingRecord(null);
    setActiveTab('form');

    // Fetch existing donation record if completed or existing
    const fetchExisting = async () => {
      try {
        setFetchingRecord(true);
        const res = await fetch(`/api/appointments/${appointment._id}/donation-record`);
        const data = await res.json();
        if (res.ok && data.success && data.donationRecord) {
          const rec = data.donationRecord;
          setExistingRecord(rec);
          setFormData({
            bloodAmountMl: rec.bloodAmountMl || 350,
            unitsCollected: rec.unitsCollected || 1,
            bagBarcode: rec.bagBarcode || '',
            donationType: rec.donationType || 'Whole Blood',
            hemoglobin: rec.hemoglobin || 13.5,
            bloodPressure: rec.bloodPressure || '120/80',
            pulseRate: rec.pulseRate || 72,
            bodyTemperature: rec.bodyTemperature || '98.6 °F',
            bodyWeight: rec.bodyWeight || 65,
            donorFitness: rec.donorFitness || 'Fit for Donation',
            registeredBloodGroup: rec.registeredBloodGroup || initialRegGroup,
            verifiedBloodGroup: rec.verifiedBloodGroup || initialRegGroup,
            isBloodGroupMatched: rec.isBloodGroupMatched !== undefined ? rec.isBloodGroupMatched : (rec.verifiedBloodGroup === rec.registeredBloodGroup),
            bloodGroupMismatchNote: rec.bloodGroupMismatchNote || '',
            adverseReaction: rec.adverseReaction || 'None - Normal Recovery',
            medicalRemarks: rec.medicalRemarks || '',
            donationDate: rec.donationDate ? new Date(rec.donationDate).toISOString().split('T')[0] : todayStr,
            nextEligibleDate: rec.nextEligibleDate ? new Date(rec.nextEligibleDate).toISOString().split('T')[0] : nextEligibleStr,
            doctorName: rec.doctorName || defaultDoctorName,
            doctorEmail: rec.doctorEmail || defaultDoctorEmail,
          });
          // If already completed, set tab to view record
          if (appointment.status === 'Completed') {
            setActiveTab('record');
          }
        }
      } catch (err) {
        // Record doesn't exist yet, form remains in intake mode
      } finally {
        setFetchingRecord(false);
      }
    };

    fetchExisting();
  }, [isOpen, appointment?._id]);

  if (!isOpen || !appointment) return null;

  // Handle Blood Group Verification Change
  const handleVerifiedGroupChange = (newVerifiedGroup) => {
    const isMatched = newVerifiedGroup === formData.registeredBloodGroup;
    setFormData((prev) => ({
      ...prev,
      verifiedBloodGroup: newVerifiedGroup,
      isBloodGroupMatched: isMatched,
      bloodGroupMismatchNote: isMatched ? '' : prev.bloodGroupMismatchNote,
    }));
  };

  // Form Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.bloodAmountMl || Number(formData.bloodAmountMl) <= 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Amount Required',
        text: 'Please enter valid blood amount collected in mL.',
        confirmButtonColor: '#e11d48',
      });
      return;
    }

    if (!formData.isBloodGroupMatched && !formData.bloodGroupMismatchNote.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Laboratory Discrepancy Note Required',
        text: 'Since the tested blood group does not match the registered profile, please write a brief medical note explaining the laboratory test finding for the donor.',
        confirmButtonColor: '#e11d48',
      });
      return;
    }

    try {
      setLoading(true);

      const headers = {
        'Content-Type': 'application/json',
        'x-user-id': user?.id || user?._id || '',
        'x-user-email': user?.email || '',
        'x-user-name': user?.name || user?.hospitalName || '',
      };
      if (user?.token) {
        headers['Authorization'] = `Bearer ${user.token}`;
      }

      const payload = {
        ...formData,
        bloodAmountMl: Number(formData.bloodAmountMl),
        unitsCollected: Number(formData.unitsCollected) || 1,
        hemoglobin: Number(formData.hemoglobin) || 13.5,
        pulseRate: Number(formData.pulseRate) || 72,
        bodyWeight: Number(formData.bodyWeight) || 60,
        isBloodGroupMatched: formData.verifiedBloodGroup === formData.registeredBloodGroup,
      };

      const res = await fetch(`/api/appointments/${appointment._id}/donation-record`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setExistingRecord(data.donationRecord);
        if (onSuccess) {
          onSuccess(data.appointment || { ...appointment, status: 'Completed' }, data.donationRecord);
        }

        if (!payload.isBloodGroupMatched) {
          Swal.fire({
            icon: 'warning',
            title: 'Medical Record Saved & Alert Dispatched!',
            html: `
              <div class="text-left text-xs space-y-2 mt-2">
                <div class="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900">
                  <p class="font-bold flex items-center gap-1 text-sm">
                    ⚠️ Blood Group Discrepancy Alert Sent to Donor
                  </p>
                  <p class="mt-1">
                    Donor's registered profile: <strong>${payload.registeredBloodGroup}</strong><br/>
                    Verified tested group: <strong class="text-rose-700">${payload.verifiedBloodGroup}</strong>
                  </p>
                  <p class="mt-1 text-slate-600 italic">"${payload.bloodGroupMismatchNote}"</p>
                </div>
                <p class="text-slate-600">
                  A high-priority notification with your medical notes has been dispatched to <strong>${appointment.donorName}</strong> (${appointment.donorEmail}).
                </p>
                <p class="text-emerald-700 font-semibold">
                  ✓ Collected ${payload.bloodAmountMl} mL blood credited to hospital inventory.
                </p>
              </div>
            `,
            confirmButtonColor: '#e11d48',
          });
        } else {
          Swal.fire({
            icon: 'success',
            title: 'Donation Completed Successfully!',
            html: `
              <div class="text-left text-xs space-y-2 mt-2">
                <p><strong>Donor:</strong> ${appointment.donorName}</p>
                <p><strong>Blood Collected:</strong> ${payload.bloodAmountMl} mL (${payload.verifiedBloodGroup})</p>
                <p><strong>Vitals:</strong> Hb ${payload.hemoglobin} g/dL | BP ${payload.bloodPressure} | Pulse ${payload.pulseRate} bpm</p>
                <div class="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-[11px] font-medium">
                  ✓ Saved to separate <code>donation_records</code> collection.<br/>
                  ✓ Appointment marked as Completed.<br/>
                  ✓ Digital confirmation receipt sent to donor.
                </div>
              </div>
            `,
            confirmButtonColor: '#10b981',
            timer: 2500,
          });
        }

        onClose();
      } else {
        throw new Error(data.message || 'Failed to record donation.');
      }
    } catch (err) {
      console.error('Record Donation Error:', err);
      Swal.fire({
        icon: 'error',
        title: 'Submission Error',
        text: err.message || 'Could not record clinical data.',
        confirmButtonColor: '#e11d48',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-3xl w-full shadow-2xl my-auto overflow-hidden animate-in fade-in duration-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-rose-50 via-red-50 to-white border-b border-rose-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-200">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  Clinical Examination & Blood Collection Form
                </h2>
                <span className="text-[10px] font-mono font-bold bg-white text-rose-700 border border-rose-200 px-2 py-0.5 rounded-md shadow-2xs">
                  {appointment.bookingReference}
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                <span>Donor: <strong className="text-slate-800">{appointment.donorName}</strong></span>
                <span>•</span>
                <span>Phone: <strong className="text-slate-700">{appointment.donorPhone}</strong></span>
                <span>•</span>
                <span>Venue: <strong className="text-slate-700">{appointment.hospitalName}</strong></span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Existing Record Switcher Tabs if record exists */}
        {existingRecord && (
          <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-slate-600">
              <CheckCircle2 size={14} className="text-emerald-600" />
              <span>Prior Clinical Record Found for this Appointment</span>
            </div>
            <div className="flex items-center bg-white p-0.5 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setActiveTab('record')}
                className={`px-3 py-1 font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'record'
                    ? 'bg-rose-50 text-rose-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                View Saved Record
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('form')}
                className={`px-3 py-1 font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'form'
                    ? 'bg-rose-50 text-rose-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Edit / Update Form
              </button>
            </div>
          </div>
        )}

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'record' && existingRecord ? (
            /* SAVED CLINICAL RECORD VIEW */
            <div className="space-y-5">
              {/* Blood Group Verification Result Banner */}
              <div
                className={`p-4 rounded-2xl border flex items-start justify-between gap-3 ${
                  existingRecord.isBloodGroupMatched
                    ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold ${
                      existingRecord.isBloodGroupMatched
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {existingRecord.isBloodGroupMatched ? <ShieldCheck size={20} /> : <AlertTriangle size={20} />}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">
                      {existingRecord.isBloodGroupMatched
                        ? '✓ Blood Group Cross-Check: Verified & Matched'
                        : '⚠️ Blood Group Verification Discrepancy Recorded'}
                    </h3>
                    <p className="text-xs mt-1">
                      Registered Profile: <strong>{existingRecord.registeredBloodGroup}</strong> | Tested by Doctor:{' '}
                      <strong className="text-rose-700 text-sm font-extrabold">{existingRecord.verifiedBloodGroup}</strong>
                    </p>
                    {!existingRecord.isBloodGroupMatched && existingRecord.bloodGroupMismatchNote && (
                      <div className="mt-2 p-2.5 bg-white/80 rounded-xl border border-amber-200 text-xs text-amber-950">
                        <strong className="block text-[11px] text-amber-800 uppercase tracking-wider">
                          Doctor's Laboratory Note:
                        </strong>
                        {existingRecord.bloodGroupMismatchNote}
                      </div>
                    )}
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-full text-xs font-black bg-white shadow-2xs border">
                  🩸 {existingRecord.verifiedBloodGroup}
                </span>
              </div>

              {/* Vitals & Collection Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Blood Collected</span>
                  <span className="text-base font-extrabold text-rose-700 block mt-0.5">
                    {existingRecord.bloodAmountMl} mL
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {existingRecord.unitsCollected} unit ({existingRecord.donationType})
                  </span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Hemoglobin (Hb)</span>
                  <span className="text-base font-extrabold text-slate-800 block mt-0.5">
                    {existingRecord.hemoglobin} g/dL
                  </span>
                  <span className="text-[10px] text-emerald-600 font-semibold">Normal range</span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Blood Pressure</span>
                  <span className="text-base font-extrabold text-slate-800 block mt-0.5">
                    {existingRecord.bloodPressure}
                  </span>
                  <span className="text-[10px] text-slate-500">Pulse: {existingRecord.pulseRate} bpm</span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Barcode #</span>
                  <span className="text-xs font-mono font-bold text-slate-800 block mt-1 truncate">
                    {existingRecord.bagBarcode}
                  </span>
                  <span className="text-[10px] text-slate-500">Weight: {existingRecord.bodyWeight} kg</span>
                </div>
              </div>

              {/* Additional Examination Details */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                  <span className="font-semibold text-slate-600">Attending Examiner:</span>
                  <span className="font-bold text-slate-900">{existingRecord.doctorName || 'Medical Officer'}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                  <span className="font-semibold text-slate-600">Donor Fitness:</span>
                  <span className="font-bold text-emerald-700">{existingRecord.donorFitness}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                  <span className="font-semibold text-slate-600">Post-Donation Recovery:</span>
                  <span className="font-bold text-slate-800">{existingRecord.adverseReaction}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-600">Next Eligible Donation Date:</span>
                  <span className="font-bold text-rose-700">
                    {existingRecord.nextEligibleDate
                      ? new Date(existingRecord.nextEligibleDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : '90 days after donation'}
                  </span>
                </div>
                {existingRecord.medicalRemarks && (
                  <div className="pt-2 border-t border-slate-200/60">
                    <span className="font-semibold text-slate-600 block mb-0.5">Doctor Remarks:</span>
                    <p className="text-slate-800 italic">{existingRecord.medicalRemarks}</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setActiveTab('form')}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Edit / Update Clinical Data
                </button>
              </div>
            </div>
          ) : (
            /* DOCTOR CLINICAL INTAKE FORM */
            <form id="clinicalIntakeForm" onSubmit={handleSubmit} className="space-y-6">
              {/* SECTION 1: BLOOD GROUP CROSS-CHECK & VERIFICATION */}
              <div className="p-4.5 bg-gradient-to-br from-rose-50/70 via-white to-slate-50 border-2 border-rose-200/80 rounded-2xl shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-rose-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-rose-600 text-white flex items-center justify-center font-bold text-xs">
                      1
                    </span>
                    <h3 className="font-extrabold text-slate-900 text-sm tracking-tight flex items-center gap-1.5">
                      <Droplets size={16} className="text-rose-600" />
                      <span>Blood Group Cross-Check & Verification</span>
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold text-rose-700 bg-rose-100/60 border border-rose-200 px-2 py-0.5 rounded-full">
                    Mandatory Clinical Test
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Registered Blood Group (Donor self-report) */}
                  <div className="p-3 bg-white border border-slate-200 rounded-xl">
                    <span className="text-[11px] font-semibold text-slate-400 block uppercase">
                      Donor's Registered Blood Group
                    </span>
                    <div className="flex items-center gap-2.5 mt-1">
                      <span className="text-xl font-black text-slate-700 bg-slate-100 border border-slate-200 px-3 py-1 rounded-xl">
                        🩸 {formData.registeredBloodGroup}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Self-declared on profile
                      </span>
                    </div>
                  </div>

                  {/* Doctor's Tested / Verified Blood Group Selector */}
                  <div className="p-3 bg-white border border-rose-300 rounded-xl ring-2 ring-rose-50">
                    <label className="text-[11px] font-bold text-rose-700 block uppercase">
                      Doctor's Tested & Verified Blood Group *
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <select
                        value={formData.verifiedBloodGroup}
                        onChange={(e) => handleVerifiedGroupChange(e.target.value)}
                        className="w-full bg-rose-50/50 border border-rose-200 text-slate-900 font-black text-sm px-3 py-2 rounded-xl outline-none focus:border-rose-500 focus:bg-white transition-all cursor-pointer"
                        required
                      >
                        {BLOOD_GROUPS.map((bg) => (
                          <option key={bg} value={bg}>
                            🩸 Blood Group {bg}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Dynamic Cross-Check Status Indicator */}
                {formData.isBloodGroupMatched ? (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800 font-medium">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    <span>
                      <strong>Cross-Match Confirmed:</strong> Tested group ({formData.verifiedBloodGroup}) matches the donor's registered record.
                    </span>
                  </div>
                ) : (
                  <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-xl space-y-2 text-xs text-amber-950 animate-in fade-in">
                    <div className="flex items-center gap-2 font-bold text-amber-900">
                      <AlertTriangle size={17} className="text-amber-600 shrink-0" />
                      <span>
                        ⚠️ Discrepancy Detected: Registered ({formData.registeredBloodGroup}) ≠ Tested ({formData.verifiedBloodGroup})
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      An official medical notification explaining this discrepancy will be dispatched to <strong>{appointment.donorName}</strong>. Please provide your clinical laboratory observation below:
                    </p>
                    <div>
                      <label className="block text-[11px] font-bold text-amber-900 mb-1">
                        Doctor's Laboratory Discrepancy Note (Explains discrepancy to Donor) *
                      </label>
                      <textarea
                        rows={2}
                        value={formData.bloodGroupMismatchNote}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, bloodGroupMismatchNote: e.target.value }))
                        }
                        placeholder="e.g., Laboratory ABO forward and reverse typing confirmed donor is B+ with anti-A antibodies present. Updated donor medical record."
                        className="w-full bg-white border border-amber-300 rounded-xl p-2.5 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-amber-200 placeholder:text-slate-400"
                        required={!formData.isBloodGroupMatched}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 2: BLOOD COLLECTION QUANTITY & BAG TRACKING */}
              <div className="p-4.5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-rose-600 text-white flex items-center justify-center font-bold text-xs">
                      2
                    </span>
                    <h3 className="font-extrabold text-slate-900 text-sm tracking-tight flex items-center gap-1.5">
                      <HeartPulse size={16} className="text-rose-600" />
                      <span>Blood Collection Quantity & Inventory</span>
                    </h3>
                  </div>
                  <span className="text-[10px] text-slate-500 font-semibold">
                    Whole Blood / Component
                  </span>
                </div>

                <div className="space-y-3">
                  {/* Amount in mL with Quick Select Chips */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Amount of Blood Collected (in mL) *
                    </label>
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      {[350, 450, 500].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, bloodAmountMl: amt }))}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            Number(formData.bloodAmountMl) === amt
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          {amt} mL {amt === 350 ? '(Standard)' : amt === 450 ? '(High)' : ''}
                        </button>
                      ))}
                    </div>

                    <div className="relative max-w-xs">
                      <input
                        type="number"
                        min="50"
                        max="600"
                        value={formData.bloodAmountMl}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, bloodAmountMl: e.target.value }))
                        }
                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-bold text-sm px-3 py-2 rounded-xl outline-none focus:border-rose-500 focus:bg-white transition-all"
                        placeholder="e.g. 350"
                        required
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-semibold">
                        mL
                      </span>
                    </div>
                  </div>

                  {/* Barcode & Donation Component */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-slate-700">
                          Blood Bag Barcode / Lot #
                        </label>
                        <button
                          type="button"
                          onClick={generateBarcode}
                          className="text-[10px] text-rose-600 font-bold hover:underline cursor-pointer"
                        >
                          + Auto-Generate
                        </button>
                      </div>
                      <div className="relative">
                        <Barcode className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          value={formData.bagBarcode}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, bagBarcode: e.target.value }))
                          }
                          className="w-full bg-slate-50 border border-slate-200 font-mono text-xs pl-9 pr-3 py-2 rounded-xl outline-none focus:border-rose-500 focus:bg-white"
                          placeholder="e.g. BAG-2026-98172"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Donation Component
                      </label>
                      <select
                        value={formData.donationType}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, donationType: e.target.value }))
                        }
                        className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold px-3 py-2 rounded-xl outline-none focus:border-rose-500 focus:bg-white cursor-pointer"
                      >
                        <option value="Whole Blood">Whole Blood</option>
                        <option value="Packed Red Blood Cells">Packed Red Blood Cells (PRBC)</option>
                        <option value="Platelets">Platelets (Apheresis)</option>
                        <option value="Fresh Frozen Plasma">Fresh Frozen Plasma (FFP)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 3: CLINICAL EXAMINATION & DONOR VITALS */}
              <div className="p-4.5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-rose-600 text-white flex items-center justify-center font-bold text-xs">
                      3
                    </span>
                    <h3 className="font-extrabold text-slate-900 text-sm tracking-tight flex items-center gap-1.5">
                      <Activity size={16} className="text-rose-600" />
                      <span>Clinical Examination & Donor Vitals</span>
                    </h3>
                  </div>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                    Pre-Donation Check
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  {/* Hemoglobin */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Hemoglobin (g/dL) *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.hemoglobin}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, hemoglobin: e.target.value }))
                      }
                      className="w-full bg-slate-50 border border-slate-200 font-bold px-3 py-2 rounded-xl outline-none focus:border-rose-500 focus:bg-white"
                      placeholder="e.g. 13.5"
                      required
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      Normal: ≥ 12.5 g/dL
                    </span>
                  </div>

                  {/* Blood Pressure */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Blood Pressure (mmHg) *
                    </label>
                    <input
                      type="text"
                      value={formData.bloodPressure}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, bloodPressure: e.target.value }))
                      }
                      className="w-full bg-slate-50 border border-slate-200 font-bold px-3 py-2 rounded-xl outline-none focus:border-rose-500 focus:bg-white"
                      placeholder="e.g. 120/80"
                      required
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      Sys / Dia
                    </span>
                  </div>

                  {/* Pulse Rate */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Pulse Rate (bpm)
                    </label>
                    <input
                      type="number"
                      value={formData.pulseRate}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, pulseRate: e.target.value }))
                      }
                      className="w-full bg-slate-50 border border-slate-200 font-bold px-3 py-2 rounded-xl outline-none focus:border-rose-500 focus:bg-white"
                      placeholder="e.g. 72"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      60 - 100 bpm
                    </span>
                  </div>

                  {/* Body Temperature */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Body Temperature
                    </label>
                    <input
                      type="text"
                      value={formData.bodyTemperature}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, bodyTemperature: e.target.value }))
                      }
                      className="w-full bg-slate-50 border border-slate-200 font-medium px-3 py-2 rounded-xl outline-none focus:border-rose-500 focus:bg-white"
                      placeholder="e.g. 98.6 °F"
                    />
                  </div>

                  {/* Body Weight */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Donor Weight (kg)
                    </label>
                    <input
                      type="number"
                      value={formData.bodyWeight}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, bodyWeight: e.target.value }))
                      }
                      className="w-full bg-slate-50 border border-slate-200 font-bold px-3 py-2 rounded-xl outline-none focus:border-rose-500 focus:bg-white"
                      placeholder="e.g. 65"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      Min: ≥ 45 kg
                    </span>
                  </div>

                  {/* Medical Fitness */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Clinical Fitness
                    </label>
                    <select
                      value={formData.donorFitness}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, donorFitness: e.target.value }))
                      }
                      className="w-full bg-slate-50 border border-slate-200 font-semibold px-2.5 py-2 rounded-xl outline-none focus:border-rose-500 focus:bg-white cursor-pointer text-xs"
                    >
                      <option value="Fit for Donation">Fit for Donation</option>
                      <option value="Temporarily Deferred">Temporarily Deferred</option>
                      <option value="Permanently Deferred">Permanently Deferred</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 4: RECOVERY, REMARKS & NEXT ELIGIBILITY */}
              <div className="p-4.5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-rose-600 text-white flex items-center justify-center font-bold text-xs">
                      4
                    </span>
                    <h3 className="font-extrabold text-slate-900 text-sm tracking-tight flex items-center gap-1.5">
                      <FileText size={16} className="text-rose-600" />
                      <span>Post-Donation Recovery & Remarks</span>
                    </h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Post-Donation Adverse Reaction
                    </label>
                    <select
                      value={formData.adverseReaction}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, adverseReaction: e.target.value }))
                      }
                      className="w-full bg-slate-50 border border-slate-200 font-medium px-3 py-2 rounded-xl outline-none focus:border-rose-500 focus:bg-white cursor-pointer"
                    >
                      <option value="None - Normal Recovery">None - Normal Recovery</option>
                      <option value="Mild Dizziness / Vasovagal">Mild Dizziness / Vasovagal</option>
                      <option value="Nausea / Weakness">Nausea / Weakness</option>
                      <option value="Hematoma at Needle Site">Hematoma at Needle Site</option>
                      <option value="Other / Observation Required">Other / Observation Required</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Next Eligible Donation Date (90 Days)
                    </label>
                    <input
                      type="date"
                      value={formData.nextEligibleDate}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, nextEligibleDate: e.target.value }))
                      }
                      className="w-full bg-slate-50 border border-slate-200 font-bold px-3 py-2 rounded-xl outline-none focus:border-rose-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="text-xs">
                  <label className="block font-bold text-slate-700 mb-1">
                    Doctor's Clinical Remarks / Advice for Donor
                  </label>
                  <textarea
                    rows={2}
                    value={formData.medicalRemarks}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, medicalRemarks: e.target.value }))
                    }
                    placeholder="e.g. Donor tolerated donation well. Advised to stay hydrated and avoid strenuous activities for 24 hours."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:border-rose-500 focus:bg-white placeholder:text-slate-400"
                  />
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs"
          >
            Cancel
          </button>

          {activeTab === 'form' && (
            <button
              type="submit"
              form="clinicalIntakeForm"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-200 cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Submitting Clinical Record...</span>
                </>
              ) : (
                <>
                  <Save size={14} />
                  <span>Submit Donation Record & Complete Appointment</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
