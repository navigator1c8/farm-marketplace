import Delivery from '../models/Delivery.js';
import Order from '../models/Order.js';

// Get deliveries
export const getDeliveries = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, date } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      filter.scheduledDate = { $gte: startDate, $lt: endDate };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const deliveries = await Delivery.find(filter)
      .populate('order', 'orderNumber customer pricing')
      .populate('pickupLocation', 'name address')
      .sort({ scheduledDate: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Delivery.countDocuments(filter);

    res.status(200).json({
      status: 'success',
      data: {
        deliveries,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Ошибка получения доставок:', error);
    res.status(500).json({
      status: 'error',
      message: 'Внутренняя ошибка сервера'
    });
  }
};

// Get delivery by ID
export const getDelivery = async (req, res) => {
  try {
    const { id } = req.params;

    const delivery = await Delivery.findById(id)
      .populate('order', 'orderNumber customer items pricing')
      .populate('pickupLocation');

    if (!delivery) {
      return res.status(404).json({
        status: 'error',
        message: 'Доставка не найдена'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { delivery }
    });

  } catch (error) {
    console.error('Ошибка получения доставки:', error);
    res.status(500).json({
      status: 'error',
      message: 'Внутренняя ошибка сервера'
    });
  }
};

// Create delivery
export const createDelivery = async (req, res) => {
  try {
    const delivery = await Delivery.create(req.body);

    res.status(201).json({
      status: 'success',
      message: 'Доставка создана',
      data: { delivery }
    });

  } catch (error) {
    console.error('Ошибка создания доставки:', error);
    res.status(500).json({
      status: 'error',
      message: 'Внутренняя ошибка сервера'
    });
  }
};

// Update delivery status
export const updateDeliveryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, location } = req.body;

    const delivery = await Delivery.findById(id);
    if (!delivery) {
      return res.status(404).json({
        status: 'error',
        message: 'Доставка не найдена'
      });
    }

    delivery.status = status;
    if (notes) delivery.notes = notes;

    // Update timestamps based on status
    if (status === 'in_transit' && !delivery.actualPickupTime) {
      delivery.actualPickupTime = new Date();
    }
    if (status === 'delivered') {
      delivery.actualDeliveryTime = new Date();
    }

    // Add location to route if provided
    if (location && location.latitude && location.longitude) {
      delivery.route.push({
        latitude: location.latitude,
        longitude: location.longitude,
        timestamp: new Date()
      });
    }

    await delivery.save();

    res.status(200).json({
      status: 'success',
      message: 'Статус доставки обновлен',
      data: { delivery }
    });

  } catch (error) {
    console.error('Ошибка обновления статуса доставки:', error);
    res.status(500).json({
      status: 'error',
      message: 'Внутренняя ошибка сервера'
    });
  }
};

// Assign driver
export const assignDriver = async (req, res) => {
  try {
    const { id } = req.params;
    const { driver } = req.body;

    const delivery = await Delivery.findByIdAndUpdate(
      id,
      { 
        driver,
        status: 'assigned'
      },
      { new: true }
    );

    if (!delivery) {
      return res.status(404).json({
        status: 'error',
        message: 'Доставка не найдена'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Водитель назначен',
      data: { delivery }
    });

  } catch (error) {
    console.error('Ошибка назначения водителя:', error);
    res.status(500).json({
      status: 'error',
      message: 'Внутренняя ошибка сервера'
    });
  }
};

// Rate delivery
export const rateDelivery = async (req, res) => {
  try {
    const { id } = req.params;
    const { score, comment } = req.body;

    const delivery = await Delivery.findById(id);
    if (!delivery) {
      return res.status(404).json({
        status: 'error',
        message: 'Доставка не найдена'
      });
    }

    if (delivery.status !== 'delivered') {
      return res.status(400).json({
        status: 'error',
        message: 'Можно оценить только доставленный заказ'
      });
    }

    delivery.rating = {
      score,
      comment,
      ratedAt: new Date()
    };

    await delivery.save();

    res.status(200).json({
      status: 'success',
      message: 'Оценка доставки сохранена',
      data: { delivery }
    });

  } catch (error) {
    console.error('Ошибка оценки доставки:', error);
    res.status(500).json({
      status: 'error',
      message: 'Внутренняя ошибка сервера'
    });
  }
};