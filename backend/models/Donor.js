import mongoose from 'mongoose';

const donorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Donor name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
    },
    role: {
      type: String,
      default: 'DONOR',
    },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-', ''],
      default: '',
    },
    phone: {
      type: String,
      default: '',
    },
    city: {
      type: String,
      default: '',
    },
    address: {
      type: String,
      default: '',
    },
    lastDonationDate: {
      type: Date,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    totalDonations: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    collection: 'donors',
  }
);

const Donor = mongoose.model('Donor', donorSchema);
export default Donor;
