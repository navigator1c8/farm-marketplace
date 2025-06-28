import express from 'express';
import {
  getDashboardAnalytics,
  getSalesAnalytics,
  getUserAnalytics,
  getProductAnalytics
} from '../controllers/analyticsController.js';
import { getAnalytics } from '../middleware/analytics.js';
import { protect, restrictTo } from '../middleware/auth.js';
import { cacheMiddleware } from '../middleware/cache.js';

const router = express.Router();

// All routes require admin access
router.use(protect, restrictTo('admin'));

// Analytics routes
router.get('/dashboard', cacheMiddleware(1800), getDashboardAnalytics);
router.get('/sales', cacheMiddleware(1800), getSalesAnalytics);
router.get('/users', cacheMiddleware(1800), getUserAnalytics);
router.get('/products', cacheMiddleware(1800), getProductAnalytics);
router.get('/system', getAnalytics);

export default router;