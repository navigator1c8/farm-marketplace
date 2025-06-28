import express from 'express';
import {
  getPickupPoints,
  getPickupPoint,
  createPickupPoint,
  updatePickupPoint,
  deletePickupPoint
} from '../controllers/pickupController.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', getPickupPoints);
router.get('/:id', getPickupPoint);

// Admin only routes
router.use(protect, restrictTo('admin'));
router.post('/', createPickupPoint);
router.patch('/:id', updatePickupPoint);
router.delete('/:id', deletePickupPoint);

export default router;