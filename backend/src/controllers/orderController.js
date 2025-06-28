import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Farmer from '../models/Farmer.js';
import User from '../models/User.js';
import { validationResult } from 'express-validator';
import { sendEmail } from '../utils/email.js';

// Create new order
export const createOrder = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Ошибки валидации',
        errors: errors.array()
      });
    }

    const { items, delivery, payment, notes } = req.body;

    // Validate products and calculate pricing
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product).populate('farmer');
      if (!product || !product.availability.inStock) {
        return res.status(400).json({
          status: 'error',
          message: `Продукт ${product?.name || 'не найден'} недоступен`
        });
      }

      if (item.quantity > product.availability.quantity) {
        return res.status(400).json({
          status: 'error',
          message: `Недостаточно товара ${product.name} на складе`
        });
      }

      const itemTotal = product.currentPrice * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        product: product._id,
        farmer: product.farmer._id,
        quantity: item.quantity,
        price: product.currentPrice,
        unit: product.price.unit
      });

      // Update product quantity
      product.availability.quantity -= item.quantity;
      if (product.availability.quantity === 0) {
        product.availability.inStock = false;
      }
      await product.save();
    }

    // Calculate delivery fee
    let deliveryFee = 0;
    if (delivery.type === 'delivery') {
      deliveryFee = subtotal < 2000 ? 200 : 0; // Free delivery for orders over 2000₽
    }

    const total = subtotal + deliveryFee;

    // Create order
    const order = await Order.create({
      customer: req.user.id,
      items: orderItems,
      pricing: {
        subtotal,
        deliveryFee,
        total
      },
      delivery,
      payment,
      notes: { customer: notes }
    });

    // Populate order data
    await order.populate([
      { path: 'customer', select: 'firstName lastName email phone' },
      { path: 'items.product', select: 'name images' },
      { path: 'items.farmer', select: 'farmName', populate: { path: 'user', select: 'firstName lastName' } }
    ]);

    // Send confirmation email
    try {
      await sendEmail({
        to: req.user.email,
        template: 'orderConfirmation',
        data: {
          customerName: req.user.firstName,
          orderNumber: order.orderNumber,
          deliveryDate: new Date(delivery.scheduledDate).toLocaleDateString('ru-RU'),
          total: total
        }
      });
    } catch (emailError) {
      console.error('Ошибка отправки email подтверждения:', emailError);
    }

    res.status(201).json({
      status: 'success',
      message: 'Заказ успешно создан',
      data: { order }
    });

  } catch (error) {
    console.error('Ошибка создания заказа:', error);
    res.status(500).json({
      status: 'error',
      message: 'Внутренняя ошибка сервера'
    });
  }
};

// Get user orders
export const getUserOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const filter = { customer: req.user.id };
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const orders = await Order.find(filter)
      .populate([
        { path: 'items.product', select: 'name images' },
        { path: 'items.farmer', select: 'farmName', populate: { path: 'user', select: 'firstName lastName' } }
      ])
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(filter);

    res.status(200).json({
      status: 'success',
      data: {
        orders,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Ошибка получения заказов:', error);
    res.status(500).json({
      status: 'error',
      message: 'Внутренняя ошибка сервера'
    });
  }
};

// Get single order
export const getOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id)
      .populate([
        { path: 'customer', select: 'firstName lastName email phone' },
        { path: 'items.product', select: 'name description images price' },
        { path: 'items.farmer', select: 'farmName farmLocation', populate: { path: 'user', select: 'firstName lastName phone' } }
      ]);

    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Заказ не найден'
      });
    }

    // Check if user has access to this order
    if (order.customer._id.toString() !== req.user.id && req.user.role !== 'admin') {
      // Check if user is a farmer involved in this order
      const farmerIds = order.items.map(item => item.farmer._id.toString());
      const userFarmer = await Farmer.findOne({ user: req.user.id });
      
      if (!userFarmer || !farmerIds.includes(userFarmer._id.toString())) {
        return res.status(403).json({
          status: 'error',
          message: 'Нет доступа к этому заказу'
        });
      }
    }

    res.status(200).json({
      status: 'success',
      data: { order }
    });

  } catch (error) {
    console.error('Ошибка получения заказа:', error);
    res.status(500).json({
      status: 'error',
      message: 'Внутренняя ошибка сервера'
    });
  }
};

