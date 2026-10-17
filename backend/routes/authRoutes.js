import express from 'express';
import {
  registerDonor,
  loginDonor,
  getDonorProfile,
  updateDonorProfile,
  updateDonorLocation,
  uploadDonorProfilePic,
  registerAdmin,
  loginAdmin,
  getAdminProfile,
  updateAdminProfile,
  uploadProfilePic,
  registerHospital,
  loginHospital,
  getAllStaff,
  toggleStaffPermission,
  deleteStaff,
} from '../controllers/authController.js';

const router = express.Router();

// Donor Routes
router.post('/donor/signup', registerDonor);
router.post('/donor/login', loginDonor);
router.get('/donor/profile', getDonorProfile);
router.put('/donor/profile', updateDonorProfile);
router.patch('/donor/location', updateDonorLocation);
router.put('/donor/location', updateDonorLocation);
router.post('/donor/location', updateDonorLocation);
router.post('/donor/upload-profile-pic', uploadDonorProfilePic);

// Admin Routes
router.post('/admin/signup', registerAdmin);
router.post('/admin/register', registerAdmin);
router.post('/admin/login', loginAdmin);
router.get('/admin/profile', getAdminProfile);
router.put('/admin/profile', updateAdminProfile);
router.post('/admin/upload-profile-pic', uploadProfilePic);

// Hospital Routes
router.post('/hospital/create', registerHospital);
router.post('/hospital/login', loginHospital);

// Staff Management Routes (/admin/staff and /staff)
router.get('/admin/staff', getAllStaff);
router.get('/staff', getAllStaff);
router.patch('/admin/staff/:id/toggle-permission', toggleStaffPermission);
router.put('/admin/staff/:id/toggle-permission', toggleStaffPermission);
router.patch('/staff/:id/toggle-permission', toggleStaffPermission);
router.put('/staff/:id/toggle-permission', toggleStaffPermission);
router.delete('/admin/staff/:id', deleteStaff);
router.delete('/staff/:id', deleteStaff);

export default router;
