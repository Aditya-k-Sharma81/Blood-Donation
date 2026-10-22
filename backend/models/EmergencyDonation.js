import mongoose from 'mongoose';

/**
 * EmergencyDonation Schema
 * Stores emergency blood collections dispatched and collected directly for emergency patients.
 * Note: These collections are directly used for the emergency transfusion and NOT added to general inventory stock.
 * Collection: 'emergency_donations'
 */
const emergencyDonationSchema = new mongoose.Schema(
  {
    emergencyRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EmergencyRequest',
      required: [true, 'Emergency Request ID is required'],
      index: true,
    },
    receiptNumber: {
      type: String,
      required: [true, 'Receipt number is required'],
      unique: true,
      trim: true,
      index: true,
    },
    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Donor',
      required: [true, 'Donor ID is required'],
      index: true,
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
      default: '',
      trim: true,
    },
    bloodGroup: {
      type: String,
      required: [true, 'Blood group is required'],
      trim: true,
    },
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null,
    },
    hospitalName: {
      type: String,
      required: [true, 'Hospital name is required'],
      trim: true,
    },
    hospitalLocation: {
      type: String,
      default: '',
      trim: true,
    },
    hospitalPhone: {
      type: String,
      default: '',
      trim: true,
    },
    bagVolume: {
      type: String,
      enum: ['350ml', '450ml', '500ml'],
      default: '350ml',
    },
    units: {
      type: Number,
      default: 1,
      min: 1,
    },
    donationDate: {
      type: Date,
      default: Date.now,
    },
    cooldownUntil: {
      type: Date,
      required: true,
    },
    collectedByStaffName: {
      type: String,
      default: 'Emergency Medical Officer',
      trim: true,
    },
    patientName: {
      type: String,
      default: 'Emergency Patient',
      trim: true,
    },
    patientWard: {
      type: String,
      default: 'Emergency / ICU',
      trim: true,
    },
    notes: {
      type: String,
      default: 'Emergency Direct Patient Transfusion. Not added to hospital general inventory stock.',
      trim: true,
    },
    isDirectPatientTransfusion: {
      type: Boolean,
      default: true,
    },
    addedToBloodStock: {
      type: Boolean,
      default: false, // Strictly not added to regular blood stock
    },
    status: {
      type: String,
      enum: ['COMPLETED', 'DISCARDED'],
      default: 'COMPLETED',
    },
  },
  {
    timestamps: true,
    collection: 'emergency_donations',
  }
);

const EmergencyDonation = mongoose.model('EmergencyDonation', emergencyDonationSchema);
export default EmergencyDonation;
