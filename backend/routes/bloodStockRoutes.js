import express from 'express';
import {
  getHospitalStock,
  updateBloodStock,
  resetBloodStock,
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

export default router;
