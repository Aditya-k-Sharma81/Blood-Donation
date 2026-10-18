import Appointment from '../models/Appointment.js';
import Donor from '../models/Donor.js';
import Admin from '../models/Admin.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'blood_donation_secret_key_123';

// Helper to authenticate donor strictly (No cross-user fallback)
const authenticateDonor = async (req) => {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    if (token && token !== 'undefined' && token !== 'null') {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded?.id) {
          const donor = await Donor.findById(decoded.id);
          if (donor) return { donorId: donor._id, donor };
        }
      } catch (err) { }
    }
  }

  const donorId =
    req.headers['x-user-id'] ||
    req.headers['x-donor-id'] ||
    req.query?.donorId ||
    req.body?.donorId;
  const donorEmail =
    req.headers['x-user-email'] ||
    req.headers['x-donor-email'] ||
    req.query?.email ||
    req.body?.email;

  if (donorId && donorId !== 'undefined' && donorId !== 'null' && donorId.length === 24) {
    try {
      const donor = await Donor.findById(donorId);
      if (donor) return { donorId: donor._id, donor };
    } catch (e) { }
  }

  if (donorEmail && donorEmail !== 'undefined' && donorEmail !== 'null' && donorEmail.includes('@')) {
    try {
      const donor = await Donor.findOne({ email: donorEmail.toLowerCase().trim() });
      if (donor) return { donorId: donor._id, donor };
    } catch (e) { }
  }

  // Strict check: DO NOT fallback to any other user's account
  return { error: 'Please login as a Donor to manage and view your blood donation appointments.', status: 401 };
};

// @desc    Get List of Available Donation Hospitals & Blood Banks
// @route   GET /api/appointments/hospitals
// @access  Public / Donor
export const getAvailableHospitals = async (req, res) => {
  try {
    const admins = await Admin.find().select('name hospitalName phone city address hospitals licenseNumber');

    const hospitalList = [];

    admins.forEach((admin) => {
      // Primary hospital under admin profile
      if (admin.hospitalName?.trim()) {
        hospitalList.push({
          id: admin._id,
          hospitalName: admin.hospitalName.trim(),
          address: admin.address?.trim() || 'Central Healthcare Complex',
          city: admin.city?.trim() || 'City Center',
          phone: admin.phone?.trim() || '9876543210',
          licenseNumber: admin.licenseNumber?.trim() || 'REG-HOSP-01',
          category: 'Blood Bank & Multispecialty Hospital',
        });
      }

      // Sub-hospitals registered under admin
      if (Array.isArray(admin.hospitals)) {
        admin.hospitals.forEach((h) => {
          if (h.hospitalName?.trim() && !hospitalList.some((item) => item.hospitalName === h.hospitalName)) {
            hospitalList.push({
              id: h._id || admin._id,
              hospitalName: h.hospitalName.trim(),
              address: h.address?.trim() || 'Blood Collection Center',
              city: h.city?.trim() || 'Medical City',
              phone: h.phone?.trim() || '011-23456789',
              licenseNumber: h.licenseNumber?.trim() || 'REG-DL-847474',
              category: 'Authorized Blood Bank',
            });
          }
        });
      }
    });

    // Fallback default hospital if none configured
    if (hospitalList.length === 0) {
      hospitalList.push({
        id: 'default-hosp-1',
        hospitalName: 'City Central Hospital & Blood Bank',
        address: '102 Medical Campus, Civil Hospital Road',
        city: 'New Delhi',
        phone: '+91 99054 65626',
        licenseNumber: 'REG-CENTRAL-001',
        category: 'Regional Blood Transfusion Center',
      });
    }

    res.status(200).json({
      success: true,
      hospitals: hospitalList,
    });
  } catch (error) {
    console.error('Get Available Hospitals Error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving donation centers.' });
  }
};

