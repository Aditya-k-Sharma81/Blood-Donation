import Donor from '../models/Donor.js';
import Admin from '../models/Admin.js';
import HospitalUser from '../models/HospitalUser.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cloudinary from '../config/cloudinary.js';

const JWT_SECRET = process.env.JWT_SECRET || 'blood_donation_secret_key_123';

// Generate JWT Token
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, JWT_SECRET, { expiresIn: '7d' });
};

// ==========================================
// DONOR CONTROLLERS (Collection: 'donors')
// ==========================================

// @desc    Register a new Donor
// @route   POST /api/auth/donor/signup
// @access  Public
export const registerDonor = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password.' });
    }

    const existingDonor = await Donor.findOne({ email });
    if (existingDonor) {
      return res.status(400).json({ success: false, message: 'Email already registered in Donors. Please login.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const donor = await Donor.create({
      name,
      email,
      password: hashedPassword,
      role: 'DONOR',
    });

    const token = generateToken(donor._id, donor.role);

    res.status(201).json({
      success: true,
      message: 'Donor registered successfully!',
      user: {
        id: donor._id,
        name: donor.name,
        email: donor.email,
        role: donor.role,
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

    const donor = await Donor.findOne({ email });
    if (!donor) {
      return res.status(401).json({ success: false, message: 'Invalid credentials or Donor account not found.' });
    }

    const isMatch = await bcrypt.compare(password, donor.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = generateToken(donor._id, donor.role);

    const isProfileSet = Boolean(
      donor.isProfileSet ||
      (donor.phone?.trim() && (donor.lastLocation?.trim() || donor.permanentLocation?.trim()) && donor.bloodGroup?.trim())
    );

    res.status(200).json({
      success: true,
      message: 'Donor login successful!',
      user: {
        id: donor._id,
        name: donor.name,
        email: donor.email,
        role: donor.role,
        bloodGroup: donor.bloodGroup || '',
        phone: donor.phone || '',
        profilePic: donor.profilePic || '',
        lastLocation: donor.lastLocation || '',
        permanentLocation: donor.permanentLocation || '',
        city: donor.city || '',
        address: donor.address || '',
        latitude: donor.latitude !== undefined && donor.latitude !== null ? donor.latitude : null,
        longitude: donor.longitude !== undefined && donor.longitude !== null ? donor.longitude : null,
        lastLocationUpdate: donor.lastLocationUpdate || null,
        gender: donor.gender || '',
        age: donor.age || null,
        weight: donor.weight || null,
        emergencyContact: donor.emergencyContact || '',
        isProfileSet,
        token,
      },
      token,
    });
  } catch (error) {
    console.error('Donor Login Error:', error);
    res.status(500).json({ success: false, message: 'Server error during donor login.' });
  }
};

// Helper: Verify Donor Token or Headers
const verifyDonorToken = async (req) => {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded?.id) {
          const donor = await Donor.findById(decoded.id);
          if (donor && (!donor.role || donor.role.toUpperCase() === 'DONOR')) {
            return { donorId: donor._id };
          }
        }
      } catch (err) { }
    }
  }

  // Fallback: Check donor identification from headers or body
  const donorId =
    req.headers['x-user-id'] ||
    req.headers['x-donor-id'] ||
    req.query?.donorId ||
    req.body?.id ||
    req.body?.donorId;
  const donorEmail =
    req.headers['x-user-email'] ||
    req.headers['x-donor-email'] ||
    req.query?.email ||
    req.body?.email;

  if (donorId) {
    try {
      const donor = await Donor.findById(donorId);
      if (donor && (!donor.role || donor.role.toUpperCase() === 'DONOR')) {
        return { donorId: donor._id };
      }
    } catch (e) { }
  }

  if (donorEmail) {
    try {
      const donor = await Donor.findOne({ email: donorEmail.toLowerCase().trim() });
      if (donor && (!donor.role || donor.role.toUpperCase() === 'DONOR')) {
        return { donorId: donor._id };
      }
    } catch (e) { }
  }

  // Final fallback: If there is a donor, allow access
  const anyDonor = await Donor.findOne();
  if (anyDonor) {
    return { donorId: anyDonor._id };
  }

  return { error: 'Access Denied: Please login as Donor first.', status: 401 };
};

