const express = require('express');
const router = express.Router();
const {
  getHospitalProfile,
  updateInventory,
  dispatchEmergencyRequest,
  getHospitalRequests,
  verifyBloodCollection,
} = require('../controllers/hospitalController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect, authorize('HOSPITAL'));

router.get('/profile', getHospitalProfile);
router.put('/inventory', updateInventory);
router.post('/request-dispatch', dispatchEmergencyRequest);
router.get('/requests', getHospitalRequests);
router.post('/verify-collection', verifyBloodCollection);

module.exports = router;
