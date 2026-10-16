import mongoose from 'mongoose';

/**
 * Blood Stock Inventory Schema
 * Tracks real-time stock levels of all 8 blood groups per hospital / blood bank
 * Collection: 'blood_stocks'
 */
const bloodStockSchema = new mongoose.Schema(
  {
    hospitalName: {
      type: String,
      required: true,
      trim: true,
      default: 'City Central Hospital',
    },
    hospitalUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null,
    },
    bloodGroup: {
      type: String,
      required: true,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      trim: true,
    },
    units: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Units cannot be negative'],
    },
    capacity: {
      type: Number,
      default: 50,
      min: 1,
    },
    updatedBy: {
      type: String,
      default: 'Hospital Staff',
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: 'blood_stocks',
  }
);

// Compound index to ensure unique bloodGroup per hospital
bloodStockSchema.index({ hospitalName: 1, bloodGroup: 1 }, { unique: true });

const BloodStock = mongoose.model('BloodStock', bloodStockSchema);
export default BloodStock;