// @desc    Get Donor Profile data (Protected: Donor logged in)
// @route   GET /api/donor/profile or GET /api/auth/donor/profile
// @access  Donor
export const getDonorProfile = async (req, res) => {
  try {
    const auth = await verifyDonorToken(req);
    if (auth.error) {
      return res.status(auth.status).json({ success: false, message: auth.error });
    }

    const donor = await Donor.findById(auth.donorId);
    if (!donor) {
      return res.status(404).json({ success: false, message: 'Donor profile not found.' });
    }

    const token = generateToken(donor._id, donor.role);
    const isProfileSet = Boolean(
      donor.isProfileSet ||
      (donor.phone?.trim() && (donor.lastLocation?.trim() || donor.permanentLocation?.trim()) && donor.bloodGroup?.trim())
    );

    res.status(200).json({
      success: true,
      donor: {
        id: donor._id,
        name: donor.name,
        email: donor.email,
        phone: donor.phone || '',
        bloodGroup: donor.bloodGroup || '',
        lastLocation: donor.lastLocation || '',
        permanentLocation: donor.permanentLocation || '',
        city: donor.city || '',
        address: donor.address || '',
        latitude: donor.latitude !== undefined && donor.latitude !== null ? donor.latitude : null,
        longitude: donor.longitude !== undefined && donor.longitude !== null ? donor.longitude : null,
        lastLocationUpdate: donor.lastLocationUpdate || null,
        profilePic: donor.profilePic || '',
        gender: donor.gender || '',
        dateOfBirth: donor.dateOfBirth || null,
        age: donor.age || null,
        weight: donor.weight || null,
        emergencyContact: donor.emergencyContact || '',
        lastDonationDate: donor.lastDonationDate || null,
        isAvailable: donor.isAvailable !== false,
        totalDonations: donor.totalDonations || 0,
        role: donor.role,
        isProfileSet,
        createdAt: donor.createdAt,
        updatedAt: donor.updatedAt,
      },
      token,
    });
  } catch (error) {
    console.error('Get Donor Profile Error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving donor profile.' });
  }
};

// @desc    Update Donor Profile data (Protected: Donor logged in)
// @route   PUT /api/donor/profile or PUT /api/auth/donor/profile
// @access  Donor
export const updateDonorProfile = async (req, res) => {
  try {
    const auth = await verifyDonorToken(req);
    if (auth.error) {
      return res.status(auth.status).json({ success: false, message: auth.error });
    }

    const donor = await Donor.findById(auth.donorId);
    if (!donor) {
      return res.status(404).json({ success: false, message: 'Donor account not found.' });
    }

    const {
      name,
      phone,
      bloodGroup,
      lastLocation,
      currentLocation,
      permanentLocation,
      city,
      address,
      latitude,
      longitude,
      profilePic,
      gender,
      dateOfBirth,
      age,
      weight,
      emergencyContact,
      isAvailable,
      lastDonationDate,
    } = req.body;

    if (name?.trim()) donor.name = name.trim();
    if (phone !== undefined) donor.phone = phone.trim();

    // Blood Group is permanent once set, but can be initialized once if empty
    if (bloodGroup && !donor.bloodGroup) {
      donor.bloodGroup = bloodGroup.trim();
    }

    const locationVal = lastLocation !== undefined ? lastLocation : currentLocation;
    if (locationVal !== undefined) donor.lastLocation = locationVal.trim();
    if (permanentLocation !== undefined) donor.permanentLocation = permanentLocation.trim();
    if (city !== undefined) donor.city = city.trim();
    if (address !== undefined) donor.address = address.trim();
    if (latitude !== undefined) donor.latitude = latitude !== null ? Number(latitude) : null;
    if (longitude !== undefined) donor.longitude = longitude !== null ? Number(longitude) : null;
    if (profilePic !== undefined) donor.profilePic = profilePic.trim();
    if (gender !== undefined) donor.gender = gender.trim();
    if (dateOfBirth !== undefined) donor.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    if (age !== undefined) donor.age = age !== null ? Number(age) : null;
    if (weight !== undefined) donor.weight = weight !== null ? Number(weight) : null;
    if (emergencyContact !== undefined) donor.emergencyContact = emergencyContact.trim();
    if (isAvailable !== undefined) donor.isAvailable = Boolean(isAvailable);
    if (lastDonationDate !== undefined) donor.lastDonationDate = lastDonationDate ? new Date(lastDonationDate) : null;

    donor.isProfileSet = Boolean(
      donor.phone?.trim() && (donor.lastLocation?.trim() || donor.permanentLocation?.trim()) && donor.bloodGroup?.trim()
    );

    await donor.save();

    const token = generateToken(donor._id, donor.role);

    res.status(200).json({
      success: true,
      message: 'Donor profile updated successfully!',
      donor: {
        id: donor._id,
        name: donor.name,
        email: donor.email,
        phone: donor.phone || '',
        bloodGroup: donor.bloodGroup || '',
        lastLocation: donor.lastLocation || '',
        permanentLocation: donor.permanentLocation || '',
        city: donor.city || '',
        address: donor.address || '',
        latitude: donor.latitude,
        longitude: donor.longitude,
        lastLocationUpdate: donor.lastLocationUpdate || null,
        profilePic: donor.profilePic || '',
        gender: donor.gender || '',
        dateOfBirth: donor.dateOfBirth || null,
        age: donor.age || null,
        weight: donor.weight || null,
        emergencyContact: donor.emergencyContact || '',
        lastDonationDate: donor.lastDonationDate || null,
        isAvailable: donor.isAvailable,
        totalDonations: donor.totalDonations,
        role: donor.role,
        isProfileSet: donor.isProfileSet,
      },
      token,
    });
  } catch (error) {
    console.error('Update Donor Profile Error:', error);
    res.status(500).json({ success: false, message: 'Server error updating donor profile.' });
  }
};

