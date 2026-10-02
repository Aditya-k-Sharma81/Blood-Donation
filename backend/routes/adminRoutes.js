const express = require('express');
const router = express.Router();
const { createHospitalUser, getAdminStats, deleteUser } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All routes require Admin authorization
router.use(protect, authorize('ADMIN'));

// Admin can create a hospital user access account
router.post('/create-hospital', createHospitalUser);
router.get('/dashboard', getAdminStats);
router.delete('/users/:id', deleteUser);

module.exports = router;
