const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
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
      enum: ['DONOR', 'HOSPITAL', 'ADMIN'],
      default: 'DONOR',
    },
    phone: {
      type: String,
      default: '',
    },
    city: {
      type: String,
      default: 'City Central',
    },
    address: {
      type: String,
      default: '',
    },
    location: {
      lat: { type: Number, default: 30.901 },
      lng: { type: Number, default: 75.857 },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
