import mongoose from 'mongoose';

/**
 * Notification Schema
 * Stores notifications for Donors including Blood Group Mismatch alerts,
 * Clinical Donation Receipts, and Appointment Status Updates.
 * Collection: 'notifications'
 */
const notificationSchema = new mongoose.Schema(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Donor',
      required: true,
      index: true,
    },
    recipientEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['BLOOD_GROUP_MISMATCH', 'DONATION_COMPLETED', 'APPOINTMENT_CONFIRMED', 'GENERAL'],
      default: 'GENERAL',
    },
    severity: {
      type: String,
      enum: ['critical', 'warning', 'success', 'info'],
      default: 'info',
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    // Detailed Clinical & Mismatch Payload
    details: {
      appointmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment',
      },
      bookingReference: String,
      hospitalName: String,
      doctorName: String,
      doctorEmail: String,
      registeredBloodGroup: String,
      verifiedBloodGroup: String,
      isBloodGroupMatched: Boolean,
      bloodGroupMismatchNote: String,
      bloodAmountMl: Number,
      hemoglobin: Number,
      bloodPressure: String,
      donationDate: Date,
      nextEligibleDate: Date,
      medicalRemarks: String,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'notifications',
  }
);

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
