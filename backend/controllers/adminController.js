const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Hospital = require('../models/Hospital');
const Donor = require('../models/Donor');
const BloodRequest = require('../models/BloodRequest');

// @desc    Admin creates a Hospital User Access Account (Exclusive Admin Feature)
// @route   POST /api/admin/create-hospital
// @access  Private (Admin Only)
const createHospitalUser = async (req, res) => {
  try {
    const { email, password, name, hospitalName, licenseNumber, city, address, lat, lng } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required to create hospital access' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ message: 'A user account with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create User with HOSPITAL role
    const hospitalUser = await User.create({
      name: name || hospitalName || 'Hospital Staff',
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: 'HOSPITAL',
      city: city || 'City Central',
      address: address || 'Medical District',
      location: {
        lat: Number(lat) || 30.901,
        lng: Number(lng) || 75.857,
      },
    });

    // Create associated Hospital Profile with initial inventory stock gauges
    const hospitalProfile = await Hospital.create({
      userId: hospitalUser._id,
      hospitalName: hospitalName || name || 'Central Hospital Node',
      licenseNumber: licenseNumber || `HOSP-${Math.floor(1000 + Math.random() * 9000)}-VERIFIED`,
      location: {
        lat: Number(lat) || 30.901,
        lng: Number(lng) || 75.857,
      },
      inventory: [
        { bloodGroup: 'A+', units: 20 },
        { bloodGroup: 'A-', units: 8 },
        { bloodGroup: 'B+', units: 18 },
        { bloodGroup: 'B-', units: 6 },
        { bloodGroup: 'O+', units: 25 },
        { bloodGroup: 'O-', units: 5 },
        { bloodGroup: 'AB+', units: 12 },
        { bloodGroup: 'AB-', units: 4 },
      ],
    });

    res.status(201).json({
      success: true,
      message: `Hospital user account '${email}' created successfully!`,
      hospitalUser: {
        id: hospitalUser._id,
        name: hospitalUser.name,
        email: hospitalUser.email,
        role: hospitalUser.role,
        profile: hospitalProfile,
      },
    });
  } catch (error) {
    console.error('Error creating hospital user:', error);
    res.status(500).json({ message: error.message || 'Failed to create hospital user access' });
  }
};

// @desc    Get system overview analytics & lists
// @route   GET /api/admin/dashboard
// @access  Private (Admin Only)
const getAdminStats = async (req, res) => {
  try {
    const totalDonors = await Donor.countDocuments();
    const totalHospitals = await Hospital.countDocuments();
    const activeRequests = await BloodRequest.countDocuments({ status: 'ACTIVE' });
    const totalUsers = await User.countDocuments();

    const hospitals = await Hospital.find().populate('userId', 'name email city createdAt');
    const donors = await Donor.find().populate('userId', 'name email city createdAt');
    const users = await User.find().select('-password').sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      stats: {
        totalDonors,
        totalHospitals,
        activeRequests,
        totalUsers,
      },
      hospitals,
      donors,
      users,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to load admin stats' });
  }
};

// @desc    Delete a User Account
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin Only)
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'ADMIN') {
      return res.status(400).json({ message: 'Cannot delete admin account' });
    }

    if (user.role === 'HOSPITAL') {
      await Hospital.deleteMany({ userId: user._id });
    } else if (user.role === 'DONOR') {
      await Donor.deleteMany({ userId: user._id });
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, message: 'User account removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to delete user' });
  }
};

module.exports = {
  createHospitalUser,
  getAdminStats,
  deleteUser,
};
