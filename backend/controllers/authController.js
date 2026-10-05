import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'blood_donation_secret_key_123';

// Generate JWT Token
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, JWT_SECRET, { expiresIn: '7d' });
};

// @desc    Register a new Donor
// @route   POST /api/auth/donor/signup
// @access  Public
export const registerDonor = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password.' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered. Please login.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'DONOR',
    });

    const token = generateToken(user._id, user.role);

    res.status(201).json({
      success: true,
      message: 'Donor registered successfully!',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error('Donor Register Error:', error);
    res.status(500).json({ success: false, message: 'Server error during donor registration.' });
  }
};

// @desc    Login Donor
// @route   POST /api/auth/donor/login
// @access  Public
export const loginDonor = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }

    const user = await User.findOne({ email, role: 'DONOR' });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials or Donor account not found.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = generateToken(user._id, user.role);

    res.status(200).json({
      success: true,
      message: 'Donor login successful!',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error('Donor Login Error:', error);
    res.status(500).json({ success: false, message: 'Server error during donor login.' });
  }
};

// @desc    Register a new Admin
// @route   POST /api/auth/admin/signup
// @access  Public
export const registerAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password.' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'ADMIN',
    });

    const token = generateToken(user._id, user.role);

    res.status(201).json({
      success: true,
      message: 'Admin account created successfully!',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error('Admin Register Error:', error);
    res.status(500).json({ success: false, message: 'Server error during admin registration.' });
  }
};

// @desc    Login Admin
// @route   POST /api/auth/admin/login
// @access  Public
export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }

    let user = await User.findOne({ email });
    
    // Auto-seed default admin if login attempt with admin@blood.org / admin123
    if (!user && email === 'admin@blood.org') {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      user = await User.create({
        name: 'System Admin',
        email: 'admin@blood.org',
        password: hashedPassword,
        role: 'ADMIN',
      });
    }

    if (!user || user.role !== 'ADMIN') {
      return res.status(401).json({ success: false, message: 'Invalid credentials or Admin access denied.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = generateToken(user._id, user.role);

    res.status(200).json({
      success: true,
      message: 'Admin login successful!',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error('Admin Login Error:', error);
    res.status(500).json({ success: false, message: 'Server error during admin login.' });
  }
};

// @desc    Create/Register Hospital User (Admin operation)
// @route   POST /api/auth/hospital/create
// @access  Admin
export const registerHospital = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Hospital email and password are required.' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Hospital email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const hospitalUser = await User.create({
      name: name || 'City Hospital',
      email,
      password: hashedPassword,
      role: 'HOSPITAL',
    });

    res.status(201).json({
      success: true,
      message: `Hospital access user created for ${hospitalUser.email}`,
      user: {
        id: hospitalUser._id,
        name: hospitalUser.name,
        email: hospitalUser.email,
        role: hospitalUser.role,
      },
    });
  } catch (error) {
    console.error('Hospital Register Error:', error);
    res.status(500).json({ success: false, message: 'Server error during hospital user creation.' });
  }
};

// @desc    Login Hospital User
// @route   POST /api/auth/hospital/login
// @access  Public
export const loginHospital = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }

    const user = await User.findOne({ email, role: 'HOSPITAL' });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials or Hospital account not found.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = generateToken(user._id, user.role);

    res.status(200).json({
      success: true,
      message: 'Hospital login successful!',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error('Hospital Login Error:', error);
    res.status(500).json({ success: false, message: 'Server error during hospital login.' });
  }
};
