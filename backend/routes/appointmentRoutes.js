import express from 'express';
import {
  getAvailableHospitals,
  createAppointment,
  getBookedSlots,
  getDonorAppointments,
  cancelAppointment,
  getAllAppointments,
} from '../controllers/appointmentController.js';

const router = express.Router();

// Hospitals available for blood donation
router.get('/appointments/hospitals', getAvailableHospitals);
router.get('/hospitals', getAvailableHospitals);

// Check booked time slots for a hospital on a specific date
router.get('/appointments/booked-slots', getBookedSlots);

// Donor Appointments
router.post('/appointments', createAppointment);
router.get('/appointments/my', getDonorAppointments);
router.patch('/appointments/:id/cancel', cancelAppointment);
router.put('/appointments/:id/cancel', cancelAppointment);

// Admin / Overview
router.get('/appointments', getAllAppointments);

export default router;
