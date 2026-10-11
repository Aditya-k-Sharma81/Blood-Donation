import mongoose from 'mongoose';

/**
 * Dedicated schema for Hospital Users who are given login permission by Admin.
 * Collection: 'hospital_users'
 */
const hospitalUserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Staff / User name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Hospital login email is required'],
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
      default: 'HOSPITAL',
    },
    isPermitted: {
      type: Boolean,
      default: true, // Permission granted by Admin
    },
    permittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
    },
    hospitalName: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
    collection: 'hospital_users',
  }
);

const HospitalUser = mongoose.model('HospitalUser', hospitalUserSchema);
export default HospitalUser;
