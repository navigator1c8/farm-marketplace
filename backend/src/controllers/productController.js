import Product from '../models/Product.js';
import Farmer from '../models/Farmer.js';
import { validationResult } from 'express-validator';

// Get all products with filtering and pagination
export const getProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      farmer,
      search,
      minPrice,
      maxPrice,
      isOrganic,
      inStock,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = { isActive: true };

    if (category) filter.category = category;
    if (farmer) filter.farmer = farmer;
    if (isOrganic === 'true') filter['characteristics.isOrganic'] = true;
    if (inStock === 'true') filter['availability.inStock'] = true;

    // Price range filter
    if (minPrice || maxPrice) {
      filter['price.amount'] = {};
      if (minPrice) filter['price.amount'].$gte = parseFloat(minPrice);
      if (maxPrice) filter['price.amount'].$lte = parseFloat(maxPrice);
    }

    // Search filter
    if (search) {
      filter.$text = { $search: search };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query
    const products = await Product.find(filter)
      .populate('farmer', 'farmName rating isVerified')
      .populate('farmer.user', 'firstName lastName')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Product.countDocuments(filter);

    res.status(200).json({
      status: 'success',
      data: {
        products,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Ошибка получения продуктов:', error);
    res.status(500).json({
      status: 'error',
      message: 'Внутренняя ошибка сервера'
    });
  }
};

// Get single product by ID
export const getProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findOne({ _id: id, isActive: true })
      .populate('farmer', 'farmName description rating isVerified farmLocation')
      .populate('farmer.user', 'firstName lastName')
      .populate({
        path: 'reviews',
        populate: {
          path: 'customer',
          select: 'firstName lastName avatar'
        },
        options: { sort: { createdAt: -1 }, limit: 10 }
      });

    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Продукт не найден'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { product }
    });

  } catch (error) {
    console.error('Ошибка получения продукта:', error);
    res.status(500).json({
      status: 'error',
      message: 'Внутренняя ошибка сервера'
    });
  }
};

// Create new product (farmers only)
export const createProduct = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Ошибки валидации',
        errors: errors.array()
      });
    }

    // Check if user is a farmer
    const farmer = await Farmer.findOne({ user: req.user.id, isActive: true });
    if (!farmer) {
      return res.status(403).json({
        status: 'error',
        message: 'Только фермеры могут создавать продукты'
      });
    }

    const productData = {
      ...req.body,
      farmer: farmer._id
    };

    const product = await Product.create(productData);

    res.status(201).json({
      status: 'success',
      message: 'Продукт успешно создан',
      data: { product }
    });

  } catch (error) {
    console.error('Ошибка создания продукта:', error);
    res.status(500).json({
      status: 'error',
      message: 'Внутренняя ошибка сервера'
    });
  }
};

// Update product (farmers only)
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user is a farmer
    const farmer = await Farmer.findOne({ user: req.user.id, isActive: true });
    if (!farmer) {
      return res.status(403).json({
        status: 'error',
        message: 'Только фермеры могут обновлять продукты'
      });
    }

    // Find product and check ownership
    const product = await Product.findOne({ _id: id, farmer: farmer._id });
    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Продукт не найден или у вас нет прав на его редактирование'
      });
    }

    // Update product
    Object.assign(product, req.body);
    await product.save();

    res.status(200).json({
      status: 'success',
      message: 'Продукт успешно обновлен',
      data: { product }
    });

  } catch (error) {
    console.error('Ошибка обновления продукта:', error);
    res.status(500).json({
      status: 'error',
      message: 'Внутренняя ошибка сервера'
    });
  }
};

// Delete product (farmers only)
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user is a farmer
    const farmer = await Farmer.findOne({ user: req.user.id, isActive: true });
    if (!farmer) {
      return res.status(403).json({
        status: 'error',
        message: 'Только фермеры могут удалять продукты'
      });
    }

    // Find product and check ownership
    const product = await Product.findOne({ _id: id, farmer: farmer._id });
    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Продукт не найден или у вас нет прав на его удаление'
      });
    }

    // Soft delete - mark as inactive
    product.isActive = false;
    await product.save();

    res.status(200).json({
      status: 'success',
      message: 'Продукт успешно удален'
    });

  } catch (error) {
    console.error('Ошибка удаления продукта:', error);
    res.status(500).json({
      status: 'error',
      message: 'Внутренняя ошибка сервера'
    });
  }
};

// Get products by farmer
export const getProductsByFarmer = async (req, res) => {
  try {
    const { farmerId } = req.params;
    const { page = 1, limit = 12 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const products = await Product.find({ 
      farmer: farmerId, 
      isActive: true 
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Product.countDocuments({ 
      farmer: farmerId, 
      isActive: true 
    });

    res.status(200).json({
      status: 'success',
      data: {
        products,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Ошибка получения продуктов фермера:', error);
    res.status(500).json({
      status: 'error',
      message: 'Внутренняя ошибка сервера'
    });
  }
};

// Get featured products
export const getFeaturedProducts = async (req, res) => {
  try {
    const products = await Product.find({
      isActive: true,
      'availability.inStock': true
    })
      .populate('farmer', 'farmName rating isVerified')
      .sort({ 'rating.average': -1, totalSold: -1 })
      .limit(8);

    res.status(200).json({
      status: 'success',
      data: { products }
    });

  } catch (error) {
    console.error('Ошибка получения рекомендуемых продуктов:', error);
    res.status(500).json({
      status: 'error',
      message: 'Внутренняя ошибка сервера'
    });
  }
};

// Get seasonal products
export const getSeasonalProducts = async (req, res) => {
  try {
    const currentMonth = new Date().getMonth() + 1;

    const products = await Product.find({
      isActive: true,
      'availability.inStock': true,
      $or: [
        { 'seasonality.isSeasonalProduct': false },
        { 'seasonality.availableMonths': currentMonth }
      ]
    })
      .populate('farmer', 'farmName rating isVerified')
      .sort({ createdAt: -1 })
      .limit(12);

    res.status(200).json({
      status: 'success',
      data: { products }
    });

  } catch (error) {
    console.error('Ошибка получения сезонных продуктов:', error);
    res.status(500).json({
      status: 'error',
      message: 'Внутренняя ошибка сервера'
    });
  }
};