import express from 'express';
import {
  createReview,
  getProductReviews,
  getFarmerReviews,
  updateReview,
  deleteReview,
  addHelpfulVote,
  respondToReview
} from '../controllers/reviewController.js';
import { protect, restrictTo } from '../middleware/auth.js';
import { validateReview } from '../middleware/validation.js';

const router = express.Router();

// Public routes
router.get('/product/:productId', getProductReviews);
router.get('/farmer/:farmerId', getFarmerReviews);

// Protected routes
router.use(protect);

// Customer routes
router.post('/', validateReview, createReview);
router.patch('/:id', updateReview);
router.delete('/:id', deleteReview);
router.post('/:id/helpful', addHelpfulVote);

// Farmer routes
router.post('/:id/respond', restrictTo('farmer'), respondToReview);

export default router;