// @desc    Book a new Blood Donation Appointment
// @route   POST /api/appointments
// @access  Donor (Protected)
export const createAppointment = async (req, res) => {
  try {
    const auth = await authenticateDonor(req);
    if (auth.error) {
      return res.status(auth.status).json({ success: false, message: auth.error });
    }

    const {
      donorName,
      donorEmail,
      donorPhone,
      bloodGroup,
      hospitalId,
      hospitalName,
      hospitalAddress,
      hospitalCity,
      hospitalPhone,
      appointmentDate,
      timeSlot,
      donationType,
      notes,
    } = req.body;

    if (!hospitalName || !appointmentDate || !timeSlot) {
      return res.status(400).json({
        success: false,
        message: 'Hospital name, donation date, and time slot are required.',
      });
    }

    const apptDate = new Date(appointmentDate);
    if (isNaN(apptDate.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid appointment date.' });
    }

    // Must be today or future date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(apptDate);
    checkDate.setHours(0, 0, 0, 0);

    if (checkDate < today) {
      return res.status(400).json({
        success: false,
        message: 'Appointment date cannot be in the past.',
      });
    }

    // Parse date window for duplicate slot checking
    const rawDateStr = typeof appointmentDate === 'string'
      ? appointmentDate.split('T')[0]
      : new Date(appointmentDate).toISOString().split('T')[0];
    const [year, month, day] = rawDateStr.split('-').map(Number);
    const startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));

    // Check if slot is already booked for this hospital
    const existingBooking = await Appointment.findOne({
      hospitalName: hospitalName.trim(),
      appointmentDate: { $gte: startOfDay, $lte: endOfDay },
      timeSlot: timeSlot.trim(),
      status: { $ne: 'Cancelled' },
    });

    if (existingBooking) {
      return res.status(409).json({
        success: false,
        message: `The time slot "${timeSlot.trim()}" is already booked for ${hospitalName.trim()} on ${rawDateStr}. Please choose an available time slot.`,
      });
    }

    const donor = auth.donor;

    const resolvedBloodGroup = (bloodGroup || donor.bloodGroup || '').trim();
    if (!resolvedBloodGroup) {
      return res.status(400).json({
        success: false,
        message: 'Please provide or select your blood group.',
      });
    }

    const resolvedPhone = (donorPhone || donor.phone || '').trim();
    if (!resolvedPhone) {
      return res.status(400).json({
        success: false,
        message: 'Contact phone number is required to confirm appointment.',
      });
    }

    // Save phone and blood group back to donor profile if not set yet
    if (!donor.bloodGroup && resolvedBloodGroup) {
      donor.bloodGroup = resolvedBloodGroup;
    }
    if (!donor.phone && resolvedPhone) {
      donor.phone = resolvedPhone;
    }
    await donor.save();

    // Generate unique human-readable booking ticket reference
    const timestampPart = Date.now().toString(36).toUpperCase();
    const randomPart = Math.floor(1000 + Math.random() * 9000);
    const bookingReference = `RKT-APT-${timestampPart}-${randomPart}`;

    const appointment = await Appointment.create({
      bookingReference,
      donorId: donor._id,
      donorName: (donorName || donor.name || 'Voluntary Donor').trim(),
      donorEmail: (donorEmail || donor.email).toLowerCase().trim(),
      donorPhone: resolvedPhone,
      bloodGroup: resolvedBloodGroup,
      hospitalId: hospitalId && hospitalId.length === 24 ? hospitalId : null,
      hospitalName: hospitalName.trim(),
      hospitalAddress: (hospitalAddress || 'Main Blood Bank Wing').trim(),
      hospitalCity: (hospitalCity || donor.city || '').trim(),
      hospitalPhone: (hospitalPhone || '').trim(),
      appointmentDate: startOfDay,
      timeSlot: timeSlot.trim(),
      donationType: donationType || 'Blood Donation',
      status: 'Scheduled',
      eligibilityConfirmed: true,
      notes: (notes || '').trim(),
    });

    res.status(201).json({
      success: true,
      message: 'Blood donation appointment booked successfully!',
      appointment,
    });
  } catch (error) {
    console.error('Create Appointment Error:', error);
    res.status(500).json({ success: false, message: 'Server error booking appointment.' });
  }
};