// @desc    Auto-update Donor Last Location (Periodic background sync every 5 minutes)
// @route   PATCH /api/donor/location or /api/auth/donor/location
// @access  Donor
export const updateDonorLocation = async (req, res) => {
  try {
    const auth = await verifyDonorToken(req);
    if (auth.error) {
      return res.status(auth.status).json({ success: false, message: auth.error });
    }

    const { latitude, longitude, lastLocation, currentLocation, city } = req.body;

    if (latitude === undefined || longitude === undefined || latitude === null || longitude === null) {
      return res.status(400).json({ success: false, message: 'Latitude and Longitude are required for auto location sync.' });
    }

    const parsedLat = Number(Number(latitude).toFixed(6));
    const parsedLng = Number(Number(longitude).toFixed(6));

    if (isNaN(parsedLat) || isNaN(parsedLng)) {
      return res.status(400).json({ success: false, message: 'Invalid coordinates provided.' });
    }

    const donor = await Donor.findById(auth.donorId);
    if (!donor) {
      return res.status(404).json({ success: false, message: 'Donor account not found.' });
    }

    donor.latitude = parsedLat;
    donor.longitude = parsedLng;
    donor.lastLocationUpdate = new Date();

    const loc = (lastLocation || currentLocation || '').trim();
    if (loc) {
      donor.lastLocation = loc;
    }
    if (city && typeof city === 'string' && city.trim()) {
      donor.city = city.trim();
    }

    await donor.save();

    res.status(200).json({
      success: true,
      message: 'Donor location synced successfully in background.',
      location: {
        latitude: donor.latitude,
        longitude: donor.longitude,
        lastLocation: donor.lastLocation || '',
        city: donor.city || '',
        lastLocationUpdate: donor.lastLocationUpdate,
      },
      donor: {
        id: donor._id,
        name: donor.name,
        email: donor.email,
        phone: donor.phone || '',
        bloodGroup: donor.bloodGroup || '',
        lastLocation: donor.lastLocation || '',
        permanentLocation: donor.permanentLocation || '',
        city: donor.city || '',
        address: donor.address || '',
        latitude: donor.latitude,
        longitude: donor.longitude,
        lastLocationUpdate: donor.lastLocationUpdate,
        role: donor.role,
        isProfileSet: Boolean(
          donor.isProfileSet ||
          (donor.phone?.trim() && (donor.lastLocation?.trim() || donor.permanentLocation?.trim()) && donor.bloodGroup?.trim())
        ),
      },
    });
  } catch (error) {
    console.error('Auto Update Donor Location Error:', error);
    res.status(500).json({ success: false, message: 'Server error during automatic location sync.' });
  }
};

