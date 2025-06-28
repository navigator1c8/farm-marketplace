import express from 'express';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  getCartSummary
} from '../controllers/cartController.js';
import { protect } from '../middleware/auth.js';
import { body } from 'express-validator';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Cart routes
router.get('/', getCart);
router.get('/summary', getCartSummary);
router.post('/add', [
  body('productId').isMongoId().withMessage('Некорректный ID продукта'),
  body('quantity').optional().isInt({ min: 1 }).withMessage('Количество должно быть положительным числом')
], addToCart);
router.patch('/item/:productId', [
  body('quantity').isInt({ min: 1 }).withMessage('Количество должно быть положительным числом')
], updateCartItem);
router.delete('/item/:productId', removeFromCart);
router.delete('/clear', clearCart);

export default router;