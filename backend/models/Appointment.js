import mongoose from 'mongoose';

/**
 * Appointment Schema for Voluntary Blood Donation
 * Collection: 'appointments'
 */
const appointmentSchema = new mongoose.Schema(
  {
    bookingReference: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Donor',
      required: true,
    },
    donorName: {
      type: String,
      required: [true, 'Donor name is required'],
      trim: true,
    },
    donorEmail: {
      type: String,
      required: [true, 'Donor email is required'],
      lowercase: true,
      trim: true,
    },
    donorPhone: {
      type: String,
      required: [true, 'Contact phone number is required'],
      trim: true,
    },
    bloodGroup: {
      type: String,
      required: [true, 'Blood group is required'],
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      trim: true,
    },
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null,
    },
    hospitalName: {
      type: String,
      required: [true, 'Selected hospital or blood bank is required'],
      trim: true,
    },
    hospitalAddress: {
      type: String,
      default: '',
      trim: true,
    },
    hospitalCity: {
      type: String,
      default: '',
      trim: true,
    },
    hospitalPhone: {
      type: String,
      default: '',
      trim: true,
    },
    appointmentDate: {
      type: Date,
      required: [true, 'Appointment date is required'],
    },
    timeSlot: {
      type: String,
      required: [true, 'Time slot is required'],
      trim: true,
    },
    donationType: {
      type: String,
      default: 'Blood Donation',
      trim: true,
    },
    status: {
      type: String,
      enum: ['Scheduled', 'Confirmed', 'Completed', 'Cancelled'],
      default: 'Scheduled',
    },
    eligibilityConfirmed: {
      type: Boolean,
      default: true,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
    cancelledReason: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: 'appointments',
  }
);

appointmentSchema.index({ donorId: 1, appointmentDate: -1 });

const Appointment = mongoose.model('Appointment', appointmentSchema);
export default Appointment;
