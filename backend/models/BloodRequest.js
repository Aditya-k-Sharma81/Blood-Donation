const mongoose = require('mongoose');

const bloodRequestSchema = new mongoose.Schema(
  {
    requestId: {
      type: String,
      unique: true,
      required: true,
    },
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      required: true,
    },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'],
      required: true,
    },
    unitsRequired: {
      type: Number,
      required: true,
    },
    unitsFulfilled: {
      type: Number,
      default: 0,
    },
    requestType: {
      type: String,
      enum: ['EMERGENCY_DISPATCH', 'AUTO_90DAY_REENGAGEMENT'],
      default: 'EMERGENCY_DISPATCH',
    },
    urgency: {
      type: String,
      enum: ['NORMAL', 'URGENT', 'CRITICAL'],
      default: 'CRITICAL',
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'FULFILLED', 'CANCELLED'],
      default: 'ACTIVE',
    },
    respondedDonors: [
      {
        donorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Donor' },
        status: { type: String, enum: ['NOTIFIED', 'ACCEPTED', 'COLLECTED'], default: 'NOTIFIED' },
        updatedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('BloodRequest', bloodRequestSchema);
