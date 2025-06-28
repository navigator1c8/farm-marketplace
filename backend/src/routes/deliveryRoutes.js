import express from 'express';
import {
  getDeliveries,
  getDelivery,
  createDelivery,
  updateDeliveryStatus,
  assignDriver,
  rateDelivery
} from '../controllers/deliveryController.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Customer routes
router.get('/my-deliveries', getDeliveries);
router.get('/:id', getDelivery);
router.post('/:id/rate', rateDelivery);

// Admin/Driver routes
router.get('/', restrictTo('admin', 'driver'), getDeliveries);
router.post('/', restrictTo('admin'), createDelivery);
router.patch('/:id/status', restrictTo('admin', 'driver'), updateDeliveryStatus);
router.patch('/:id/assign-driver', restrictTo('admin'), assignDriver);

export default router;