import mongoose from 'mongoose';

// Sub-schema for Hospital Details managed and saved directly under Admin
const hospitalDetailSchema = new mongoose.Schema(
  {
    hospitalName: {
      type: String,
      required: [true, 'Hospital name is required'],
      trim: true,
    },
    licenseNumber: {
      type: String,
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
    latitude: {
      type: Number,
      default: null,
    },
    longitude: {
      type: Number,
      default: null,
    },
    locationName: {
      type: String,
      default: '',
    },
    loginEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    hospitalUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HospitalUser',
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'PENDING'],
      default: 'ACTIVE',
    },
  },
  {
    timestamps: true,
  }
);

const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Admin name is required'],
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
      default: 'ADMIN',
    },
    phone: {
      type: String,
      default: '',
    },
    profilePic: {
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
    // Admin Hospital Details & Essential Credentials
    hospitalName: {
      type: String,
      default: '',
      trim: true,
    },
    licenseNumber: {
      type: String,
      default: '',
      trim: true,
    },
    emergencyContact: {
      type: String,
      default: '',
      trim: true,
    },
    category: {
      type: String,
      default: 'Blood Bank & Hospital',
      trim: true,
    },
    // Geographic Location Coordinates (Numbers stored in DB)
    latitude: {
      type: Number,
      default: null,
    },
    longitude: {
      type: Number,
      default: null,
    },
    locationName: {
      type: String,
      default: '',
      trim: true,
    },
    // Hospital details saved and managed in Admin schema
    hospitals: [hospitalDetailSchema],
  },
  {
    timestamps: true,
    collection: 'admins',
  }
);

const Admin = mongoose.model('Admin', adminSchema);
export default Admin;