// @desc    Get Booked Time Slots for a Hospital on a Specific Date
// @route   GET /api/appointments/booked-slots
// @access  Public / Donor
export const getBookedSlots = async (req, res) => {
  try {
    const { hospitalName, hospitalId, date } = req.query;

    if (!date) {
      return res.status(400).json({ success: false, message: 'Date parameter is required.' });
    }

    const rawDateStr = typeof date === 'string'
      ? date.split('T')[0]
      : new Date(date).toISOString().split('T')[0];
    const [year, month, day] = rawDateStr.split('-').map(Number);
    const startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));

    const filter = {
      appointmentDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $ne: 'Cancelled' },
    };

    if (hospitalId && hospitalId.length === 24) {
      filter.$or = [
        { hospitalId },
        ...(hospitalName ? [{ hospitalName: hospitalName.trim() }] : []),
      ];
    } else if (hospitalName) {
      filter.hospitalName = hospitalName.trim();
    }

    const appointments = await Appointment.find(filter).select('timeSlot hospitalName appointmentDate status');

    const bookedSlots = [...new Set(appointments.map((a) => a.timeSlot.trim()))];

    res.status(200).json({
      success: true,
      date: rawDateStr,
      hospitalName: hospitalName || '',
      bookedSlots,
      count: bookedSlots.length,
    });
  } catch (error) {
    console.error('Get Booked Slots Error:', error);
    res.status(500).json({ success: false, message: 'Error checking booked slots.' });
  }
};

// @desc    Get All Appointments for the Logged-in Donor
// @route   GET /api/appointments/my
// @desc    Get All Appointments for the Logged-in Donor (shows all details: Cancelled, Scheduled, Confirmed, Completed)
// @route   GET /api/appointments/my
// @access  Donor (Protected)
export const getDonorAppointments = async (req, res) => {
  try {
    const auth = await authenticateDonor(req);
    if (auth.error) {
      return res.status(auth.status).json({ success: false, message: auth.error });
    }

    const donorId = auth.donorId;
    const donorEmail = auth.donor?.email ? auth.donor.email.toLowerCase().trim() : '';

    // STRICT MATCH: Only return appointments belonging to this specific logged-in donor
    // Returns ALL statuses: Scheduled, Confirmed, Completed, Cancelled
    const queryConditions = [{ donorId: donorId }];
    if (donorEmail) {
      queryConditions.push({ donorEmail: donorEmail });
    }

    const appointments = await Appointment.find({ $or: queryConditions }).sort({
      appointmentDate: -1,
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: appointments.length,
      donor: {
        id: donorId,
        name: auth.donor?.name || '',
        email: donorEmail,
      },
      appointments,
    });
  } catch (error) {
    console.error('Get Donor Appointments Error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching appointments.' });
  }
};

// @desc    Cancel an Appointment
// @route   PATCH /api/appointments/:id/cancel
// @access  Donor (Protected)
export const cancelAppointment = async (req, res) => {
  try {
    const auth = await authenticateDonor(req);
    if (auth.error) {
      return res.status(auth.status).json({ success: false, message: auth.error });
    }

    const { id } = req.params;
    const { reason } = req.body;

    const donorId = auth.donorId;
    const donorEmail = auth.donor?.email ? auth.donor.email.toLowerCase().trim() : '';

    const queryConditions = [{ donorId: donorId }];
    if (donorEmail) {
      queryConditions.push({ donorEmail: donorEmail });
    }

    const appointment = await Appointment.findOne({
      _id: id,
      $or: queryConditions,
    });

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found for your donor account.' });
    }

    if (appointment.status === 'Completed') {
      return res.status(400).json({ success: false, message: 'Completed appointments cannot be cancelled.' });
    }

    appointment.status = 'Cancelled';
    if (reason?.trim()) {
      appointment.cancelledReason = reason.trim();
    }
    await appointment.save();

    res.status(200).json({
      success: true,
      message: 'Appointment cancelled successfully.',
      appointment,
    });
  } catch (error) {
    console.error('Cancel Appointment Error:', error);
    res.status(500).json({ success: false, message: 'Server error cancelling appointment.' });
  }
};

