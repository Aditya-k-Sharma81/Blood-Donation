import DonationRecord from '../models/DonationRecord.js';
import Appointment from '../models/Appointment.js';
import Notification from '../models/Notification.js';
import Donor from '../models/Donor.js';
import BloodStock from '../models/BloodStock.js';
import Admin from '../models/Admin.js';
import HospitalUser from '../models/HospitalUser.js';

/**
 * @desc    Submit / Save Clinical Donation & Medical Examination Record
 * @route   POST /api/appointments/:id/donation-record
 * @access  Hospital Staff / Doctor
 */
export const recordDonation = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      bloodAmountMl,
      unitsCollected = 1,
      bagBarcode,
      donationType = 'Whole Blood',
      hemoglobin,
      bloodPressure,
      pulseRate,
      bodyTemperature,
      bodyWeight,
      donorFitness = 'Fit for Donation',
      registeredBloodGroup,
      verifiedBloodGroup,
      isBloodGroupMatched,
      bloodGroupMismatchNote,
      adverseReaction = 'None - Normal Recovery',
      medicalRemarks,
      donationDate = new Date(),
      doctorName,
      doctorEmail,
      doctorId,
    } = req.body;

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }

    if (!bloodAmountMl || Number(bloodAmountMl) <= 0) {
      return res.status(400).json({ success: false, message: 'Please provide valid blood amount in mL.' });
    }

    if (!verifiedBloodGroup) {
      return res.status(400).json({ success: false, message: 'Verified blood group is required.' });
    }

    const matchedBool = Boolean(isBloodGroupMatched);
    const donDateObj = new Date(donationDate);
    const validDonDate = isNaN(donDateObj.getTime()) ? new Date() : donDateObj;

    // Calculate next eligible date: 90 days after donation
    const nextEligible = new Date(validDonDate);
    nextEligible.setDate(nextEligible.getDate() + 90);

    // Identify doctor / staff info
    const effectiveDoctorName =
      (doctorName || appointment.staffName || req.headers['x-user-name'] || 'Consulting Medical Officer').trim();
    const effectiveDoctorEmail =
      (doctorEmail || appointment.staffEmail || req.headers['x-user-email'] || 'staff@hospital.org').trim().toLowerCase();

    // 1. Create or Update DonationRecord in separate 'donation_records' collection
    const recordData = {
      appointmentId: appointment._id,
      bookingReference: appointment.bookingReference,
      donorId: appointment.donorId,
      donorName: appointment.donorName,
      donorEmail: appointment.donorEmail,
      donorPhone: appointment.donorPhone,
      hospitalId: appointment.hospitalId,
      hospitalName: appointment.hospitalName,
      doctorId: doctorId && doctorId.length === 24 ? doctorId : appointment.staffId || null,
      doctorName: effectiveDoctorName,
      doctorEmail: effectiveDoctorEmail,
      bloodAmountMl: Number(bloodAmountMl),
      unitsCollected: Number(unitsCollected) || 1,
      bagBarcode: (bagBarcode || `BAG-${Math.floor(100000 + Math.random() * 900000)}`).trim(),
      donationType: donationType || 'Whole Blood',
      hemoglobin: hemoglobin !== undefined && hemoglobin !== '' ? Number(hemoglobin) : 13.5,
      bloodPressure: (bloodPressure || '120/80').trim(),
      pulseRate: pulseRate !== undefined && pulseRate !== '' ? Number(pulseRate) : 72,
      bodyTemperature: (bodyTemperature || '98.6 °F').trim(),
      bodyWeight: bodyWeight !== undefined && bodyWeight !== '' ? Number(bodyWeight) : 60,
      donorFitness: (donorFitness || 'Fit for Donation').trim(),
      registeredBloodGroup: (registeredBloodGroup || appointment.bloodGroup).trim(),
      verifiedBloodGroup: verifiedBloodGroup.trim(),
      isBloodGroupMatched: matchedBool,
      bloodGroupMismatchNote: (!matchedBool && bloodGroupMismatchNote ? bloodGroupMismatchNote.trim() : ''),
      adverseReaction: (adverseReaction || 'None - Normal Recovery').trim(),
      medicalRemarks: (medicalRemarks || '').trim(),
      donationDate: validDonDate,
      nextEligibleDate: nextEligible,
    };

    let donationRecord = await DonationRecord.findOne({ appointmentId: appointment._id });
    if (donationRecord) {
      Object.assign(donationRecord, recordData);
      await donationRecord.save();
    } else {
      donationRecord = await DonationRecord.create(recordData);
    }

    // 2. Mark Appointment as 'Completed'
    appointment.status = 'Completed';
    appointment.notes = (appointment.notes ? appointment.notes + ' | ' : '') + `Donation recorded: ${bloodAmountMl} mL by ${effectiveDoctorName}`;
    await appointment.save();

    // 3. Update Hospital Blood Stock Inventory with verified blood group
    try {
      const stockGroup = verifiedBloodGroup.trim();
      let stockItem = await BloodStock.findOne({
        hospitalName: appointment.hospitalName,
        bloodGroup: stockGroup,
      });

      if (stockItem) {
        stockItem.units = (stockItem.units || 0) + (Number(unitsCollected) || 1);
        stockItem.lastUpdated = new Date();
        stockItem.updatedBy = effectiveDoctorName;
        await stockItem.save();
      } else {
        await BloodStock.create({
          hospitalName: appointment.hospitalName,
          bloodGroup: stockGroup,
          units: Number(unitsCollected) || 1,
          lastUpdated: new Date(),
          updatedBy: effectiveDoctorName,
        });
      }
    } catch (stockErr) {
      console.warn('Could not auto-increment blood stock:', stockErr.message);
    }

    // 4. Dispatch Notifications to Donor Side
    if (!matchedBool) {
      // High-priority Blood Group Mismatch Notification with full clinical details
      await Notification.create({
        recipientId: appointment.donorId,
        recipientEmail: appointment.donorEmail,
        type: 'BLOOD_GROUP_MISMATCH',
        severity: 'warning',
        title: '⚠️ Medical Alert: Blood Group Verification Discrepancy',
        message: `During your donation visit at ${appointment.hospitalName}, Dr. ${effectiveDoctorName} conducted a clinical blood test and found your verified blood group is ${verifiedBloodGroup}, which differs from your registered profile (${recordData.registeredBloodGroup}).`,
        details: {
          appointmentId: appointment._id,
          bookingReference: appointment.bookingReference,
          hospitalName: appointment.hospitalName,
          doctorName: effectiveDoctorName,
          doctorEmail: effectiveDoctorEmail,
          registeredBloodGroup: recordData.registeredBloodGroup,
          verifiedBloodGroup: verifiedBloodGroup.trim(),
          isBloodGroupMatched: false,
          bloodGroupMismatchNote: recordData.bloodGroupMismatchNote || 'Laboratory cross-matching confirmed discrepancy with registered blood group.',
          bloodAmountMl: Number(bloodAmountMl),
          hemoglobin: recordData.hemoglobin,
          bloodPressure: recordData.bloodPressure,
          donationDate: validDonDate,
          nextEligibleDate: nextEligible,
          medicalRemarks: recordData.medicalRemarks,
        },
      });

      // Optionally update donor's profile blood group to verified blood group
      try {
        const donor = await Donor.findById(appointment.donorId);
        if (donor) {
          donor.bloodGroup = verifiedBloodGroup.trim();
          await donor.save();
        }
      } catch (e) { }
    } else {
      // Successful Donation Completion Notification & Certificate Receipt
      await Notification.create({
        recipientId: appointment.donorId,
        recipientEmail: appointment.donorEmail,
        type: 'DONATION_COMPLETED',
        severity: 'success',
        title: '❤️ Blood Donation Completed & Medical Record Verified',
        message: `Thank you for donating ${bloodAmountMl} mL of ${verifiedBloodGroup} blood at ${appointment.hospitalName}. Dr. ${effectiveDoctorName} has verified your clinical exam and completed your donation.`,
        details: {
          appointmentId: appointment._id,
          bookingReference: appointment.bookingReference,
          hospitalName: appointment.hospitalName,
          doctorName: effectiveDoctorName,
          doctorEmail: effectiveDoctorEmail,
          registeredBloodGroup: recordData.registeredBloodGroup,
          verifiedBloodGroup: verifiedBloodGroup.trim(),
          isBloodGroupMatched: true,
          bloodAmountMl: Number(bloodAmountMl),
          hemoglobin: recordData.hemoglobin,
          bloodPressure: recordData.bloodPressure,
          donationDate: validDonDate,
          nextEligibleDate: nextEligible,
          medicalRemarks: recordData.medicalRemarks,
        },
      });
    }

    res.status(201).json({
      success: true,
      message: matchedBool
        ? 'Medical donation record saved and appointment completed successfully!'
        : 'Medical donation record saved! Blood group mismatch alert dispatched to donor.',
      donationRecord,
      appointment,
    });
  } catch (error) {
    console.error('Record Donation Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error recording donation.' });
  }
};

