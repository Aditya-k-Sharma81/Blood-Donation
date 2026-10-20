import mongoose from 'mongoose';

/**
 * DonationRecord Schema
 * Stores clinical medical examination, blood collection details,
 * and blood group verification records linked to an Appointment.
 * Kept in a separate collection: 'donation_records'
 */
const donationRecordSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      required: [true, 'Linked appointment ID is required'],
      unique: true,
      index: true,
    },
    bookingReference: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Donor',
      required: true,
      index: true,
    },
    donorName: {
      type: String,
      required: true,
      trim: true,
    },
    donorEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    donorPhone: {
      type: String,
      default: '',
      trim: true,
    },
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null,
    },
    hospitalName: {
      type: String,
      required: true,
      trim: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HospitalUser',
      default: null,
    },
    doctorName: {
      type: String,
      default: '',
      trim: true,
    },
    doctorEmail: {
      type: String,
      default: '',
      lowercase: true,
      trim: true,
    },
    // Blood Collection Data
    bloodAmountMl: {
      type: Number,
      required: [true, 'Collected blood amount in mL is required'],
      min: [50, 'Minimum collection is 50 mL'],
      max: [600, 'Maximum collection is 600 mL'],
      default: 350,
    },
    unitsCollected: {
      type: Number,
      default: 1,
    },
    bagBarcode: {
      type: String,
      default: '',
      trim: true,
    },
    donationType: {
      type: String,
      default: 'Whole Blood',
      trim: true,
    },
    // Clinical Vitals & Medical Examination
    hemoglobin: {
      type: Number,
      default: 13.0,
    },
    bloodPressure: {
      type: String,
      default: '120/80',
      trim: true,
    },
    pulseRate: {
      type: Number,
      default: 72,
    },
    bodyTemperature: {
      type: String,
      default: '98.6 °F',
      trim: true,
    },
    bodyWeight: {
      type: Number,
      default: 60,
    },
    donorFitness: {
      type: String,
      default: 'Fit for Donation',
      trim: true,
    },
    // Blood Group Cross-Check & Verification
    registeredBloodGroup: {
      type: String,
      required: true,
      trim: true,
    },
    verifiedBloodGroup: {
      type: String,
      required: true,
      trim: true,
    },
    isBloodGroupMatched: {
      type: Boolean,
      required: true,
      default: true,
    },
    bloodGroupMismatchNote: {
      type: String,
      default: '',
      trim: true,
    },
    // Post-Donation Recovery & Remarks
    adverseReaction: {
      type: String,
      default: 'None - Normal Recovery',
      trim: true,
    },
    medicalRemarks: {
      type: String,
      default: '',
      trim: true,
    },
    donationDate: {
      type: Date,
      default: Date.now,
    },
    nextEligibleDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: 'donation_records',
  }
);

const DonationRecord = mongoose.model('DonationRecord', donationRecordSchema);
export default DonationRecord;