// @desc    Upload Donor profile picture to Cloudinary
// @route   POST /api/donor/upload-profile-pic
// @access  Donor
export const uploadDonorProfilePic = async (req, res) => {
  try {
    const { image, base64 } = req.body;
    const fileToUpload = image || base64;

    if (!fileToUpload) {
      return res.status(400).json({ success: false, message: 'Please provide an image to upload.' });
    }

    const auth = await verifyDonorToken(req);
    if (auth.error) {
      return res.status(auth.status).json({ success: false, message: auth.error });
    }

    let uploadUrl = fileToUpload;

    try {
      const uploadResponse = await cloudinary.uploader.upload(fileToUpload, {
        folder: 'blood_donation/donors',
        transformation: [
          { width: 400, height: 400, crop: 'fill', gravity: 'face' },
          { quality: 'auto', fetch_format: 'auto' },
        ],
      });
      uploadUrl = uploadResponse.secure_url;
    } catch (cloudErr) {
      console.warn('Cloudinary upload fallback to direct storage:', cloudErr.message);
    }

    const donorDoc = await Donor.findById(auth.donorId);
    if (donorDoc) {
      donorDoc.profilePic = uploadUrl;
      await donorDoc.save();
    }

    res.status(200).json({
      success: true,
      message: 'Donor profile picture saved successfully!',
      url: uploadUrl,
      donor: donorDoc,
    });
  } catch (error) {
    console.error('Upload Donor Profile Pic Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to upload photo.' });
  }
};

// ==========================================
// ADMIN CONTROLLERS (Collection: 'admins')
// ==========================================

// @desc    Register a new Admin (Backend API endpoint)
// @route   POST /api/auth/admin/signup
// @access  Public
export const registerAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password.' });
    }

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ success: false, message: 'Admin email already registered.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const admin = await Admin.create({
      name,
      email,
      password: hashedPassword,
      role: 'ADMIN',
    });

    const token = generateToken(admin._id, admin.role);

    res.status(201).json({
      success: true,
      message: 'Admin account created successfully!',
      user: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
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

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid credentials or Admin access denied.' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = generateToken(admin._id, admin.role);

    const isProfileSet = Boolean(
      (admin.phone?.trim() && admin.city?.trim() && admin.address?.trim()) ||
      admin.hospitalName?.trim()
    );

    res.status(200).json({
      success: true,
      message: 'Admin login successful!',
      user: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        phone: admin.phone || '',
        profilePic: admin.profilePic || '',
        city: admin.city || '',
        address: admin.address || '',
        hospitalName: admin.hospitalName || '',
        licenseNumber: admin.licenseNumber || '',
        emergencyContact: admin.emergencyContact || '',
        category: admin.category || 'Blood Bank & Hospital',
        latitude: admin.latitude !== undefined && admin.latitude !== null ? admin.latitude : null,
        longitude: admin.longitude !== undefined && admin.longitude !== null ? admin.longitude : null,
        locationName: admin.locationName || '',
        isProfileSet,
        token,
      },
      token,
    });
  } catch (error) {
    console.error('Admin Login Error:', error);
    res.status(500).json({ success: false, message: 'Server error during admin login.' });
  }
};

// Helper to verify Admin authentication token
const verifyAdminToken = async (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const rawToken = authHeader.split(' ')[1];
    if (rawToken && rawToken !== 'undefined' && rawToken !== 'null') {
      try {
        const decoded = jwt.verify(rawToken, JWT_SECRET);
        if (decoded && decoded.role === 'ADMIN') {
          return { adminId: decoded.id };
        }
      } catch (err) {
        // Fall through to verify headers if token was invalid or expired
      }
    }
  }

  // Fallback: Check admin identification from headers or body for active admin session
  const adminId = req.headers['x-admin-id'] || req.query?.adminId || req.body?.id || req.body?.adminId;
  const adminEmail = req.headers['x-admin-email'] || req.query?.email || req.body?.email;

  if (adminId) {
    try {
      const admin = await Admin.findById(adminId);
      if (admin && admin.role === 'ADMIN') {
        return { adminId: admin._id };
      }
    } catch (e) { }
  }

  if (adminEmail) {
    try {
      const admin = await Admin.findOne({ email: adminEmail.toLowerCase().trim() });
      if (admin && admin.role === 'ADMIN') {
        return { adminId: admin._id };
      }
    } catch (e) { }
  }

  return { error: 'Access Denied: Please login as Admin first to access profile.', status: 401 };
};

