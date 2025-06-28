import express from 'express';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createNotification,
  sendBulkNotifications
} from '../controllers/notificationController.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// User routes
router.get('/', getNotifications);
router.patch('/:id/read', markAsRead);
router.patch('/mark-all-read', markAllAsRead);
router.delete('/:id', deleteNotification);

// Admin routes
router.post('/', restrictTo('admin'), createNotification);
router.post('/bulk', restrictTo('admin'), sendBulkNotifications);

export default router;