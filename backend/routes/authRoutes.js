const express = require('express');
const router = express.Router();
const { donorSignup, login, getMe, logout } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Route '/' Donor Signup & Unified Login
router.post('/donor/signup', donorSignup);
router.post('/login', login);
router.get('/me', protect, getMe);
router.post('/logout', logout);

module.exports = router;
