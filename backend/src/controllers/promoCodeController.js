import PromoCode from '../models/PromoCode.js';
import Order from '../models/Order.js';
import { validationResult } from 'express-validator';

// Get promo codes (admin only)
export const getPromoCodes = async (req, res) => {
  try {
    const { page = 1, limit = 10, isActive, type } = req.query;

    const filter = {};
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (type) filter.type = type;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const promoCodes = await PromoCode.find(filter)
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await PromoCode.countDocuments(filter);

    res.status(200).json({
      status: 'success',
      data: {
        promoCodes,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Ошибка получения промокодов:', error);
    res.status(500).json({
      status: 'error',
      message: 'Внутренняя ошибка сервера'
    });
  }
};

// Get promo code by code
export const getPromoCode = async (req, res) => {
  try {
    const { code } = req.params;

    const promoCode = await PromoCode.findOne({ code: code.toUpperCase() });
    if (!promoCode) {
      return res.status(404).json({
        status: 'error',
        message: 'Промокод не найден'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { promoCode }
    });

  } catch (error) {
    console.error('Ошибка получения промокода:', error);
    res.status(500).json({
      status: 'error',
      message: 'Внутренняя ошибка сервера'
    });
  }
};

// Validate promo code
export const validatePromoCode = async (req, res) => {
  try {
    const { code } = req.params;
    const { orderAmount, items } = req.body;

    const promoCode = await PromoCode.findOne({ code: code.toUpperCase() })
      .populate('applicableCategories applicableProducts applicableFarmers')
      .populate('excludedCategories excludedProducts');

    if (!promoCode) {
      return res.status(404).json({
        status: 'error',
        message: 'Промокод не найден'
      });
    }

    // Check if promo code is currently valid
    if (!promoCode.isCurrentlyValid) {
      return res.status(400).json({
        status: 'error',
        message: 'Промокод недействителен или истек'
      });
    }

    // Check if user can use this promo code
    if (!promoCode.canUserUse(req.user.id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Вы уже использовали этот промокод'
      });
    }

    // Check minimum order amount
    if (orderAmount < promoCode.minOrderAmount) {
      return res.status(400).json({
        status: 'error',
        message: `Минимальная сумма заказа для этого промокода: ${promoCode.minOrderAmount} ₽`
      });
    }

    // Calculate discount
    let discountAmount = 0;
    
    if (promoCode.type === 'percentage') {
      discountAmount = (orderAmount * promoCode.value) / 100;
      if (promoCode.maxDiscountAmount) {
        discountAmount = Math.min(discountAmount, promoCode.maxDiscountAmount);
      }
    } else if (promoCode.type === 'fixed_amount') {
      discountAmount = Math.min(promoCode.value, orderAmount);
    }

    res.status(200).json({
      status: 'success',
      data: {
        promoCode: {
          code: promoCode.code,
          name: promoCode.name,
          type: promoCode.type,
          value: promoCode.value
        },
        discountAmount,
        isValid: true
      }
    });

  } catch (error) {
    console.error('Ошибка валидации промокода:', error);
    res.status(500).json({
      status: 'error',
      message: 'Внутренняя ошибка сервера'
    });
  }
};

// Create promo code (admin only)
export const createPromoCode = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Ошибки валидации',
        errors: errors.array()
      });
    }

    const promoCodeData = {
      ...req.body,
      createdBy: req.user.id,
      code: req.body.code.toUpperCase()
    };

    const promoCode = await PromoCode.create(promoCodeData);

    res.status(201).json({
      status: 'success',
      message: 'Промокод создан',
      data: { promoCode }
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        status: 'error',
        message: 'Промокод с таким кодом уже существует'
      });
    }

    console.error('Ошибка создания промокода:', error);
    res.status(500).json({
      status: 'error',
      message: 'Внутренняя ошибка сервера'
    });
  }
};

// Update promo code (admin only)
export const updatePromoCode = async (req, res) => {
  try {
    const { id } = req.params;

    const promoCode = await PromoCode.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!promoCode) {
      return res.status(404).json({
        status: 'error',
        message: 'Промокод не найден'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Промокод обновлен',
      data: { promoCode }
    });

  } catch (error) {
    console.error('Ошибка обновления промокода:', error);
    res.status(500).json({
      status: 'error',
      message: 'Внутренняя ошибка сервера'
    });
  }
};

// Delete promo code (admin only)
export const deletePromoCode = async (req, res) => {
  try {
    const { id } = req.params;

    const promoCode = await PromoCode.findByIdAndDelete(id);
    if (!promoCode) {
      return res.status(404).json({
        status: 'error',
        message: 'Промокод не найден'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Промокод удален'
    });

  } catch (error) {
    console.error('Ошибка удаления промокода:', error);
    res.status(500).json({
      status: 'error',
      message: 'Внутренняя ошибка сервера'
    });
  }
};

// Apply promo code to order
export const applyPromoCode = async (orderId, promoCodeId, userId, discountAmount) => {
  try {
    const promoCode = await PromoCode.findById(promoCodeId);
    if (!promoCode) {
      throw new Error('Промокод не найден');
    }

    // Add usage record
    promoCode.usedBy.push({
      user: userId,
      order: orderId,
      discountAmount
    });

    promoCode.usageCount += 1;
    await promoCode.save();

    return promoCode;

  } catch (error) {
    console.error('Ошибка применения промокода:', error);
    throw error;
  }
};

// Get promo code statistics
export const getPromoCodeStats = async (req, res) => {
  try {
    const { id } = req.params;

    const promoCode = await PromoCode.findById(id);
    if (!promoCode) {
      return res.status(404).json({
        status: 'error',
        message: 'Промокод не найден'
      });
    }

    const stats = {
      totalUsage: promoCode.usageCount,
      totalDiscount: promoCode.usedBy.reduce((sum, usage) => sum + usage.discountAmount, 0),
      uniqueUsers: new Set(promoCode.usedBy.map(usage => usage.user.toString())).size,
      usageByDate: {}
    };

    // Group usage by date
    promoCode.usedBy.forEach(usage => {
      const date = usage.usedAt.toISOString().split('T')[0];
      stats.usageByDate[date] = (stats.usageByDate[date] || 0) + 1;
    });

    res.status(200).json({
      status: 'success',
      data: { stats }
    });

  } catch (error) {
    console.error('Ошибка получения статистики промокода:', error);
    res.status(500).json({
      status: 'error',
      message: 'Внутренняя ошибка сервера'
    });
  }
};