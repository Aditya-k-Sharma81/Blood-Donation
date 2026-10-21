import express from 'express';
import {
  getHospitalStock,
  updateBloodStock,
  resetBloodStock,
  getNearbyDonors,
} from '../controllers/bloodStockController.js';

const router = express.Router();

// Blood Inventory Routes
router.get('/hospital/stock', getHospitalStock);
router.get('/stock', getHospitalStock);
router.post('/hospital/stock/update', updateBloodStock);
router.patch('/hospital/stock/update', updateBloodStock);
router.post('/stock/update', updateBloodStock);
router.patch('/stock/update', updateBloodStock);
router.post('/hospital/stock/reset', resetBloodStock);

// Emergency Donors by Radius (5km, 10km, 15km)
router.get('/hospital/nearby-donors', getNearbyDonors);
router.get('/hospital/donors-by-radius', getNearbyDonors);

export default router;