/**
 * @desc    Get Donation Record by Appointment ID
 * @route   GET /api/appointments/:id/donation-record
 * @access  Hospital / Donor
 */
export const getDonationRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const record = await DonationRecord.findOne({ appointmentId: id });
    if (!record) {
      return res.status(404).json({ success: false, message: 'No donation record found for this appointment.' });
    }
    res.status(200).json({ success: true, donationRecord: record });
  } catch (error) {
    console.error('Get Donation Record Error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving donation record.' });
  }
};

/**
 * @desc    Get All Notifications for the Logged-in Donor
 * @route   GET /api/donor/notifications
 * @access  Donor
 */
export const getDonorNotifications = async (req, res) => {
  try {
    const donorId = req.headers['x-user-id'] || req.headers['x-donor-id'] || req.query.donorId;
    const donorEmail = (req.headers['x-user-email'] || req.headers['x-donor-email'] || req.query.email || '').toLowerCase().trim();

    if (!donorId && !donorEmail) {
      return res.status(200).json({ success: true, count: 0, unreadCount: 0, notifications: [] });
    }

    const conditions = [];
    if (donorId && donorId.length === 24) conditions.push({ recipientId: donorId });
    if (donorEmail && donorEmail.includes('@')) conditions.push({ recipientEmail: donorEmail });

    const notifications = await Notification.find({ $or: conditions }).sort({ createdAt: -1 }).limit(50);
    const unreadCount = notifications.filter((n) => !n.isRead).length;

    res.status(200).json({
      success: true,
      count: notifications.length,
      unreadCount,
      notifications,
    });
  } catch (error) {
    console.error('Get Notifications Error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving notifications.' });
  }
};

