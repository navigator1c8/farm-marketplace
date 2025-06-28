import Review from '../models/Review.js';
import Product from '../models/Product.js';
import Farmer from '../models/Farmer.js';
import Order from '../models/Order.js';
import { validationResult } from 'express-validator';

// Create review
export const createReview = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Ошибки валидации',
        errors: errors.array()
      });
    }

    const { productId, orderId, rating, title, comment } = req.body;

    // Check if order exists and belongs to user
    const order = await Order.findOne({
      _id: orderId,
      customer: req.user.id,
      status: 'delivered'
    });

    if (!order) {
      return res.status(400).json({
        status: 'error',
        message: 'Заказ не найден или не доставлен'
      });
    }

    // Check if product was in the order
    const orderItem = order.items.find(item => 
      item.product.toString() === productId
    );

    if (!orderItem) {
      return res.status(400).json({
        status: 'error',
        message: 'Продукт не найден в заказе'
      });
    }

    // Check if review already exists
    const existingReview = await Review.findOne({
      customer: req.user.id,
      product: productId,
      order: orderId
    });

    if (existingReview) {
      return res.status(400).json({
        status: 'error',
        message: 'Отзыв уже оставлен для этого продукта'
      });
    }

    // Create review
    const review = await Review.create({
      customer: req.user.id,
      product: productId,
      farmer: orderItem.farmer,
      order: orderId,
      rating,
      title,
      comment
    });

    // Update product rating
    await updateProductRating(productId);
    
    // Update farmer rating
    await updateFarmerRating(orderItem.farmer);

    await review.populate([
      { path: 'customer', select: 'firstName lastName avatar' },
      { path: 'product', select: 'name' }
    ]);

    res.status(201).json({
      status: 'success',
      message: 'Отзыв успешно создан',
      data: { review }
    });

  } catch (error) {
    console.error('Ошибка создания отзыва:', error);
    res.status(500).json({
      status: 'error',
      message: 'Внутренняя ошибка сервера'
    });
  }
};

// Get product reviews
export const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const reviews = await Review.find({
      product: productId,
      isVisible: true
    })
      .populate('customer', 'firstName lastName avatar')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Review.countDocuments({
      product: productId,
      isVisible: true
    });

    // Get rating distribution
    const ratingStats = await Review.aggregate([
      { $match: { product: new mongoose.Types.ObjectId(productId), isVisible: true } },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        reviews,
        ratingStats,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Ошибка получения отзывов:', error);
    res.status(500).json({
      status: 'error',
      message: 'Внутренняя ошибка сервера'
    });
  }
};

// Get farmer reviews
export const getFarmerReviews = async (req, res) => {
  try {
    const { farmerId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reviews = await Review.find({
      farmer: farmerId,
      isVisible: true
    })
      .populate([
        { path: 'customer', select: 'firstName lastName avatar' },
        { path: 'product', select: 'name images' }
      ])
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Review.countDocuments({
      farmer: farmerId,
      isVisible: true
    });

    res.status(200).json({
      status: 'success',
      data: {
        reviews,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Ошибка получения отзывов фермера:', error);
    res.status(500).json({
      status: 'error',
      message: 'Внутренняя ошибка сервера'
    });
  }
};

// Update review
export const updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, title, comment } = req.body;

    const review = await Review.findOne({
      _id: id,
      customer: req.user.id
    });

    if (!review) {
      return res.status(404).json({
        status: 'error',
        message: 'Отзыв не найден'
      });
    }

    // Update review
    review.rating = rating || review.rating;
    review.title = title || review.title;
    review.comment = comment || review.comment;
    await review.save();

    // Update ratings
    await updateProductRating(review.product);
    await updateFarmerRating(review.farmer);

    res.status(200).json({
      status: 'success',
      message: 'Отзыв обновлен',
      data: { review }
    });

  } catch (error) {
    console.error('Ошибка обновления отзыва:', error);
    res.status(500).json({
      status: 'error',
      message: 'Внутренняя ошибка сервера'
    });
  }
};

// Delete review
export const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await Review.findOne({
      _id: id,
      customer: req.user.id
    });

    if (!review) {
      return res.status(404).json({
        status: 'error',
        message: 'Отзыв не найден'
      });
    }

    await review.deleteOne();

    // Update ratings
    await updateProductRating(review.product);
    await updateFarmerRating(review.farmer);

    res.status(200).json({
      status: 'success',
      message: 'Отзыв удален'
    });

  } catch (error) {
    console.error('Ошибка удаления отзыва:', error);
    res.status(500).json({
      status: 'error',
      message: 'Внутренняя ошибка сервера'
    });
  }
};

// Add helpful vote
export const addHelpfulVote = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        status: 'error',
        message: 'Отзыв не найден'
      });
    }

    review.helpfulVotes += 1;
    await review.save();

    res.status(200).json({
      status: 'success',
      message: 'Голос учтен',
      data: { helpfulVotes: review.helpfulVotes }
    });

  } catch (error) {
    console.error('Ошибка добавления голоса:', error);
    res.status(500).json({
      status: 'error',
      message: 'Внутренняя ошибка сервера'
    });
  }
};

// Farmer response to review
export const respondToReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    const farmer = await Farmer.findOne({ user: req.user.id });
    if (!farmer) {
      return res.status(403).json({
        status: 'error',
        message: 'Только фермеры могут отвечать на отзывы'
      });
    }

    const review = await Review.findOne({
      _id: id,
      farmer: farmer._id
    });

    if (!review) {
      return res.status(404).json({
        status: 'error',
        message: 'Отзыв не найден'
      });
    }

    review.response = {
      text,
      respondedAt: new Date(),
      respondedBy: req.user.id
    };

    await review.save();

    res.status(200).json({
      status: 'success',
      message: 'Ответ добавлен',
      data: { review }
    });

  } catch (error) {
    console.error('Ошибка ответа на отзыв:', error);
    res.status(500).json({
      status: 'error',
      message: 'Внутренняя ошибка сервера'
    });
  }
};

// Helper function to update product rating
const updateProductRating = async (productId) => {
  try {
    const stats = await Review.aggregate([
      { $match: { product: new mongoose.Types.ObjectId(productId), isVisible: true } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 }
        }
      }
    ]);

    const { averageRating = 0, totalReviews = 0 } = stats[0] || {};

    await Product.findByIdAndUpdate(productId, {
      'rating.average': Math.round(averageRating * 10) / 10,
      'rating.count': totalReviews
    });

  } catch (error) {
    console.error('Ошибка обновления рейтинга продукта:', error);
  }
};

// Helper function to update farmer rating
const updateFarmerRating = async (farmerId) => {
  try {
    const stats = await Review.aggregate([
      { $match: { farmer: new mongoose.Types.ObjectId(farmerId), isVisible: true } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 }
        }
      }
    ]);

    const { averageRating = 0, totalReviews = 0 } = stats[0] || {};

    await Farmer.findByIdAndUpdate(farmerId, {
      'rating.average': Math.round(averageRating * 10) / 10,
      'rating.count': totalReviews
    });

  } catch (error) {
    console.error('Ошибка обновления рейтинга фермера:', error);
  }
};