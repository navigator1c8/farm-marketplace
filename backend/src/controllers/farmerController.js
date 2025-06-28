import Farmer from '../models/Farmer.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import { validationResult } from 'express-validator';

// Get all farmers with filtering and pagination
export const getFarmers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      specialty,
      isOrganic,
      isVerified,
      region,
      sortBy = 'rating.average',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = { isActive: true };

    if (specialty) filter.specialties = { $in: [specialty] };
    if (isOrganic === 'true') filter.isOrganic = true;
    if (isVerified === 'true') filter.isVerified = true;
    if (region) filter['farmLocation.region'] = region;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query
    const farmers = await Farmer.find(filter)
      .populate('user', 'firstName lastName avatar')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Farmer.countDocuments(filter);

    res.status(200).json({
      status: 'success',
      data: {
        farmers,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Ошибка получения фермеров:', error);
    res.status(500).json({
      status: 'error',
      message: 'Внутренняя ошибка сервера'
    });
  }
};

// Get single farmer by ID
export const getFarmer = async (req, res) => {
  try {
    const { id } = req.params;

    const farmer = await Farmer.findOne({ _id: id, isActive: true })
      .populate('user', 'firstName lastName avatar phone')
      .populate({
        path: 'products',
        match: { isActive: true },
        options: { sort: { createdAt: -1 }, limit: 12 }
      });

    if (!farmer) {
      return res.status(404).json({
        status: 'error',
        message: 'Фермер не найден'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { farmer }
    });

  } catch (error) {
    console.error('Ошибка получения фермера:', error);
    res.status(500).json({
      status: 'error',
      message: 'Внутренняя ошибка сервера'
    });
  }
};

// Create farmer profile
export const createFarmerProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Ошибки валидации',
        errors: errors.array()
      });
    }

    // Check if user already has farmer profile
    const existingFarmer = await Farmer.findOne({ user: req.user.id });
    if (existingFarmer) {
      return res.status(400).json({
        status: 'error',
        message: 'Профиль фермера уже существует'
      });
    }

    // Update user role to farmer
    await User.findByIdAndUpdate(req.user.id, { role: 'farmer' });

    const farmerData = {
      ...req.body,
      user: req.user.id
    };

    const farmer = await Farmer.create(farmerData);

    res.status(201).json({
      status: 'success',
      message: 'Профиль фермера успешно создан',
      data: { farmer }
    });

  } catch (error) {
    console.error('Ошибка создания профиля фермера:', error);
    res.status(500).json({
      status: 'error',
      message: 'Внутренняя ошибка сервера'
    });
  }
};

// Update farmer profile
export const updateFarmerProfile = async (req, res) => {
  try {
    const farmer = await Farmer.findOne({ user: req.user.id });
    if (!farmer) {
      return res.status(404).json({
        status: 'error',
        message: 'Профиль фермера не найден'
      });
    }

    Object.assign(farmer, req.body);
    await farmer.save();

    res.status(200).json({
      status: 'success',
      message: 'Профиль фермера успешно обновлен',
      data: { farmer }
    });

  } catch (error) {
    console.error('Ошибка обновления профиля фермера:', error);
    res.status(500).json({
      status: 'error',
      message: 'Внутренняя ошибка сервера'
    });
  }
};

// Get farmer dashboard data
export const getFarmerDashboard = async (req, res) => {
  try {
    const farmer = await Farmer.findOne({ user: req.user.id });
    if (!farmer) {
      return res.status(404).json({
        status: 'error',
        message: 'Профиль фермера не найден'
      });
    }

    // Get products count
    const productsCount = await Product.countDocuments({ 
      farmer: farmer._id, 
      isActive: true 
    });

    // Get recent products
    const recentProducts = await Product.find({ 
      farmer: farmer._id, 
      isActive: true 
    })
      .sort({ createdAt: -1 })
      .limit(5);

    // Calculate statistics
    const stats = {
      totalProducts: productsCount,
      totalSales: farmer.totalSales,
      averageRating: farmer.rating.average,
      totalReviews: farmer.rating.count
    };

    res.status(200).json({
      status: 'success',
      data: {
        farmer,
        stats,
        recentProducts
      }
    });

  } catch (error) {
    console.error('Ошибка получения дашборда фермера:', error);
    res.status(500).json({
      status: 'error',
      message: 'Внутренняя ошибка сервера'
    });
  }
};

// Get featured farmers
export const getFeaturedFarmers = async (req, res) => {
  try {
    const farmers = await Farmer.find({
      isActive: true,
      isVerified: true
    })
      .populate('user', 'firstName lastName avatar')
      .sort({ 'rating.average': -1, totalSales: -1 })
      .limit(6);

    res.status(200).json({
      status: 'success',
      data: { farmers }
    });

  } catch (error) {
    console.error('Ошибка получения рекомендуемых фермеров:', error);
    res.status(500).json({
      status: 'error',
      message: 'Внутренняя ошибка сервера'
    });
  }
};

// Search farmers by location
export const searchFarmersByLocation = async (req, res) => {
  try {
    const { latitude, longitude, radius = 50 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        status: 'error',
        message: 'Координаты обязательны для поиска'
      });
    }

    const farmers = await Farmer.find({
      isActive: true,
      'farmLocation.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: parseInt(radius) * 1000 // Convert km to meters
        }
      }
    })
      .populate('user', 'firstName lastName avatar')
      .limit(20);

    res.status(200).json({
      status: 'success',
      data: { farmers }
    });

  } catch (error) {
    console.error('Ошибка поиска фермеров по местоположению:', error);
    res.status(500).json({
      status: 'error',
      message: 'Внутренняя ошибка сервера'
    });
  }
};