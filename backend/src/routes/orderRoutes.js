import express from 'express';
import {
  createOrder,
  getUserOrders,
  getOrder,
  updateOrderStatus,
  cancelOrder,
  getFarmerOrders,
  getOrderStats
} from '../controllers/orderController.js';
import { protect, restrictTo } from '../middleware/auth.js';
import { validateOrder } from '../middleware/validation.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Customer routes
router.post('/', validateOrder, createOrder);
router.get('/my-orders', getUserOrders);
router.get('/stats', getOrderStats);
router.get('/:id', getOrder);
router.patch('/:id/cancel', cancelOrder);

// Farmer routes
router.get('/farmer/orders', restrictTo('farmer'), getFarmerOrders);
router.patch('/:id/status', restrictTo('farmer', 'admin'), updateOrderStatus);

export default router;