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
      trim: true,
    },
    phone: {
      type: String,
      default: '',
      trim: true,
    },
    profilePic: {
      type: String,
      default: '',
    },
    lastLocation: {
      type: String,
      default: '',
      trim: true,
    },
    permanentLocation: {
      type: String,
      default: '',
      trim: true,
    },
    city: {
      type: String,
      default: '',
      trim: true,
    },
    address: {
      type: String,
      default: '',
      trim: true,
    },
    latitude: {
      type: Number,
      default: null,
    },
    longitude: {
      type: Number,
      default: null,
    },
    lastLocationUpdate: {
      type: Date,
      default: null,
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other', ''],
      default: '',
    },
    dateOfBirth: {
      type: Date,
      default: null,
    },
    age: {
      type: Number,
      default: null,
    },
    weight: {
      type: Number,
      default: null,
    },
    emergencyContact: {
      type: String,
      default: '',
      trim: true,
    },
    lastDonationDate: {
      type: Date,
      default: null,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    totalDonations: {
      type: Number,
      default: 0,
    },
    isProfileSet: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: 'donors',
  }
);

const Donor = mongoose.model('Donor', donorSchema);
export default Donor;