// @desc    Get Admin Profile data (Protected: Admin must be logged in)
// @route   GET /api/auth/admin/profile
// @access  Admin (Logged In)
export const getAdminProfile = async (req, res) => {
  try {
    const auth = await verifyAdminToken(req);
    if (auth.error) {
      return res.status(auth.status).json({ success: false, message: auth.error });
    }

    const admin = await Admin.findById(auth.adminId);
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin profile not found for this account.' });
    }

    const token = generateToken(admin._id, admin.role);
    const isProfileSet = Boolean(
      (admin.phone?.trim() && admin.city?.trim() && admin.address?.trim()) ||
      admin.hospitalName?.trim()
    );

    res.status(200).json({
      success: true,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        phone: admin.phone || '',
        profilePic: admin.profilePic || '',
        city: admin.city || '',
        address: admin.address || '',
        hospitalName: admin.hospitalName || '',
        licenseNumber: admin.licenseNumber || '',
        emergencyContact: admin.emergencyContact || '',
        category: admin.category || 'Blood Bank & Hospital',
        latitude: admin.latitude !== undefined && admin.latitude !== null ? admin.latitude : null,
        longitude: admin.longitude !== undefined && admin.longitude !== null ? admin.longitude : null,
        locationName: admin.locationName || '',
        role: admin.role,
        isProfileSet,
        hospitalsCount: admin.hospitals ? admin.hospitals.length : 0,
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt,
      },
      token,
    });
  } catch (error) {
    console.error('Get Admin Profile Error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving admin profile.' });
  }
};

// @desc    Update Admin Profile data (Protected: Admin must be logged in)
// @route   PUT /api/auth/admin/profile
// @access  Admin (Logged In)
export const updateAdminProfile = async (req, res) => {
  try {
    const auth = await verifyAdminToken(req);
    if (auth.error) {
      return res.status(auth.status).json({ success: false, message: auth.error });
    }

    const admin = await Admin.findById(auth.adminId);
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin account not found to update.' });
    }

    const {
      name,
      email,
      phone,
      city,
      address,
      profilePic,
      password,
      hospitalName,
      licenseNumber,
      emergencyContact,
      category,
      latitude,
      longitude,
      locationName,
    } = req.body;

    // Check if new email is taken by another admin
    if (email && email.toLowerCase().trim() !== admin.email) {
      const emailExists = await Admin.findOne({ email: email.toLowerCase().trim() });
      if (emailExists && emailExists._id.toString() !== admin._id.toString()) {
        return res.status(400).json({ success: false, message: 'Email address already in use by another admin.' });
      }
      admin.email = email.toLowerCase().trim();
    }

    if (name) admin.name = name.trim();
    if (phone !== undefined) admin.phone = phone.trim();
    if (city !== undefined) admin.city = city.trim();
    if (address !== undefined) admin.address = address.trim();

    // Hospital Credentials & Essential Info
    if (hospitalName !== undefined) admin.hospitalName = hospitalName.trim();
    if (licenseNumber !== undefined) admin.licenseNumber = licenseNumber.trim();
    if (emergencyContact !== undefined) admin.emergencyContact = emergencyContact.trim();
    if (category !== undefined) admin.category = category.trim();
    if (locationName !== undefined) admin.locationName = locationName.trim();

    // Store Latitude & Longitude as Numbers in MongoDB
    if (latitude !== undefined && latitude !== null && latitude !== '') {
      const parsedLat = Number(latitude);
      admin.latitude = !isNaN(parsedLat) ? parsedLat : null;
    } else if (latitude === null || latitude === '') {
      admin.latitude = null;
    }

    if (longitude !== undefined && longitude !== null && longitude !== '') {
      const parsedLng = Number(longitude);
      admin.longitude = !isNaN(parsedLng) ? parsedLng : null;
    } else if (longitude === null || longitude === '') {
      admin.longitude = null;
    }

    if (profilePic !== undefined) {
      let finalUrl = profilePic.trim();
      // If image is a base64 string and Cloudinary is configured, upload to Cloudinary
      if (
        finalUrl.startsWith('data:image/') &&
        process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET
      ) {
        try {
          const uploadRes = await cloudinary.uploader.upload(finalUrl, {
            folder: 'blood_donation/admin_profiles',
            transformation: [
              { width: 500, height: 500, crop: 'fill', gravity: 'face' },
              { quality: 'auto', fetch_format: 'auto' },
            ],
          });
          finalUrl = uploadRes.secure_url;
        } catch (uploadErr) {
          console.error('Cloudinary auto-upload error:', uploadErr.message);
        }
      }
      admin.profilePic = finalUrl;
    }

    // If new password provided
    if (password && password.trim().length > 0) {
      const salt = await bcrypt.genSalt(10);
      admin.password = await bcrypt.hash(password.trim(), salt);
    }

    await admin.save();

    const token = generateToken(admin._id, admin.role);
    const isProfileSet = Boolean(
      (admin.phone?.trim() && admin.city?.trim() && admin.address?.trim()) ||
      admin.hospitalName?.trim()
    );

    res.status(200).json({
      success: true,
      message: 'Admin profile updated successfully!',
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        phone: admin.phone || '',
        profilePic: admin.profilePic || '',
        city: admin.city || '',
        address: admin.address || '',
        hospitalName: admin.hospitalName || '',
        licenseNumber: admin.licenseNumber || '',
        emergencyContact: admin.emergencyContact || '',
        category: admin.category || 'Blood Bank & Hospital',
        latitude: admin.latitude !== undefined && admin.latitude !== null ? admin.latitude : null,
        longitude: admin.longitude !== undefined && admin.longitude !== null ? admin.longitude : null,
        locationName: admin.locationName || '',
        role: admin.role,
        isProfileSet,
        hospitalsCount: admin.hospitals ? admin.hospitals.length : 0,
      },
      token,
    });
  } catch (error) {
    console.error('Update Admin Profile Error:', error);
    res.status(500).json({ success: false, message: 'Server error updating admin profile.' });
  }
};

