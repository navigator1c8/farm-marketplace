import express from 'express';
import {
  getProfile,
  updateProfile,
  changePassword,
  uploadAvatar,
  deleteAccount,
  getUserStats,
  getAllUsers,
  updateUserRole
} from '../controllers/userController.js';
import { protect, restrictTo } from '../middleware/auth.js';
import { uploadAvatar as uploadAvatarMiddleware } from '../middleware/upload.js';
import { body } from 'express-validator';

const router = express.Router();

// All routes require authentication
router.use(protect);

// User profile routes
router.get('/profile', getProfile);
router.patch('/profile', [
  body('firstName').optional().trim().isLength({ min: 2, max: 50 }),
  body('lastName').optional().trim().isLength({ min: 2, max: 50 }),
  body('phone').optional().isMobilePhone('ru-RU')
], updateProfile);

// Password management
router.patch('/change-password', [
  body('currentPassword').notEmpty().withMessage('Текущий пароль обязателен'),
  body('newPassword').isLength({ min: 6 }).withMessage('Новый пароль должен содержать минимум 6 символов')
], changePassword);

// Avatar upload
router.post('/avatar', uploadAvatarMiddleware, uploadAvatar);

// Account management
router.delete('/account', [
  body('password').notEmpty().withMessage('Пароль обязателен для удаления аккаунта')
], deleteAccount);

// User statistics
router.get('/stats', getUserStats);

// Admin only routes
router.get('/', restrictTo('admin'), getAllUsers);
router.patch('/:userId/role', restrictTo('admin'), [
  body('role').isIn(['customer', 'farmer', 'admin']).withMessage('Некорректная роль')
], updateUserRole);

export default router;