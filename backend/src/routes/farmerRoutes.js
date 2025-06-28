import express from 'express';
import {
  getFarmers,
  getFarmer,
  createFarmerProfile,
  updateFarmerProfile,
  getFarmerDashboard,
  getFeaturedFarmers,
  searchFarmersByLocation
} from '../controllers/farmerController.js';
import { protect, restrictTo } from '../middleware/auth.js';
import { validateFarmerProfile } from '../middleware/validation.js';

const router = express.Router();

// Public routes
router.get('/', getFarmers);
router.get('/featured', getFeaturedFarmers);
router.get('/search/location', searchFarmersByLocation);
router.get('/:id', getFarmer);

// Protected routes
router.use(protect);
router.post('/profile', validateFarmerProfile, createFarmerProfile);
router.patch('/profile', restrictTo('farmer'), updateFarmerProfile);
router.get('/dashboard/stats', restrictTo('farmer'), getFarmerDashboard);

export default router;