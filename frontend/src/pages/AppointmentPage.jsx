import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import {
  Calendar,
  Clock,
  MapPin,
  Building,
  Droplets,
  Phone,
  User,
  UserCheck,
  RefreshCw,
  Check,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

const ALL_TIME_SLOTS = [
  '09:00 AM - 10:00 AM',
  '10:00 AM - 11:00 AM',
  '11:00 AM - 12:00 PM',
  '01:00 PM - 02:00 PM',
  '02:00 PM - 03:00 PM',
  '03:00 PM - 04:00 PM',
  '04:00 PM - 05:00 PM',
];

export default function AppointmentPage({ user }) {
  const navigate = useNavigate();

  // Helper to get formatted date YYYY-MM-DD
  const getOffsetDateStr = (daysAhead) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    return d.toISOString().split('T')[0];
  };

  // Date offsets starting from tomorrow (+1 day), +2 days, +3 days up to 30 days
  const tomorrowStr = getOffsetDateStr(1);
  const dayAfterStr = getOffsetDateStr(2);
  const in3DaysStr = getOffsetDateStr(3);
  const maxDateStr = getOffsetDateStr(30);

  // Formatter for chip display (e.g. "Tomorrow • Sun, 18 Oct")
  const formatDateLabel = (dateStr) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  // Hospitals state
  const [hospitals, setHospitals] = useState([]);
  const [loadingHospitals, setLoadingHospitals] = useState(true);

  // Booked slots tracking
  const [bookedSlots, setBookedSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Simple Form state - preselected for tomorrow
  const [formData, setFormData] = useState({
    donorName: user?.name || '',
    donorEmail: user?.email || '',
    donorPhone: user?.phone || '',
    bloodGroup: user?.bloodGroup || '',
    hospitalId: '',
    hospitalName: '',
    hospitalAddress: '',
    hospitalCity: '',
    hospitalPhone: '',
    staffId: '',
    staffName: '',
    staffEmail: '',
    appointmentDate: tomorrowStr,
    timeSlot: '',
    notes: '',
  });

  const [availableStaffList, setAvailableStaffList] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Fetch Hospitals on mount
  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        setLoadingHospitals(true);
        const res = await fetch('/api/appointments/hospitals');
        const data = await res.json();
        if (res.ok && data.success && Array.isArray(data.hospitals)) {
          setHospitals(data.hospitals);
          if (data.hospitals.length > 0) {
            const first = data.hospitals[0];
            const staffList = first.staffList || [];
            setAvailableStaffList(staffList);
            const firstStaff = staffList.length > 0 ? staffList[0] : null;

            setFormData((prev) => ({
              ...prev,
              hospitalId: first.id || '',
              hospitalName: first.hospitalName || '',
              hospitalAddress: first.address || '',
              hospitalCity: first.city || '',
              hospitalPhone: first.phone || '',
              staffId: firstStaff?.id || '',
              staffName: firstStaff?.name || '',
              staffEmail: firstStaff?.email || '',
            }));
          }
        }
      } catch (err) {
        console.warn('Error fetching hospital list:', err);
      } finally {
        setLoadingHospitals(false);
      }
    };

    fetchHospitals();
  }, []);

  // Fetch booked slots whenever hospital, staff, or appointment date changes
  const fetchBookedSlots = useCallback(async () => {
    if (!formData.hospitalName || !formData.appointmentDate) {
      setBookedSlots([]);
      return;
    }

    try {
      setLoadingSlots(true);
      const params = new URLSearchParams({
        hospitalName: formData.hospitalName,
        date: formData.appointmentDate,
      });
      if (formData.hospitalId) {
        params.append('hospitalId', formData.hospitalId);
      }
      if (formData.staffEmail) {
        params.append('staffEmail', formData.staffEmail);
      }
      if (formData.staffId) {
        params.append('staffId', formData.staffId);
      }

      const res = await fetch(`/api/appointments/booked-slots?${params.toString()}`);
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.bookedSlots)) {
        setBookedSlots(data.bookedSlots);
      } else {
        setBookedSlots([]);
      }
    } catch (err) {
      console.warn('Error fetching booked slots:', err);
      setBookedSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, [formData.hospitalName, formData.appointmentDate, formData.hospitalId, formData.staffEmail, formData.staffId]);

  useEffect(() => {
    fetchBookedSlots();
  }, [fetchBookedSlots]);

  // Strictly filter out already booked slots so they are NOT shown to the user
  const availableSlots = useMemo(() => {
    return ALL_TIME_SLOTS.filter((slot) => !bookedSlots.includes(slot));
  }, [bookedSlots]);

  // Auto-select first available slot if current slot is booked or empty
  useEffect(() => {
    if (availableSlots.length > 0) {
      if (!formData.timeSlot || bookedSlots.includes(formData.timeSlot)) {
        setFormData((prev) => ({
          ...prev,
          timeSlot: availableSlots[0],
        }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        timeSlot: '',
      }));
    }
  }, [availableSlots, bookedSlots]);

  // Handle hospital select change
  const handleHospitalChange = (e) => {
    const selectedHospName = e.target.value;
    const hosp = hospitals.find((h) => h.hospitalName === selectedHospName);
    if (hosp) {
      const staffList = hosp.staffList || [];
      setAvailableStaffList(staffList);
      const firstStaff = staffList.length > 0 ? staffList[0] : null;

      setFormData((prev) => ({
        ...prev,
        hospitalId: hosp.id || '',
        hospitalName: hosp.hospitalName || '',
        hospitalAddress: hosp.address || '',
        hospitalCity: hosp.city || '',
        hospitalPhone: hosp.phone || '',
        staffId: firstStaff?.id || '',
        staffName: firstStaff?.name || '',
        staffEmail: firstStaff?.email || '',
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        hospitalName: selectedHospName,
      }));
    }
  };

  // Handle staff select change (time slots dynamically re-check for this staff)
  const handleStaffChange = (e) => {
    const selectedStaffEmail = e.target.value;
    const staff = availableStaffList.find((s) => s.email === selectedStaffEmail);
    if (staff) {
      setFormData((prev) => ({
        ...prev,
        staffId: staff.id || '',
        staffName: staff.name || '',
        staffEmail: staff.email || '',
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        staffEmail: selectedStaffEmail,
      }));
    }
  };

  // Submit Simple Booking
  const handleSubmitBooking = async (e) => {
    e.preventDefault();

    if (!formData.hospitalName) {
      Swal.fire({
        icon: 'warning',
        title: 'Select Hospital',
        text: 'Please select a hospital or blood bank.',
        confirmButtonColor: '#e11d48',
      });
      return;
    }

    if (!formData.appointmentDate) {
      Swal.fire({
        icon: 'warning',
        title: 'Select Date',
        text: 'Please select appointment date (Tomorrow or next 3 days).',
        confirmButtonColor: '#e11d48',
      });
      return;
    }

    if (!formData.timeSlot) {
      Swal.fire({
        icon: 'warning',
        title: 'No Available Slot',
        text: 'All time slots for this date are booked. Please choose another date.',
        confirmButtonColor: '#e11d48',
      });
      return;
    }

    if (!formData.donorPhone?.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Phone Required',
        text: 'Please enter your contact phone number.',
        confirmButtonColor: '#e11d48',
      });
      return;
    }

    if (!formData.bloodGroup) {
      Swal.fire({
        icon: 'warning',
        title: 'Blood Group Required',
        text: 'Please choose your blood group.',
        confirmButtonColor: '#e11d48',
      });
      return;
    }

    try {
      setSubmitting(true);

      const headers = {
        'Content-Type': 'application/json',
        'x-user-id': user?.id || user?._id || '',
        'x-donor-id': user?.id || user?._id || '',
        'x-user-email': user?.email || '',
      };
      if (user?.token) {
        headers['Authorization'] = `Bearer ${user.token}`;
      }

      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...formData,
          donationType: 'Blood Donation',
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to book appointment');
      }

      // Refresh booked slots so newly booked slot is excluded
      fetchBookedSlots();

      Swal.fire({
        icon: 'success',
        title: 'Appointment Booked Successfully!',
        html: `Your booking reference is <strong style="color: #e11d48; font-family: monospace; font-size: 15px;">${data.appointment.bookingReference}</strong>.<br/><span style="font-size: 13px; color: #64748b; margin-top: 8px; display: block;">Your appointment is confirmed. You can view, download, or print your pass anytime in <strong>My Bookings</strong>.</span>`,
        confirmButtonColor: '#e11d48',
        confirmButtonText: 'Go to My Bookings',
        showCancelButton: true,
        cancelButtonText: 'Book Another',
        cancelButtonColor: '#64748b',
        background: '#ffffff',
        color: '#0f172a',
      }).then((result) => {
        if (result.isConfirmed) {
          navigate('/my-bookings');
        } else {
          setFormData((prev) => ({
            ...prev,
            notes: '',
          }));
        }
      });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Booking Error',
        text: err.message,
        confirmButtonColor: '#e11d48',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto py-6 px-4 sm:px-6">
      {/* SIMPLE BOOKING FORM */}
      <form onSubmit={handleSubmitBooking} className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Book Blood Donation
            </h2>
            <p className="text-xs text-slate-400">
              Book for tomorrow or next 3 days. Real-time active slots only.
            </p>
          </div>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full">
            <Sparkles size={12} />
            <span>Smart Slot Filter</span>
          </span>
        </div>

        {/* Donor Basic Info (Auto-filled) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Donor Name
            </label>
            <div className="relative flex items-center">
              <User size={14} className="absolute left-3 text-slate-400" />
              <input
                type="text"
                value={formData.donorName}
                onChange={(e) => setFormData({ ...formData, donorName: e.target.value })}
                placeholder="Your Name"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-800 font-medium outline-none focus:bg-white focus:border-rose-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Phone Number
            </label>
            <div className="relative flex items-center">
              <Phone size={14} className="absolute left-3 text-slate-400" />
              <input
                type="tel"
                value={formData.donorPhone}
                onChange={(e) => setFormData({ ...formData, donorPhone: e.target.value })}
                placeholder="e.g. 9876543210"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-800 font-medium outline-none focus:bg-white focus:border-rose-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Blood Group
            </label>
            <div className="relative flex items-center">
              <Droplets size={14} className="absolute left-3 text-red-500" />
              <select
                value={formData.bloodGroup}
                onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-800 font-bold outline-none focus:bg-white focus:border-rose-500 cursor-pointer"
              >
                <option value="">Select Group</option>
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                  <option key={bg} value={bg}>
                    {bg}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Hospital / Blood Center Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Select Hospital / Blood Center
          </label>
          <div className="relative flex items-center">
            <Building size={15} className="absolute left-3.5 text-slate-400" />
            <select
              value={formData.hospitalName}
              onChange={handleHospitalChange}
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 font-semibold outline-none focus:bg-white focus:border-rose-500 cursor-pointer"
            >
              {hospitals.map((h) => (
                <option key={h.id || h.hospitalName} value={h.hospitalName}>
                  {h.hospitalName} — {h.address || h.city}
                </option>
              ))}
            </select>
          </div>
          {formData.hospitalAddress && (
            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <MapPin size={11} /> {formData.hospitalAddress}
            </p>
          )}
        </div>

        {/* Medical Staff / Officer Selector */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Select Medical Staff / Doctor
            </label>
            <span className="text-[11px] text-rose-600 font-semibold bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
              {availableStaffList.length} Available Staff
            </span>
          </div>

          <div className="relative flex items-center">
            <UserCheck size={15} className="absolute left-3.5 text-rose-600" />
            <select
              value={formData.staffEmail}
              onChange={handleStaffChange}
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 font-semibold outline-none focus:bg-white focus:border-rose-500 cursor-pointer"
            >
              {availableStaffList.length === 0 ? (
                <option value="">No Medical Staff Configured</option>
              ) : (
                availableStaffList.map((s) => (
                  <option key={s.id || s.email} value={s.email}>
                    {s.name} ({s.email}) — {s.role || 'Hospital Staff'}
                  </option>
                ))
              )}
            </select>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <Clock size={11} className="text-slate-400 shrink-0" />
            <span>Time slots below will dynamically adjust to this staff member's real-time schedule.</span>
          </p>
        </div>

        {/* 1-CLICK QUICK DATE SELECTOR (Tomorrow, Day After, In 3 Days) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-semibold text-slate-700">
              Donation Date (Tomorrow or Next 3 Days)
            </label>
            <span className="text-[11px] text-slate-400">
              Minimum booking: Next Day
            </span>
          </div>

          {/* Quick Date Chips */}
          <div className="grid grid-cols-3 gap-2 mb-2.5">
            {/* Tomorrow Chip */}
            <button
              type="button"
              onClick={() => setFormData({ ...formData, appointmentDate: tomorrowStr })}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                formData.appointmentDate === tomorrowStr
                  ? 'bg-rose-50 border-rose-500 text-rose-800 ring-2 ring-rose-500/20'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span className="block text-[10px] font-bold uppercase tracking-wider text-rose-600">
                Tomorrow (Kal)
              </span>
              <span className="block text-xs font-bold mt-0.5">
                {formatDateLabel(tomorrowStr)}
              </span>
            </button>

            {/* Day After Tomorrow Chip */}
            <button
              type="button"
              onClick={() => setFormData({ ...formData, appointmentDate: dayAfterStr })}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                formData.appointmentDate === dayAfterStr
                  ? 'bg-rose-50 border-rose-500 text-rose-800 ring-2 ring-rose-500/20'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Day After (Parso)
              </span>
              <span className="block text-xs font-bold mt-0.5">
                {formatDateLabel(dayAfterStr)}
              </span>
            </button>

            {/* In 3 Days Chip */}
            <button
              type="button"
              onClick={() => setFormData({ ...formData, appointmentDate: in3DaysStr })}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                formData.appointmentDate === in3DaysStr
                  ? 'bg-rose-50 border-rose-500 text-rose-800 ring-2 ring-rose-500/20'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                In 3 Days
              </span>
              <span className="block text-xs font-bold mt-0.5">
                {formatDateLabel(in3DaysStr)}
              </span>
            </button>
          </div>

          {/* Custom Date Input (min: Tomorrow, max: +30 Days) */}
          <div className="relative flex items-center">
            <Calendar size={15} className="absolute left-3.5 text-slate-400" />
            <input
              type="date"
              min={tomorrowStr}
              max={maxDateStr}
              value={formData.appointmentDate}
              onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-900 font-semibold outline-none focus:bg-white focus:border-rose-500 cursor-pointer"
            />
          </div>
        </div>

        {/* TIME SLOT SELECTOR - ONLY AVAILABLE SLOTS SHOWN */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-semibold text-slate-700">
              Select Available Time Slot
            </label>
            <div className="text-[11px] flex items-center gap-1.5">
              {loadingSlots ? (
                <span className="text-slate-400 flex items-center gap-1">
                  <RefreshCw size={11} className="animate-spin text-rose-600" />
                  Checking slots...
                </span>
              ) : availableSlots.length > 0 ? (
                <span className="text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  {availableSlots.length} Open Slot{availableSlots.length > 1 ? 's' : ''}
                  {bookedSlots.length > 0 ? ` (${bookedSlots.length} Booked)` : ''}
                </span>
              ) : (
                <span className="text-rose-700 font-semibold bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                  Fully Booked
                </span>
              )}
            </div>
          </div>

          {/* When slots are available: Show interactive pill grid */}
          {availableSlots.length > 0 ? (
            <div className="space-y-2">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {availableSlots.map((slot) => {
                  const isSelected = formData.timeSlot === slot;
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setFormData({ ...formData, timeSlot: slot })}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer flex items-center justify-between gap-1 text-left ${
                        isSelected
                          ? 'bg-rose-600 border-rose-600 text-white shadow-xs font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100 hover:border-slate-300'
                      }`}
                    >
                      <span className="flex items-center gap-1.5 truncate">
                        <Clock size={12} className={isSelected ? 'text-white' : 'text-slate-400'} />
                        {slot}
                      </span>
                      {isSelected && <Check size={13} className="shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Also dropdown for accessibility */}
              <div className="relative flex items-center pt-1">
                <Clock size={14} className="absolute left-3.5 text-slate-400" />
                <select
                  value={formData.timeSlot}
                  onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value })}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 font-medium outline-none focus:bg-white focus:border-rose-500 cursor-pointer"
                >
                  {availableSlots.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot} (Available)
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : !loadingSlots ? (
            /* Warning when all slots for that hospital on that date are booked */
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-amber-800">
                <AlertCircle size={15} className="text-amber-600" />
                <span>All time slots are booked for this date!</span>
              </div>
              <p className="text-amber-700 leading-relaxed">
                Hospital <strong>{formData.hospitalName}</strong> has no open slots on{' '}
                <strong>{formatDateLabel(formData.appointmentDate)}</strong>. Please select another date above (like Day After or In 3 Days) or choose a different hospital.
              </p>
            </div>
          ) : null}
        </div>

        {/* Optional Note */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Any Note / Message (Optional)
          </label>
          <input
            type="text"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="e.g. Will reach 10 minutes early"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-rose-500"
          />
        </div>

        {/* Submit Button */}
        <div className="pt-2 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-medium cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || availableSlots.length === 0}
            className="flex items-center gap-2 px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs md:text-sm font-bold shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>Booking Appointment...</span>
              </>
            ) : (
              <>
                <Check size={16} />
                <span>Confirm Blood Donation Appointment</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
