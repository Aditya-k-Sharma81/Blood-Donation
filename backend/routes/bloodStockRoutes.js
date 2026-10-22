import express from 'express';
import {
  getHospitalStock,
  updateBloodStock,
  resetBloodStock,
  getNearbyDonors,
  sendEmergencyRequest,
  issueBloodToPatient,
  getBloodIssueHistory,
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

// Dispense / Issue Blood to Patient (Reduces hospital stock)
router.post('/hospital/blood-issue', issueBloodToPatient);
router.post('/hospital/issue-blood', issueBloodToPatient);
router.get('/hospital/blood-issues', getBloodIssueHistory);
router.get('/hospital/issue-history', getBloodIssueHistory);

// Emergency Donors by Radius (5km, 10km, 15km)
router.get('/hospital/nearby-donors', getNearbyDonors);
router.get('/hospital/donors-by-radius', getNearbyDonors);

// Dispatch Emergency Blood Request to Donors
router.post('/hospital/send-emergency-request', sendEmergencyRequest);
router.post('/hospital/emergency-request', sendEmergencyRequest);

export default router;

