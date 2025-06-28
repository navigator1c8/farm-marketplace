import User from '../models/User.js';
import Farmer from '../models/Farmer.js';
import Order from '../models/Order.js';
import Review from '../models/Review.js';
import mongoose from 'mongoose';
import { validationResult } from 'express-validator';

// Get user profile
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    let farmerProfile = null;
    if (user.role === 'farmer') {
      farmerProfile = await Farmer.findOne({ user: user._id });
    }

    res.status(200).json({
      status: 'success',
      data: {
        user,
        farmer: farmerProfile
      }
    });

  } catch (error) {
    console.error('Ошибка получения профиля:', error);
    res.status(500).json({
      status: 'error',
      message: 'Внутренняя ошибка сервера'
    });
  }
};

// Update user profile
export const updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Ошибки валидации',
        errors: errors.array()
      });
    }

    const allowedFields = ['firstName', 'lastName', 'phone', 'address'];
    const updates = {};

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      status: 'success',
      message: 'Профиль обновлен',
      data: { user }
    });

  } catch (error) {
    console.error('Ошибка обновления профиля:', error);
    res.status(500).json({
      status: 'error',
      message: 'Внутренняя ошибка сервера'
    });
  }
};

// Change password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        status: 'error',
        message: 'Неверный текущий пароль'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Пароль успешно изменен'
    });

  } catch (error) {
    console.error('Ошибка изменения пароля:', error);
    res.status(500).json({
      status: 'error',
      message: 'Внутренняя ошибка сервера'
    });
  }
};

// Upload avatar
export const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'Файл не загружен'
      });
    }

    // Here you would typically upload to cloud storage (Cloudinary, AWS S3, etc.)
    // For now, we'll just store the filename
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatar: avatarUrl },
      { new: true }
    );

    res.status(200).json({
      status: 'success',
      message: 'Аватар обновлен',
      data: { user }
    });

  } catch (error) {
    console.error('Ошибка загрузки аватара:', error);
    res.status(500).json({
      status: 'error',
      message: 'Внутренняя ошибка сервера'
    });
  }
};

// Delete account
export const deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;

    // Get user with password
    const user = await User.findById(req.user.id).select('+password');

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({
        status: 'error',
        message: 'Неверный пароль'
      });
    }

    // Soft delete - deactivate account
    user.isActive = false;
    await user.save();

    // If farmer, deactivate farmer profile
    if (user.role === 'farmer') {
      await Farmer.findOneAndUpdate(
        { user: user._id },
        { isActive: false }
      );
    }

    res.status(200).json({
      status: 'success',
      message: 'Аккаунт деактивирован'
    });

  } catch (error) {
    console.error('Ошибка удаления аккаунта:', error);
    res.status(500).json({
      status: 'error',
      message: 'Внутренняя ошибка сервера'
    });
  }
};

// Get user statistics
export const getUserStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = {
      totalOrders: 0,
      totalSpent: 0,
      totalReviews: 0,
      favoriteCategories: []
    };

    // Get order statistics
    const orderStats = await Order.aggregate([
      { $match: { customer: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$pricing.total' }
        }
      }
    ]);

    if (orderStats.length > 0) {
      stats.totalOrders = orderStats[0].totalOrders;
      stats.totalSpent = orderStats[0].totalSpent;
    }

    // Get review count
    stats.totalReviews = await Review.countDocuments({ customer: userId });

    // Get favorite categories
    const categoryStats = await Order.aggregate([
      { $match: { customer: new mongoose.Types.ObjectId(userId) } },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $group: {
          _id: '$product.category',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 3 }
    ]);

    stats.favoriteCategories = categoryStats.map(cat => ({
      category: cat._id,
      count: cat.count
    }));

    res.status(200).json({
      status: 'success',
      data: { stats }
    });

  } catch (error) {
    console.error('Ошибка получения статистики пользователя:', error);
    res.status(500).json({
      status: 'error',
      message: 'Внутренняя ошибка сервера'
    });
  }
};

// Get all users (admin only)
export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, role, isActive } = req.query;

    const filter = {};
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);

    res.status(200).json({
      status: 'success',
      data: {
        users,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Ошибка получения пользователей:', error);
    res.status(500).json({
      status: 'error',
      message: 'Внутренняя ошибка сервера'
    });
  }
};

// Update user role (admin only)
export const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Пользователь не найден'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Роль пользователя обновлена',
      data: { user }
    });

  } catch (error) {
    console.error('Ошибка обновления роли пользователя:', error);
    res.status(500).json({
      status: 'error',
      message: 'Внутренняя ошибка сервера'
    });
  }
};