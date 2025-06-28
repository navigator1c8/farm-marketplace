import express from 'express';
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  updateWishlistItem,
  clearWishlist,
  updateWishlistSettings,
  getPublicWishlist
} from '../controllers/wishlistController.js';
import { protect } from '../middleware/auth.js';
import { body } from 'express-validator';

const router = express.Router();

// Public route
router.get('/public/:userId', getPublicWishlist);

// Protected routes
router.use(protect);

router.get('/', getWishlist);
router.post('/add', [
  body('productId').isMongoId().withMessage('Некорректный ID продукта'),
  body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Некорректный приоритет')
], addToWishlist);
router.patch('/item/:productId', updateWishlistItem);
router.delete('/item/:productId', removeFromWishlist);
router.delete('/clear', clearWishlist);
router.patch('/settings', updateWishlistSettings);

export default router;