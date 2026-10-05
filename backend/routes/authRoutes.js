import express from 'express';
import { registerDonor, loginDonor, registerAdmin, loginAdmin, registerHospital, loginHospital } from '../controllers/authController.js';

const router = express.Router();

// Donor Routes
router.post('/donor/signup', registerDonor);
router.post('/donor/login', loginDonor);

// Admin Routes
router.post('/admin/signup', registerAdmin);
router.post('/admin/login', loginAdmin);

// Hospital Routes
router.post('/hospital/create', registerHospital);
router.post('/hospital/login', loginHospital);

export default router;
