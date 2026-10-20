import express from 'express';
import {
  getAvailableHospitals,
  getHospitalStaff,
  createAppointment,
  getBookedSlots,
  getDonorAppointments,
  cancelAppointment,
  getAllAppointments,
  updateAppointmentStatus,
} from '../controllers/appointmentController.js';

const router = express.Router();

// Hospitals available for blood donation
router.get('/appointments/hospitals', getAvailableHospitals);
router.get('/hospitals', getAvailableHospitals);
router.get('/appointments/staff', getHospitalStaff);

// Check booked time slots for a hospital on a specific date
router.get('/appointments/booked-slots', getBookedSlots);

// Donor Appointments
router.post('/appointments', createAppointment);
router.get('/appointments/my', getDonorAppointments);
router.patch('/appointments/:id/cancel', cancelAppointment);
router.put('/appointments/:id/cancel', cancelAppointment);

// Admin & Hospital Appointments Management
router.get('/appointments', getAllAppointments);
router.get('/hospital/appointments', getAllAppointments);
router.patch('/appointments/:id/status', updateAppointmentStatus);
router.put('/appointments/:id/status', updateAppointmentStatus);

export default router;
