import mongoose from 'mongoose';

/**
 * EmergencyRequest Schema
 * Tracks emergency blood donation dispatch requests issued by Hospitals to nearby donors
 * Collection: 'emergency_requests'
 */
const emergencyRequestSchema = new mongoose.Schema(
  {
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
    bloodGroup: {
      type: String,
      default: 'ANY',
      trim: true,
    },
    urgency: {
      type: String,
      enum: ['CRITICAL', 'URGENT', 'MODERATE'],
      default: 'CRITICAL',
    },
    message: {
      type: String,
      required: [true, 'Emergency message is required'],
      trim: true,
    },
    radiusKm: {
      type: Number,
      default: 5,
    },
    targetedDonorCount: {
      type: Number,
      default: 0,
    },
    recipients: [
      {
        donorId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Donor',
          required: true,
        },
        donorName: String,
        donorEmail: String,
        donorPhone: String,
        distanceKm: Number,
        lastDonationDate: Date,
        status: {
          type: String,
          enum: ['SENT', 'ACCEPTED', 'DECLINED'],
          default: 'SENT',
        },
        sentAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    status: {
      type: String,
      enum: ['ACTIVE', 'FULFILLED', 'CANCELLED'],
      default: 'ACTIVE',
    },
  },
  {
    timestamps: true,
    collection: 'emergency_requests',
  }
);

const EmergencyRequest = mongoose.model('EmergencyRequest', emergencyRequestSchema);
export default EmergencyRequest;
