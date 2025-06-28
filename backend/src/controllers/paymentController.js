import Payment from '../models/Payment.js';
import Order from '../models/Order.js';

// Get payments
export const getPayments = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, method } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (method) filter.method = method;

    // If not admin, filter by user's orders
    if (req.user.role !== 'admin') {
      const userOrders = await Order.find({ customer: req.user.id }).select('_id');
      filter.order = { $in: userOrders.map(order => order._id) };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const payments = await Payment.find(filter)
      .populate('order', 'orderNumber customer pricing')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Payment.countDocuments(filter);

    res.status(200).json({
      status: 'success',
      data: {
        payments,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Ошибка получения платежей:', error);
    res.status(500).json({
      status: 'error',
      message: 'Внутренняя ошибка сервера'
    });
  }
};

// Get payment by ID
export const getPayment = async (req, res) => {
  try {
    const { id } = req.params;

    const payment = await Payment.findById(id)
      .populate('order', 'orderNumber customer pricing');

    if (!payment) {
      return res.status(404).json({
        status: 'error',
        message: 'Платеж не найден'
      });
    }

    // Check access rights
    if (req.user.role !== 'admin') {
      const order = await Order.findById(payment.order._id);
      if (order.customer.toString() !== req.user.id) {
        return res.status(403).json({
          status: 'error',
          message: 'Нет доступа к этому платежу'
        });
      }
    }

    res.status(200).json({
      status: 'success',
      data: { payment }
    });

  } catch (error) {
    console.error('Ошибка получения платежа:', error);
    res.status(500).json({
      status: 'error',
      message: 'Внутренняя ошибка сервера'
    });
  }
};

// Create payment
export const createPayment = async (req, res) => {
  try {
    const { orderId, method, provider } = req.body;

    // Validate order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Заказ не найден'
      });
    }

    if (order.customer.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Нет доступа к этому заказу'
      });
    }

    // Check if payment already exists
    const existingPayment = await Payment.findOne({ order: orderId });
    if (existingPayment) {
      return res.status(400).json({
        status: 'error',
        message: 'Платеж для этого заказа уже существует'
      });
    }

    const payment = await Payment.create({
      order: orderId,
      amount: order.pricing.total,
      method,
      provider,
      description: `Оплата заказа ${order.orderNumber}`
    });

    res.status(201).json({
      status: 'success',
      message: 'Платеж создан',
      data: { payment }
    });

  } catch (error) {
    console.error('Ошибка создания платежа:', error);
    res.status(500).json({
      status: 'error',
      message: 'Внутренняя ошибка сервера'
    });
  }
};

// Update payment status
export const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, transactionId, metadata } = req.body;

    const payment = await Payment.findById(id);
    if (!payment) {
      return res.status(404).json({
        status: 'error',
        message: 'Платеж не найден'
      });
    }

    payment.status = status;
    if (transactionId) payment.transactionId = transactionId;
    if (metadata) payment.metadata = { ...payment.metadata, ...metadata };

    // Update timestamps
    if (status === 'succeeded') {
      payment.processedAt = new Date();
      
      // Update order payment status
      await Order.findByIdAndUpdate(payment.order, {
        'payment.status': 'paid',
        'payment.paidAt': new Date()
      });
    } else if (status === 'failed') {
      payment.failedAt = new Date();
    }

    await payment.save();

    res.status(200).json({
      status: 'success',
      message: 'Статус платежа обновлен',
      data: { payment }
    });

  } catch (error) {
    console.error('Ошибка обновления статуса платежа:', error);
    res.status(500).json({
      status: 'error',
      message: 'Внутренняя ошибка сервера'
    });
  }
};

// Process refund
export const processRefund = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, reason } = req.body;

    const payment = await Payment.findById(id);
    if (!payment) {
      return res.status(404).json({
        status: 'error',
        message: 'Платеж не найден'
      });
    }

    if (payment.status !== 'succeeded') {
      return res.status(400).json({
        status: 'error',
        message: 'Можно вернуть только успешные платежи'
      });
    }

    const refundAmount = amount || payment.amount;
    const totalRefunded = payment.refunds.reduce((sum, refund) => 
      refund.status === 'succeeded' ? sum + refund.amount : sum, 0
    );

    if (totalRefunded + refundAmount > payment.amount) {
      return res.status(400).json({
        status: 'error',
        message: 'Сумма возврата превышает сумму платежа'
      });
    }

    // Add refund record
    payment.refunds.push({
      amount: refundAmount,
      reason,
      refundId: `REF${Date.now()}`,
      processedAt: new Date(),
      status: 'succeeded'
    });

    // Update payment status
    if (totalRefunded + refundAmount === payment.amount) {
      payment.status = 'refunded';
    } else {
      payment.status = 'partially_refunded';
    }

    await payment.save();

    res.status(200).json({
      status: 'success',
      message: 'Возврат обработан',
      data: { payment }
    });

  } catch (error) {
    console.error('Ошибка обработки возврата:', error);
    res.status(500).json({
      status: 'error',
      message: 'Внутренняя ошибка сервера'
    });
  }
};

// Get payment statistics
export const getPaymentStats = async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    const stats = await Payment.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: null,
          totalPayments: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          successfulPayments: {
            $sum: { $cond: [{ $eq: ['$status', 'succeeded'] }, 1, 0] }
          },
          failedPayments: {
            $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
          },
          totalRefunded: {
            $sum: {
              $reduce: {
                input: '$refunds',
                initialValue: 0,
                in: {
                  $add: [
                    '$$value',
                    { $cond: [{ $eq: ['$$this.status', 'succeeded'] }, '$$this.amount', 0] }
                  ]
                }
              }
            }
          }
        }
      }
    ]);

    const result = stats[0] || {
      totalPayments: 0,
      totalAmount: 0,
      successfulPayments: 0,
      failedPayments: 0,
      totalRefunded: 0
    };

    res.status(200).json({
      status: 'success',
      data: { stats: result }
    });

  } catch (error) {
    console.error('Ошибка получения статистики платежей:', error);
    res.status(500).json({
      status: 'error',
      message: 'Внутренняя ошибка сервера'
    });
  }
};