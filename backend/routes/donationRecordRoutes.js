import express from 'express';
import {
  recordDonation,
  getDonationRecord,
  getDonorNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../controllers/donationRecordController.js';

const router = express.Router();

// Clinical Donation Record Endpoints
router.post('/appointments/:id/donation-record', recordDonation);
router.get('/appointments/:id/donation-record', getDonationRecord);

// Donor Notification Endpoints
router.get('/donor/notifications', getDonorNotifications);
router.patch('/donor/notifications/:id/read', markNotificationRead);
router.put('/donor/notifications/:id/read', markNotificationRead);
router.patch('/donor/notifications/read-all', markAllNotificationsRead);
router.put('/donor/notifications/read-all', markAllNotificationsRead);

export default router;