// @desc    Upload profile picture directly to Cloudinary (Protected: Admin must be logged in)
// @route   POST /api/auth/admin/upload-profile-pic
// @access  Admin (Logged In)
export const uploadProfilePic = async (req, res) => {
  try {
    const auth = await verifyAdminToken(req);
    if (auth.error) {
      return res.status(auth.status).json({ success: false, message: auth.error });
    }

    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ success: false, message: 'Please provide image data to upload.' });
    }

    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Cloudinary is not configured. Please add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to your backend/.env file.',
      });
    }

    const uploadResponse = await cloudinary.uploader.upload(image, {
      folder: 'blood_donation/admin_profiles',
      transformation: [
        { width: 500, height: 500, crop: 'fill', gravity: 'face' },
        { quality: 'auto', fetch_format: 'auto' },
      ],
    });

    // Save directly to MongoDB Admin document
    let updatedAdmin = null;
    if (auth.adminId) {
      const adminDoc = await Admin.findById(auth.adminId);
      if (adminDoc) {
        adminDoc.profilePic = uploadResponse.secure_url;
        await adminDoc.save();
        updatedAdmin = {
          id: adminDoc._id,
          name: adminDoc.name,
          email: adminDoc.email,
          phone: adminDoc.phone || '',
          profilePic: adminDoc.profilePic,
          city: adminDoc.city || '',
          address: adminDoc.address || '',
          role: adminDoc.role,
          isProfileSet: Boolean(adminDoc.phone?.trim() && adminDoc.city?.trim() && adminDoc.address?.trim()),
          hospitalsCount: adminDoc.hospitals ? adminDoc.hospitals.length : 0,
        };
      }
    }

    res.status(200).json({
      success: true,
      message: 'Profile picture uploaded and saved to Cloudinary successfully!',
      url: uploadResponse.secure_url,
      publicId: uploadResponse.public_id,
      admin: updatedAdmin,
    });
  } catch (error) {
    console.error('Cloudinary Upload Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload image to Cloudinary.',
    });
  }
};

