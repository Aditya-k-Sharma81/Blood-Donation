import mongoose from 'mongoose';

/**
 * BloodIssue Schema
 * Records units of blood dispensed / issued by hospital staff to patients in need.
 * Deducts directly from hospital inventory stock.
 * Collection: 'blood_issues'
 */
const bloodIssueSchema = new mongoose.Schema(
  {
    issueReference: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    hospitalUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null,
    },
    hospitalName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    // Patient / Recipient Details (User jo hospital me needed hoga)
    patientName: {
      type: String,
      required: [true, 'Patient or recipient full name is required'],
      trim: true,
    },
    patientPhone: {
      type: String,
      required: [true, 'Patient contact phone is required'],
      trim: true,
    },
    patientEmail: {
      type: String,
      default: '',
      trim: true,
      lowercase: true,
    },
    patientAge: {
      type: Number,
      default: null,
    },
    patientGender: {
      type: String,
      enum: ['Male', 'Female', 'Other', 'Not Specified'],
      default: 'Not Specified',
    },
    patientHospitalId: {
      type: String, // IPD / Bed No / Medical Record Number
      default: '',
      trim: true,
    },
    prescribingDoctor: {
      type: String,
      default: '',
      trim: true,
    },
    // Blood Dispatched Details
    bloodGroup: {
      type: String,
      required: [true, 'Blood group is required'],
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      trim: true,
    },
    bagSize: {
      type: String,
      required: true,
      enum: ['350ml', '450ml', '500ml'],
      default: '350ml',
    },
    units: {
      type: Number,
      required: true,
      min: [1, 'Must issue at least 1 unit'],
      default: 1,
    },
    purpose: {
      type: String,
      required: [true, 'Clinical purpose / reason is required'],
      trim: true,
      default: 'Emergency Patient Transfusion',
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
    // Dispensing Staff Details
    dispensedByStaffName: {
      type: String,
      default: 'Hospital Staff',
      trim: true,
    },
    dispensedByStaffEmail: {
      type: String,
      default: '',
      trim: true,
    },
    dispensedByStaffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HospitalUser',
      default: null,
    },
    issueDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    status: {
      type: String,
      enum: ['ISSUED', 'TRANSFUSED', 'CANCELLED'],
      default: 'ISSUED',
    },
  },
  {
    timestamps: true,
    collection: 'blood_issues',
  }
);

bloodIssueSchema.index({ hospitalName: 1, issueDate: -1 });

const BloodIssue = mongoose.model('BloodIssue', bloodIssueSchema);
export default BloodIssue;