/**
 * @desc    Mark a specific notification as Read
 * @route   PATCH /api/donor/notifications/:id/read
 * @access  Donor
 */
export const markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notif = await Notification.findByIdAndUpdate(
      id,
      { isRead: true, readAt: new Date() },
      { new: true }
    );
    if (!notif) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }
    res.status(200).json({ success: true, notification: notif });
  } catch (error) {
    console.error('Mark Notification Read Error:', error);
    res.status(500).json({ success: false, message: 'Server error updating notification.' });
  }
};

/**
 * @desc    Mark all notifications as Read for the Donor
 * @route   PATCH /api/donor/notifications/read-all
 * @access  Donor
 */
export const markAllNotificationsRead = async (req, res) => {
  try {
    const donorId = req.headers['x-user-id'] || req.headers['x-donor-id'] || req.body.donorId;
    const donorEmail = (req.headers['x-user-email'] || req.headers['x-donor-email'] || req.body.email || '').toLowerCase().trim();

    const conditions = [];
    if (donorId && donorId.length === 24) conditions.push({ recipientId: donorId });
    if (donorEmail && donorEmail.includes('@')) conditions.push({ recipientEmail: donorEmail });

    if (conditions.length > 0) {
      await Notification.updateMany({ $or: conditions, isRead: false }, { isRead: true, readAt: new Date() });
    }

    res.status(200).json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    console.error('Mark All Read Error:', error);
    res.status(500).json({ success: false, message: 'Server error marking notifications read.' });
  }
};