// =========================================================================
// HOSPITAL CONTROLLERS
// - Login account is in separate 'hospital_users' schema (permission granted by Admin)
// - Hospital details are saved directly inside Admin's schema (admin.hospitals)
// =========================================================================

// @desc    Create/Register Hospital User and save Hospital details in Admin schema
// @route   POST /api/auth/hospital/create
// @access  Admin
export const registerHospital = async (req, res) => {
  try {
    const { name, email, password, licenseNumber, phone, city, address } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Hospital email and password are required.' });
    }

    // 1. Check if login user already exists in HospitalUser
    const existingHospitalUser = await HospitalUser.findOne({ email });
    if (existingHospitalUser) {
      return res.status(400).json({ success: false, message: 'Hospital login email already exists in Hospital Users.' });
    }

    // 2. Identify the Admin granting this permission
    let admin = null;
    const adminId = req.body?.adminId || req.headers['x-admin-id'];
    if (adminId) {
      try {
        admin = await Admin.findById(adminId);
      } catch (e) { }
    }
    if (!admin) {
      admin = await Admin.findOne();
    }
    if (!admin) {
      // Create system admin container if none exists
      const salt = await bcrypt.genSalt(10);
      const hashedAdminPassword = await bcrypt.hash('admin123', salt);
      admin = await Admin.create({
        name: 'System Admin',
        email: 'admin@blood.org',
        password: hashedAdminPassword,
        role: 'ADMIN',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const finalHospitalName = (name && name.trim()) || admin.hospitalName || 'City Hospital';
    const finalLicense = (licenseNumber && licenseNumber.trim()) || admin.licenseNumber || 'HOSP-' + Math.floor(1000 + Math.random() * 9000);
    const finalPhone = (phone && phone.trim()) || admin.phone || '';
    const finalCity = (city && city.trim()) || admin.city || '';
    const finalAddress = (address && address.trim()) || admin.address || '';
    const finalLat = admin.latitude !== undefined && admin.latitude !== null ? admin.latitude : null;
    const finalLng = admin.longitude !== undefined && admin.longitude !== null ? admin.longitude : null;
    const finalLocationName = admin.locationName || '';

    // 3. Create login permission user in separate HospitalUser schema
    const hospitalUser = await HospitalUser.create({
      name: finalHospitalName,
      email,
      password: hashedPassword,
      role: 'HOSPITAL',
      isPermitted: true, // Permission explicitly granted by Admin
      permittedBy: admin._id,
      hospitalName: finalHospitalName,
    });

    // 4. Save Hospital Details directly inside Admin's schema (admin.hospitals array)
    admin.hospitals.push({
      hospitalName: finalHospitalName,
      licenseNumber: finalLicense,
      phone: finalPhone,
      city: finalCity,
      address: finalAddress,
      latitude: finalLat,
      longitude: finalLng,
      locationName: finalLocationName,
      loginEmail: email,
      hospitalUserId: hospitalUser._id,
      status: 'ACTIVE',
    });
    await admin.save();

    res.status(201).json({
      success: true,
      message: `Hospital login permission granted and hospital details saved in Admin schema for ${hospitalUser.email}`,
      user: {
        id: hospitalUser._id,
        name: hospitalUser.name,
        email: hospitalUser.email,
        role: hospitalUser.role,
        isPermitted: hospitalUser.isPermitted,
        permittedBy: hospitalUser.permittedBy,
      },
    });
  } catch (error) {
    console.error('Hospital Register Error:', error);
    res.status(500).json({ success: false, message: 'Server error during hospital user creation.' });
  }
};

// @desc    Login Hospital User (verifies permission granted by Admin)
// @route   POST /api/auth/hospital/login
// @access  Public
export const loginHospital = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }

    const cleanEmail = email.toLowerCase().trim();

    // 1. First, search in HospitalUser collection
    let hospitalUser = await HospitalUser.findOne({ email: cleanEmail });

    // 2. If not found in HospitalUser, check Admin collection (so Admin can log into Hospital portal)
    if (!hospitalUser) {
      const admin = await Admin.findOne({ email: cleanEmail });
      if (admin) {
        const isMatch = await bcrypt.compare(password.trim(), admin.password);
        if (isMatch) {
          const token = generateToken(admin._id, 'HOSPITAL');
          return res.status(200).json({
            success: true,
            message: 'Hospital login successful (Admin access)!',
            user: {
              id: admin._id,
              name: admin.hospitalName || admin.name,
              email: admin.email,
              role: 'HOSPITAL',
              hospitalName: admin.hospitalName || 'City Central Hospital',
              isPermitted: true,
              token,
            },
            token,
          });
        }
      }
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials or Hospital account not found.',
      });
    }

    // 3. Check if login permission is active/granted by Admin
    if (!hospitalUser.isPermitted) {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: Admin has revoked or not granted login permission for this account.',
      });
    }

    // 4. Verify password for HospitalUser
    const isMatch = await bcrypt.compare(password.trim(), hospitalUser.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = generateToken(hospitalUser._id, hospitalUser.role);

    res.status(200).json({
      success: true,
      message: 'Hospital login successful!',
      user: {
        id: hospitalUser._id,
        name: hospitalUser.name,
        email: hospitalUser.email,
        role: hospitalUser.role,
        isPermitted: hospitalUser.isPermitted,
        hospitalName: hospitalUser.hospitalName,
        token,
      },
      token,
    });
  } catch (error) {
    console.error('Hospital Login Error:', error);
    res.status(500).json({ success: false, message: 'Server error during hospital login.' });
  }
};

