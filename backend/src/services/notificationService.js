import { Server } from 'socket.io';
import Notification from '../models/Notification.js';
import emailService from './emailService.js';
import { cache } from '../config/redis.js';

class NotificationService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map();
  }

  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.WEBSOCKET_CORS_ORIGIN || "http://localhost:5173",
        methods: ["GET", "POST"]
      }
    });

    this.io.on('connection', (socket) => {
      console.log(`🔌 User connected: ${socket.id}`);

      socket.on('authenticate', (data) => {
        if (data.userId) {
          this.connectedUsers.set(data.userId, socket.id);
          socket.userId = data.userId;
          socket.join(`user_${data.userId}`);
          console.log(`✅ User authenticated: ${data.userId}`);
        }
      });

      socket.on('disconnect', () => {
        if (socket.userId) {
          this.connectedUsers.delete(socket.userId);
          console.log(`🔌 User disconnected: ${socket.userId}`);
        }
      });
    });

    console.log('🚀 WebSocket server initialized');
  }

  async sendNotification(userId, notification, options = {}) {
    try {
      // Save to database
      const savedNotification = await Notification.create({
        recipient: userId,
        ...notification
      });

      // Send real-time notification if user is online
      if (this.io && this.connectedUsers.has(userId)) {
        this.io.to(`user_${userId}`).emit('notification', {
          id: savedNotification._id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: notification.data,
          createdAt: savedNotification.createdAt
        });
      }

      // Send email notification if enabled
      if (options.sendEmail && notification.type !== 'system') {
        await this.sendEmailNotification(userId, notification);
      }

      // Send SMS notification if enabled and urgent
      if (options.sendSMS && notification.priority === 'urgent') {
        await this.sendSMSNotification(userId, notification);
      }

      return savedNotification;

    } catch (error) {
      console.error('Notification sending error:', error);
      throw error;
    }
  }

  async sendBulkNotifications(userIds, notification, options = {}) {
    const results = [];
    const batchSize = 50;

    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize);
      
      const batchPromises = batch.map(userId => 
        this.sendNotification(userId, notification, options)
      );
      
      const batchResults = await Promise.allSettled(batchPromises);
      results.push(...batchResults);
    }

    return results;
  }

  async sendEmailNotification(userId, notification) {
    try {
      const User = (await import('../models/User.js')).default;
      const user = await User.findById(userId);
      
      if (!user || !user.email) return;

      let templateName = 'notification';
      let templateData = {
        firstName: user.firstName,
        title: notification.title,
        message: notification.message,
        actionUrl: notification.data?.url
      };

      // Use specific templates for certain notification types
      switch (notification.type) {
        case 'order_confirmed':
          templateName = 'orderConfirmation';
          templateData = {
            customerName: user.firstName,
            orderNumber: notification.data?.orderNumber,
            deliveryDate: notification.data?.deliveryDate,
            total: notification.data?.total,
            trackingUrl: notification.data?.trackingUrl
          };
          break;
        
        case 'promotional_offer':
          templateName = 'promotionalOffer';
          templateData = {
            firstName: user.firstName,
            offerTitle: notification.title,
            subtitle: notification.data?.subtitle,
            description: notification.message,
            promoCode: notification.data?.promoCode,
            discount: notification.data?.discount,
            expiryDate: notification.data?.expiryDate,
            shopUrl: notification.data?.shopUrl
          };
          break;
      }

      await emailService.sendEmail(user.email, templateName, templateData);

    } catch (error) {
      console.error('Email notification error:', error);
    }
  }

  async sendSMSNotification(userId, notification) {
    try {
      // SMS implementation would go here
      // This is a placeholder for SMS service integration
      console.log(`📱 SMS notification sent to user ${userId}: ${notification.title}`);
    } catch (error) {
      console.error('SMS notification error:', error);
    }
  }

  async markAsRead(userId, notificationId) {
    try {
      const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, recipient: userId },
        { isRead: true, readAt: new Date() },
        { new: true }
      );

      if (notification && this.io && this.connectedUsers.has(userId)) {
        this.io.to(`user_${userId}`).emit('notificationRead', {
          id: notificationId
        });
      }

      return notification;
    } catch (error) {
      console.error('Mark notification as read error:', error);
      throw error;
    }
  }

  async getUnreadCount(userId) {
    try {
      const cacheKey = `unread_notifications:${userId}`;
      let count = await cache.get(cacheKey);
      
      if (count === null) {
        count = await Notification.countDocuments({
          recipient: userId,
          isRead: false
        });
        await cache.set(cacheKey, count, 300); // Cache for 5 minutes
      }
      
      return count;
    } catch (error) {
      console.error('Get unread count error:', error);
      return 0;
    }
  }

  // Predefined notification templates
  static templates = {
    orderCreated: (orderData) => ({
      type: 'order_created',
      title: 'Заказ создан',
      message: `Ваш заказ #${orderData.orderNumber} успешно создан и ожидает подтверждения.`,
      data: { orderId: orderData.orderId, orderNumber: orderData.orderNumber },
      priority: 'medium'
    }),

    orderConfirmed: (orderData) => ({
      type: 'order_confirmed',
      title: 'Заказ подтвержден',
      message: `Ваш заказ #${orderData.orderNumber} подтвержден и готовится к отправке.`,
      data: orderData,
      priority: 'high'
    }),

    orderShipped: (orderData) => ({
      type: 'order_shipped',
      title: 'Заказ отправлен',
      message: `Ваш заказ #${orderData.orderNumber} отправлен и скоро будет доставлен.`,
      data: orderData,
      priority: 'high'
    }),

    orderDelivered: (orderData) => ({
      type: 'order_delivered',
      title: 'Заказ доставлен',
      message: `Ваш заказ #${orderData.orderNumber} успешно доставлен. Спасибо за покупку!`,
      data: orderData,
      priority: 'medium'
    }),

    paymentReceived: (paymentData) => ({
      type: 'payment_received',
      title: 'Платеж получен',
      message: `Ваш платеж на сумму ${paymentData.amount} ₽ успешно обработан.`,
      data: paymentData,
      priority: 'medium'
    }),

    reviewReceived: (reviewData) => ({
      type: 'review_received',
      title: 'Новый отзыв',
      message: `Вы получили новый отзыв на продукт "${reviewData.productName}".`,
      data: reviewData,
      priority: 'low'
    }),

    productLowStock: (productData) => ({
      type: 'product_low_stock',
      title: 'Заканчивается товар',
      message: `У продукта "${productData.productName}" осталось всего ${productData.quantity} единиц.`,
      data: productData,
      priority: 'medium'
    }),

    promotionalOffer: (offerData) => ({
      type: 'promotional_offer',
      title: offerData.title,
      message: offerData.description,
      data: offerData,
      priority: 'low'
    })
  };
}

export default new NotificationService();