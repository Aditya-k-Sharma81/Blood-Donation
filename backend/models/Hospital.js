const mongoose = require('mongoose');

const hospitalInventorySchema = new mongoose.Schema({
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'],
    required: true,
  },
  units: {
    type: Number,
    default: 15,
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
});

const hospitalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    hospitalName: {
      type: String,
      default: 'City Central Hospital & Blood Bank',
    },
    licenseNumber: {
      type: String,
      default: 'HOSP-8849-VERIFIED',
    },
    location: {
      lat: { type: Number, default: 30.901 },
      lng: { type: Number, default: 75.857 },
    },
    inventory: {
      type: [hospitalInventorySchema],
      default: function () {
        return [
          { bloodGroup: 'A+', units: 20 },
          { bloodGroup: 'A-', units: 8 },
          { bloodGroup: 'B+', units: 18 },
          { bloodGroup: 'B-', units: 6 },
          { bloodGroup: 'O+', units: 25 },
          { bloodGroup: 'O-', units: 3 }, // low stock example
          { bloodGroup: 'AB+', units: 12 },
          { bloodGroup: 'AB-', units: 4 },
        ];
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Hospital', hospitalSchema);