// @desc    Get All Appointments (Admin / Hospital staff overview)
// @route   GET /api/appointments or GET /api/hospital/appointments
// @access  Hospital / Admin
export const getAllAppointments = async (req, res) => {
  try {
    const { hospitalName, hospitalId, status, bloodGroup, search, scope } = req.query;

    const filter = {};

    // Filter by Hospital if specified and not 'ALL'
    if (scope !== 'all' && hospitalName && hospitalName.trim() && hospitalName.toUpperCase() !== 'ALL') {
      const cleanHosp = hospitalName.trim();
      const escaped = cleanHosp.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const conditions = [
        { hospitalName: { $regex: escaped, $options: 'i' } }
      ];
      if (hospitalId && hospitalId.length === 24) {
        conditions.push({ hospitalId });
      }
      filter.$or = conditions;
    }

    // Filter by Status: Exclude Cancelled by default so only non-cancelled appointments show in hospital
    if (status && status.trim() && status.toUpperCase() !== 'ALL') {
      filter.status = status.trim();
    } else {
      filter.status = { $ne: 'Cancelled' };
    }

    // Filter by Blood Group
    if (bloodGroup && bloodGroup.trim() && bloodGroup.toUpperCase() !== 'ALL') {
      filter.bloodGroup = bloodGroup.trim();
    }

    // Filter by Search Query
    if (search && search.trim()) {
      const q = search.trim();
      const searchRegex = { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
      const searchConditions = [
        { donorName: searchRegex },
        { donorEmail: searchRegex },
        { donorPhone: searchRegex },
        { bookingReference: searchRegex },
        { hospitalName: searchRegex },
        { notes: searchRegex },
      ];
      if (filter.$or) {
        filter.$and = [
          { $or: filter.$or },
          { $or: searchConditions },
        ];
        delete filter.$or;
      } else {
        filter.$or = searchConditions;
      }
    }

    const appointments = await Appointment.find(filter).sort({ appointmentDate: -1, createdAt: -1 });

    // Compute metrics
    const allAppointments = await Appointment.find();
    const activeAppointments = allAppointments.filter((a) => a.status !== 'Cancelled');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const metrics = {
      total: activeAppointments.length,
      scheduled: allAppointments.filter((a) => a.status === 'Scheduled').length,
      confirmed: allAppointments.filter((a) => a.status === 'Confirmed').length,
      completed: allAppointments.filter((a) => a.status === 'Completed').length,
      cancelled: allAppointments.filter((a) => a.status === 'Cancelled').length,
      todayCount: activeAppointments.filter((a) => {
        const d = new Date(a.appointmentDate);
        return d >= today && d < tomorrow;
      }).length,
    };

    res.status(200).json({
      success: true,
      count: appointments.length,
      metrics,
      appointments,
    });
  } catch (error) {
    console.error('Get All Appointments Error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching all appointments.' });
  }
};

// @desc    Update Appointment Status & Notes (Hospital / Admin staff)
// @route   PATCH /api/appointments/:id/status
// @access  Hospital / Admin
export const updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, cancelledReason, notes } = req.body;

    const validStatuses = ['Scheduled', 'Confirmed', 'Completed', 'Cancelled'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }

    if (status) appointment.status = status;
    if (cancelledReason !== undefined) appointment.cancelledReason = cancelledReason.trim();
    if (notes !== undefined) appointment.notes = notes.trim();

    await appointment.save();

    res.status(200).json({
      success: true,
      message: `Appointment status updated to ${appointment.status}.`,
      appointment,
    });
  } catch (error) {
    console.error('Update Appointment Status Error:', error);
    res.status(500).json({ success: false, message: 'Server error updating appointment status.' });
  }
};