// Update order status (farmers and admin)
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Заказ не найден'
      });
    }

    // Check permissions
    if (req.user.role !== 'admin') {
      const farmerIds = order.items.map(item => item.farmer.toString());
      const userFarmer = await Farmer.findOne({ user: req.user.id });
      
      if (!userFarmer || !farmerIds.includes(userFarmer._id.toString())) {
        return res.status(403).json({
          status: 'error',
          message: 'Нет прав для изменения статуса заказа'
        });
      }
    }

    // Update status
    order.status = status;
    
    // Add tracking entry
    order.tracking.push({
      status,
      note,
      updatedBy: req.user.id
    });

    await order.save();

    res.status(200).json({
      status: 'success',
      message: 'Статус заказа обновлен',
      data: { order }
    });

  } catch (error) {
    console.error('Ошибка обновления статуса заказа:', error);
    res.status(500).json({
      status: 'error',
      message: 'Внутренняя ошибка сервера'
    });
  }
};

// Cancel order
export const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Заказ не найден'
      });
    }

    // Check if user can cancel this order
    if (order.customer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Нет прав для отмены заказа'
      });
    }

    // Check if order can be cancelled
    if (['delivered', 'cancelled'].includes(order.status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Заказ нельзя отменить'
      });
    }

    // Update order
    order.status = 'cancelled';
    order.cancellation = {
      reason,
      cancelledBy: req.user.id,
      cancelledAt: new Date()
    };

    // Add tracking entry
    order.tracking.push({
      status: 'cancelled',
      note: `Заказ отменен: ${reason}`,
      updatedBy: req.user.id
    });

    await order.save();

    // Restore product quantities
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (product) {
        product.availability.quantity += item.quantity;
        product.availability.inStock = true;
        await product.save();
      }
    }

    res.status(200).json({
      status: 'success',
      message: 'Заказ отменен',
      data: { order }
    });

  } catch (error) {
    console.error('Ошибка отмены заказа:', error);
    res.status(500).json({
      status: 'error',
      message: 'Внутренняя ошибка сервера'
    });
  }
};

// Get farmer orders
export const getFarmerOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const farmer = await Farmer.findOne({ user: req.user.id });
    if (!farmer) {
      return res.status(404).json({
        status: 'error',
        message: 'Профиль фермера не найден'
      });
    }

    const filter = { 'items.farmer': farmer._id };
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const orders = await Order.find(filter)
      .populate([
        { path: 'customer', select: 'firstName lastName email phone' },
        { path: 'items.product', select: 'name images' }
      ])
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(filter);

    res.status(200).json({
      status: 'success',
      data: {
        orders,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Ошибка получения заказов фермера:', error);
    res.status(500).json({
      status: 'error',
      message: 'Внутренняя ошибка сервера'
    });
  }
};

// Get order statistics
export const getOrderStats = async (req, res) => {
  try {
    const { period = '30' } = req.query; // days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    let matchFilter = { createdAt: { $gte: startDate } };

    // If farmer, filter by their orders
    if (req.user.role === 'farmer') {
      const farmer = await Farmer.findOne({ user: req.user.id });
      if (farmer) {
        matchFilter['items.farmer'] = farmer._id;
      }
    }

    const stats = await Order.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$pricing.total' },
          averageOrderValue: { $avg: '$pricing.total' },
          pendingOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          completedOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
          }
        }
      }
    ]);

    const result = stats[0] || {
      totalOrders: 0,
      totalRevenue: 0,
      averageOrderValue: 0,
      pendingOrders: 0,
      completedOrders: 0
    };

    res.status(200).json({
      status: 'success',
      data: { stats: result }
    });

  } catch (error) {
    console.error('Ошибка получения статистики заказов:', error);
    res.status(500).json({
      status: 'error',
      message: 'Внутренняя ошибка сервера'
    });
  }
};