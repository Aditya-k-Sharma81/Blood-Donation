const express = require('express');
const router = express.Router();
const { getDonorProfile, toggleAvailability, respondToRequest } = require('../controllers/donorController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect, authorize('DONOR'));

router.get('/profile', getDonorProfile);
router.put('/availability', toggleAvailability);
router.post('/respond-request', respondToRequest);

module.exports = router;
