import express from 'express';
import {
  getPayments,
  getPayment,
  createPayment,
  updatePaymentStatus,
  processRefund,
  getPaymentStats
} from '../controllers/paymentController.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// User routes
router.get('/', getPayments);
router.get('/stats', getPaymentStats);
router.get('/:id', getPayment);
router.post('/', createPayment);

// Admin routes
router.patch('/:id/status', restrictTo('admin'), updatePaymentStatus);
router.post('/:id/refund', restrictTo('admin'), processRefund);

export default router;