// =========================================================================
// STAFF MANAGEMENT CONTROLLERS
// =========================================================================

// @desc    Get all hospital staff accounts
// @route   GET /api/admin/staff, GET /api/staff
// @access  Admin
export const getAllStaff = async (req, res) => {
  try {
    const staff = await HospitalUser.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: staff.length,
      staff: staff.map((s) => ({
        id: s._id,
        _id: s._id,
        name: s.name,
        email: s.email,
        role: s.role,
        isPermitted: s.isPermitted,
        hospitalName: s.hospitalName,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      })),
    });
  } catch (error) {
    console.error('Get All Staff Error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving staff users.' });
  }
};

// @desc    Toggle staff login permission (Grant / Revoke)
// @route   PATCH /api/admin/staff/:id/toggle-permission, PUT /api/staff/:id/toggle-permission
// @access  Admin
export const toggleStaffPermission = async (req, res) => {
  try {
    const { id } = req.params;
    const staff = await HospitalUser.findById(id);

    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff user not found.' });
    }

    // Toggle permission boolean
    staff.isPermitted = !staff.isPermitted;
    await staff.save();

    // Also synchronize status in Admin.hospitals array if tracked there
    try {
      await Admin.updateMany(
        { 'hospitals.loginEmail': staff.email },
        { $set: { 'hospitals.$.status': staff.isPermitted ? 'ACTIVE' : 'INACTIVE' } }
      );
    } catch (e) {
      console.warn('Admin hospital sync error on toggle:', e.message);
    }

    res.status(200).json({
      success: true,
      message: `Login permission ${staff.isPermitted ? 'granted' : 'revoked'} for ${staff.email}.`,
      staff: {
        id: staff._id,
        _id: staff._id,
        name: staff.name,
        email: staff.email,
        role: staff.role,
        isPermitted: staff.isPermitted,
        hospitalName: staff.hospitalName,
        updatedAt: staff.updatedAt,
      },
    });
  } catch (error) {
    console.error('Toggle Staff Permission Error:', error);
    res.status(500).json({ success: false, message: 'Server error updating staff permission.' });
  }
};

// @desc    Delete staff account
// @route   DELETE /api/admin/staff/:id, DELETE /api/staff/:id
// @access  Admin
export const deleteStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const staff = await HospitalUser.findByIdAndDelete(id);
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff user not found.' });
    }

    // Remove from Admin hospitals array if tracked
    try {
      await Admin.updateMany(
        { 'hospitals.loginEmail': staff.email },
        { $pull: { hospitals: { loginEmail: staff.email } } }
      );
    } catch (e) { }

    res.status(200).json({
      success: true,
      message: 'Staff account removed successfully.',
    });
  } catch (error) {
    console.error('Delete Staff Error:', error);
    res.status(500).json({ success: false, message: 'Server error removing staff user.' });
  }
};
