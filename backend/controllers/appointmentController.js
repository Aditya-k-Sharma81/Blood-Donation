import Appointment from '../models/Appointment.js';
import Donor from '../models/Donor.js';
import Admin from '../models/Admin.js';
import HospitalUser from '../models/HospitalUser.js';
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

// @desc    Get List of Available Donation Hospitals & Blood Banks (including assigned Medical Staff)
// @route   GET /api/appointments/hospitals
// @access  Public / Donor
export const getAvailableHospitals = async (req, res) => {
  try {
    const admins = await Admin.find().select('name hospitalName phone city address hospitals licenseNumber');
    const hospitalUsers = await HospitalUser.find({ isPermitted: true }).select('name email hospitalName role isPermitted');

    const hospitalList = [];

    admins.forEach((admin) => {
      // Primary hospital under admin profile
      if (admin.hospitalName?.trim()) {
        const hName = admin.hospitalName.trim();
        const matchedStaff = hospitalUsers.filter(
          (u) => u.hospitalName && u.hospitalName.trim().toLowerCase() === hName.toLowerCase()
        );

        hospitalList.push({
          id: admin._id,
          hospitalName: hName,
          address: admin.address?.trim() || 'Central Healthcare Complex',
          city: admin.city?.trim() || 'City Center',
          phone: admin.phone?.trim() || '9876543210',
          licenseNumber: admin.licenseNumber?.trim() || 'REG-HOSP-01',
          category: 'Blood Bank & Multispecialty Hospital',
          staffList: matchedStaff.map((s) => ({
            id: s._id,
            name: s.name,
            email: s.email,
            role: s.role || 'Hospital Staff',
          })),
        });
      }

      // Sub-hospitals registered under admin
      if (Array.isArray(admin.hospitals)) {
        admin.hospitals.forEach((h) => {
          if (h.hospitalName?.trim() && !hospitalList.some((item) => item.hospitalName === h.hospitalName)) {
            const hName = h.hospitalName.trim();
            const matchedStaff = hospitalUsers.filter(
              (u) =>
                (u.hospitalName && u.hospitalName.trim().toLowerCase() === hName.toLowerCase()) ||
                (h.loginEmail && u.email && u.email.toLowerCase() === h.loginEmail.toLowerCase())
            );

            hospitalList.push({
              id: h._id || admin._id,
              hospitalName: hName,
              address: h.address?.trim() || 'Blood Collection Center',
              city: h.city?.trim() || 'Medical City',
              phone: h.phone?.trim() || '011-23456789',
              licenseNumber: h.licenseNumber?.trim() || 'REG-DL-847474',
              category: 'Authorized Blood Bank',
              staffList: matchedStaff.map((s) => ({
                id: s._id,
                name: s.name,
                email: s.email,
                role: s.role || 'Hospital Staff',
              })),
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
        staffList: hospitalUsers.map((s) => ({
          id: s._id,
          name: s.name,
          email: s.email,
          role: s.role || 'Hospital Staff',
        })),
      });
    }

    // Ensure every hospital has at least 1 staff member available
    hospitalList.forEach((h) => {
      if (!h.staffList || h.staffList.length === 0) {
        if (hospitalUsers.length > 0) {
          h.staffList = hospitalUsers.map((s) => ({
            id: s._id,
            name: s.name,
            email: s.email,
            role: s.role || 'Hospital Staff',
          }));
        } else {
          h.staffList = [
            {
              id: 'duty-staff-1',
              name: 'Dr. Duty Medical Officer',
              email: 'staff@gmail.com',
              role: 'Blood Bank In-Charge',
            },
          ];
        }
      }
    });

    res.status(200).json({
      success: true,
      hospitals: hospitalList,
    });
  } catch (error) {
    console.error('Get Available Hospitals Error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving donation centers.' });
  }
};

// @desc    Get List of Staff for a Specific Hospital
// @route   GET /api/appointments/staff
// @access  Public / Donor
export const getHospitalStaff = async (req, res) => {
  try {
    const { hospitalName } = req.query;
    const filter = { isPermitted: true };
    if (hospitalName && hospitalName.trim()) {
      filter.hospitalName = new RegExp(`^${hospitalName.trim()}$`, 'i');
    }
    let staff = await HospitalUser.find(filter).select('name email hospitalName role');
    if (staff.length === 0) {
      staff = await HospitalUser.find({ isPermitted: true }).select('name email hospitalName role');
    }
    res.status(200).json({
      success: true,
      staff: staff.map((s) => ({
        id: s._id,
        name: s.name,
        email: s.email,
        hospitalName: s.hospitalName,
        role: s.role || 'Hospital Staff',
      })),
    });
  } catch (error) {
    console.error('Get Hospital Staff Error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving staff.' });
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
      staffId,
      staffName,
      staffEmail,
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

    // Check if slot is already booked for this hospital and staff member
    const conflictConditions = [
      { hospitalName: hospitalName.trim() },
      { appointmentDate: { $gte: startOfDay, $lte: endOfDay } },
      { timeSlot: timeSlot.trim() },
      { status: { $ne: 'Cancelled' } },
    ];

    if (staffEmail && staffEmail.trim()) {
      conflictConditions.push({
        $or: [
          { staffEmail: staffEmail.toLowerCase().trim() },
          ...(staffId && staffId.length === 24 ? [{ staffId }] : []),
        ],
      });
    }

    const existingBooking = await Appointment.findOne({ $and: conflictConditions });

    if (existingBooking) {
      return res.status(409).json({
        success: false,
        message: `The time slot "${timeSlot.trim()}" is already booked with ${
          staffName ? staffName.trim() : 'this staff member'
        } on ${rawDateStr}. Please choose an available time slot or different staff.`,
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
      staffId: staffId && staffId.length === 24 ? staffId : null,
      staffName: (staffName || '').trim(),
      staffEmail: (staffEmail || '').toLowerCase().trim(),
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

// @desc    Get Booked Time Slots for a Hospital and Selected Staff on a Specific Date
// @route   GET /api/appointments/booked-slots
// @access  Public / Donor
export const getBookedSlots = async (req, res) => {
  try {
    const { hospitalName, hospitalId, date, staffId, staffEmail } = req.query;

    if (!date) {
      return res.status(400).json({ success: false, message: 'Date parameter is required.' });
    }

    const rawDateStr = typeof date === 'string'
      ? date.split('T')[0]
      : new Date(date).toISOString().split('T')[0];
    const [year, month, day] = rawDateStr.split('-').map(Number);
    const startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));

    const conditions = [
      { appointmentDate: { $gte: startOfDay, $lte: endOfDay } },
      { status: { $ne: 'Cancelled' } },
    ];

    if (hospitalId && hospitalId.length === 24) {
      conditions.push({
        $or: [
          { hospitalId },
          ...(hospitalName ? [{ hospitalName: hospitalName.trim() }] : []),
        ],
      });
    } else if (hospitalName) {
      conditions.push({ hospitalName: hospitalName.trim() });
    }

    // When staff is selected: filter booked slots specifically for this staff member
    if (staffEmail && staffEmail.trim()) {
      const cleanEmail = staffEmail.toLowerCase().trim();
      const staffOr = [{ staffEmail: cleanEmail }];
      if (staffId && staffId.length === 24) {
        staffOr.push({ staffId });
      }
      conditions.push({ $or: staffOr });
    } else if (staffId && staffId.length === 24) {
      conditions.push({ staffId });
    }

    const appointments = await Appointment.find({ $and: conditions }).select(
      'timeSlot hospitalName appointmentDate status staffEmail staffId'
    );

    const bookedSlots = [...new Set(appointments.map((a) => a.timeSlot.trim()))];

    res.status(200).json({
      success: true,
      date: rawDateStr,
      hospitalName: hospitalName || '',
      staffEmail: staffEmail || '',
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

// @desc    Get All Appointments (Admin / Hospital staff overview with staff-level isolation)
// @route   GET /api/appointments or GET /api/hospital/appointments
// @access  Hospital / Admin
export const getAllAppointments = async (req, res) => {
  try {
    const { hospitalName, hospitalId, status, bloodGroup, search, scope, staffId, staffEmail, role } = req.query;

    const conditions = [];

    // Identify user identity and permissions
    const reqEmail = (
      staffEmail ||
      req.headers['x-staff-email'] ||
      req.headers['x-user-email'] ||
      ''
    ).toLowerCase().trim();
    const reqId = staffId || req.headers['x-staff-id'] || req.headers['x-user-id'];
    const reqRole = (role || req.headers['x-user-role'] || '').toUpperCase();

    // Check if caller is a hospital staff member (vs Admin)
    let isHospitalStaff = reqRole === 'HOSPITAL' || reqRole === 'STAFF';
    if (!isHospitalStaff && reqRole !== 'ADMIN' && reqEmail) {
      const hUser = await HospitalUser.findOne({ email: reqEmail });
      if (hUser) isHospitalStaff = true;
    }

    // 1. Filter by Status: Exclude Cancelled by default
    if (status && status.trim() && status.toUpperCase() !== 'ALL') {
      conditions.push({ status: status.trim() });
    } else {
      conditions.push({ status: { $ne: 'Cancelled' } });
    }

    // 2. STAFF LEVEL ISOLATION:
    // If the requester is a Hospital Staff member, show ONLY appointments booked with this staff member!
    if (isHospitalStaff && reqRole !== 'ADMIN' && reqEmail) {
      const staffMatches = [{ staffEmail: reqEmail }];
      if (reqId && reqId.length === 24) {
        staffMatches.push({ staffId: reqId });
      }
      conditions.push({ $or: staffMatches });
    } else if (staffEmail && staffEmail.trim()) {
      // If Admin is filtering by a specific staff member
      conditions.push({ staffEmail: staffEmail.toLowerCase().trim() });
    }

    // 3. Filter by Hospital if specified and not 'ALL'
    if (scope !== 'all' && hospitalName && hospitalName.trim() && hospitalName.toUpperCase() !== 'ALL') {
      const cleanHosp = hospitalName.trim();
      const escaped = cleanHosp.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const hospConditions = [
        { hospitalName: { $regex: escaped, $options: 'i' } },
      ];
      if (hospitalId && hospitalId.length === 24) {
        hospConditions.push({ hospitalId });
      }
      conditions.push({ $or: hospConditions });
    }

    // 4. Filter by Blood Group
    if (bloodGroup && bloodGroup.trim() && bloodGroup.toUpperCase() !== 'ALL') {
      conditions.push({ bloodGroup: bloodGroup.trim() });
    }

    // 5. Filter by Search Query
    if (search && search.trim()) {
      const q = search.trim();
      const searchRegex = { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
      conditions.push({
        $or: [
          { donorName: searchRegex },
          { donorEmail: searchRegex },
          { donorPhone: searchRegex },
          { bookingReference: searchRegex },
          { hospitalName: searchRegex },
          { staffName: searchRegex },
          { staffEmail: searchRegex },
          { notes: searchRegex },
        ],
      });
    }

    const filterQuery = conditions.length > 0 ? { $and: conditions } : {};
    const appointments = await Appointment.find(filterQuery).sort({ appointmentDate: -1, createdAt: -1 });

    // Compute metrics scoped specifically for this view
    const baseMetricsFilter = isHospitalStaff && reqRole !== 'ADMIN' && reqEmail
      ? { $or: [{ staffEmail: reqEmail }, ...(reqId && reqId.length === 24 ? [{ staffId: reqId }] : [])] }
      : {};
    const scopedAppointments = await Appointment.find(baseMetricsFilter);
    const activeAppointments = scopedAppointments.filter((a) => a.status !== 'Cancelled');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const metrics = {
      total: activeAppointments.length,
      scheduled: scopedAppointments.filter((a) => a.status === 'Scheduled').length,
      confirmed: scopedAppointments.filter((a) => a.status === 'Confirmed').length,
      completed: scopedAppointments.filter((a) => a.status === 'Completed').length,
      cancelled: scopedAppointments.filter((a) => a.status === 'Cancelled').length,
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
