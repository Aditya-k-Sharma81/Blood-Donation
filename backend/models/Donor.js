const mongoose = require('mongoose');

const donorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'],
      default: 'O+',
    },
    lastDonationDate: {
      type: Date,
      default: null,
    },
    nextEligibleDate: {
      type: Date,
      default: Date.now,
    },
    autoInvitationSent: {
      type: Boolean,
      default: false,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    totalDonations: {
      type: Number,
      default: 0,
    },
    location: {
      lat: { type: Number, default: 30.905 },
      lng: { type: Number, default: 75.855 },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Donor', donorSchema);
