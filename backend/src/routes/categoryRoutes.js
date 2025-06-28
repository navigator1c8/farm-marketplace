import express from 'express';
import {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryTree
} from '../controllers/categoryController.js';
import { protect, restrictTo } from '../middleware/auth.js';
import { body } from 'express-validator';

const router = express.Router();

// Public routes
router.get('/', getCategories);
router.get('/tree', getCategoryTree);
router.get('/:identifier', getCategory);

// Admin only routes
router.use(protect, restrictTo('admin'));

router.post('/', [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Название категории должно содержать от 2 до 100 символов'),
  body('description').optional().isLength({ max: 500 }).withMessage('Описание не может быть длиннее 500 символов'),
  body('parent').optional().isMongoId().withMessage('Некорректный ID родительской категории')
], createCategory);

router.patch('/:id', updateCategory);
router.delete('/:id', deleteCategory);

export default router;