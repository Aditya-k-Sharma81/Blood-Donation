const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Donor = require('../models/Donor');
const Hospital = require('../models/Hospital');
const { generateToken } = require('../utils/jwt');

// @desc    Register a new Voluntary Donor (Route '/')
// @route   POST /api/auth/donor/signup
// @access  Public
const donorSignup = async (req, res) => {
  try {
    const { name, email, password, bloodGroup, phone, city } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required for donor registration' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: 'DONOR',
      phone: phone || '',
      city: city || 'City Central',
    });

    const donorProfile = await Donor.create({
      userId: user._id,
      bloodGroup: bloodGroup || 'O+',
      isAvailable: true,
      lastDonationDate: null,
      nextEligibleDate: new Date(),
    });

    const token = generateToken(user);

    // Save token & user in session
    if (req.session) {
      req.session.token = token;
      req.session.userId = user._id;
      req.session.role = user.role;
    }

    res.status(201).json({
      success: true,
      message: 'Donor registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profile: donorProfile,
      },
    });
  } catch (error) {
    console.error('Donor signup error:', error);
    res.status(500).json({ message: error.message || 'Server error during donor registration' });
  }
};

// @desc    Unified / Role-Specific Login (For Donor /, Admin /admin/login, Hospital /hospital/login)
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password, expectedRole } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Role check if expectedRole is passed by specific portal
    if (expectedRole && user.role !== expectedRole.toUpperCase()) {
      return res.status(403).json({
        message: `Access denied. This account has role '${user.role}', but expected '${expectedRole.toUpperCase()}'.`,
      });
    }

    const token = generateToken(user);

    // Set session
    if (req.session) {
      req.session.token = token;
      req.session.userId = user._id;
      req.session.role = user.role;
    }

    let profileData = null;
    if (user.role === 'DONOR') {
      profileData = await Donor.findOne({ userId: user._id });
    } else if (user.role === 'HOSPITAL') {
      profileData = await Hospital.findOne({ userId: user._id });
    }

    res.status(200).json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profile: profileData,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message || 'Server error during login' });
  }
};

// @desc    Get Current Logged in User
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    let profile = null;

    if (user.role === 'DONOR') {
      profile = await Donor.findOne({ userId: user._id });
    } else if (user.role === 'HOSPITAL') {
      profile = await Hospital.findOne({ userId: user._id });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        city: user.city,
        profile,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch user data' });
  }
};

// @desc    Logout User & Destroy Session
// @route   POST /api/auth/logout
// @access  Public
const logout = (req, res) => {
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: 'Could not log out, please try again' });
      }
      res.clearCookie('connect.sid');
      return res.status(200).json({ success: true, message: 'Logged out successfully' });
    });
  } else {
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  }
};

module.exports = {
  donorSignup,
  login,
  getMe,
  logout,
};
