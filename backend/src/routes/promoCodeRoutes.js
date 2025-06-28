import express from 'express';
import {
  getPromoCodes,
  getPromoCode,
  validatePromoCode,
  createPromoCode,
  updatePromoCode,
  deletePromoCode,
  getPromoCodeStats
} from '../controllers/promoCodeController.js';
import { protect, restrictTo } from '../middleware/auth.js';
import { body } from 'express-validator';

const router = express.Router();

// Public route for validation
router.post('/validate/:code', protect, validatePromoCode);

// Protected routes
router.use(protect);

// User routes
router.get('/code/:code', getPromoCode);

// Admin routes
router.use(restrictTo('admin'));

router.get('/', getPromoCodes);
router.post('/', [
  body('code').trim().isLength({ min: 3, max: 20 }).withMessage('Код должен содержать от 3 до 20 символов'),
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Название должно содержать от 2 до 100 символов'),
  body('type').isIn(['percentage', 'fixed_amount', 'free_shipping']).withMessage('Некорректный тип промокода'),
  body('value').isFloat({ min: 0 }).withMessage('Значение должно быть положительным числом'),
  body('validFrom').isISO8601().withMessage('Некорректная дата начала действия'),
  body('validUntil').isISO8601().withMessage('Некорректная дата окончания действия')
], createPromoCode);

router.patch('/:id', updatePromoCode);
router.delete('/:id', deletePromoCode);
router.get('/:id/stats', getPromoCodeStats);

export default router;