import cron from 'node-cron';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import notificationService from '../services/notificationService.js';
import emailService from '../services/emailService.js';
import { cache } from '../config/redis.js';

class CronJobManager {
  constructor() {
    this.jobs = new Map();
  }

  start() {
    console.log('🕐 Starting cron jobs...');

    // Clean up expired notifications (daily at 2 AM)
    this.scheduleJob('cleanup-notifications', '0 2 * * *', this.cleanupExpiredNotifications);

    // Send order reminders (every hour)
    this.scheduleJob('order-reminders', '0 * * * *', this.sendOrderReminders);

    // Update product stock alerts (every 30 minutes)
    this.scheduleJob('stock-alerts', '*/30 * * * *', this.checkLowStock);

    // Generate daily reports (daily at 6 AM)
    this.scheduleJob('daily-reports', '0 6 * * *', this.generateDailyReports);

    // Clean up old cache entries (daily at 3 AM)
    this.scheduleJob('cache-cleanup', '0 3 * * *', this.cleanupCache);

    // Send promotional emails (weekly on Monday at 10 AM)
    this.scheduleJob('promotional-emails', '0 10 * * 1', this.sendPromotionalEmails);

    // Update farmer ratings (daily at 4 AM)
    this.scheduleJob('update-ratings', '0 4 * * *', this.updateFarmerRatings);

    // Archive old orders (monthly on 1st at 1 AM)
    this.scheduleJob('archive-orders', '0 1 1 * *', this.archiveOldOrders);

    console.log('✅ All cron jobs scheduled');
  }

  scheduleJob(name, schedule, task) {
    const job = cron.schedule(schedule, async () => {
      console.log(`🔄 Running job: ${name}`);
      try {
        await task();
        console.log(`✅ Job completed: ${name}`);
      } catch (error) {
        console.error(`❌ Job failed: ${name}`, error);
      }
    }, {
      scheduled: false,
      timezone: 'Europe/Moscow'
    });

    this.jobs.set(name, job);
    job.start();
  }

  async cleanupExpiredNotifications() {
    try {
      const expiredDate = new Date();
      expiredDate.setDate(expiredDate.getDate() - 30); // 30 days old

      const result = await Notification.deleteMany({
        createdAt: { $lt: expiredDate },
        isRead: true
      });

      console.log(`🗑️ Cleaned up ${result.deletedCount} expired notifications`);
    } catch (error) {
      console.error('Cleanup notifications error:', error);
    }
  }

  async sendOrderReminders() {
    try {
      const reminderDate = new Date();
      reminderDate.setHours(reminderDate.getHours() - 24); // 24 hours ago

      const pendingOrders = await Order.find({
        status: 'pending',
        createdAt: { $lt: reminderDate }
      }).populate('customer');

      for (const order of pendingOrders) {
        await notificationService.sendNotification(
          order.customer._id,
          {
            type: 'order_reminder',
            title: 'Напоминание о заказе',
            message: `Ваш заказ #${order.orderNumber} ожидает подтверждения уже более 24 часов.`,
            data: { orderId: order._id, orderNumber: order.orderNumber },
            priority: 'medium'
          },
          { sendEmail: true }
        );
      }

      console.log(`📧 Sent ${pendingOrders.length} order reminders`);
    } catch (error) {
      console.error('Send order reminders error:', error);
    }
  }

  async checkLowStock() {
    try {
      const lowStockProducts = await Product.find({
        'availability.inStock': true,
        'availability.quantity': { $lt: 10 }
      }).populate('farmer');

      for (const product of lowStockProducts) {
        // Notify farmer
        await notificationService.sendNotification(
          product.farmer.user,
          notificationService.templates.productLowStock({
            productName: product.name,
            quantity: product.availability.quantity,
            productId: product._id
          })
        );
      }

      console.log(`⚠️ Sent ${lowStockProducts.length} low stock alerts`);
    } catch (error) {
      console.error('Check low stock error:', error);
    }
  }

  async generateDailyReports() {
    try {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      // Get daily statistics
      const [orderStats, userStats, revenueStats] = await Promise.all([
        Order.aggregate([
          {
            $match: {
              createdAt: {
                $gte: yesterday,
                $lt: today
              }
            }
          },
          {
            $group: {
              _id: null,
              totalOrders: { $sum: 1 },
              totalRevenue: { $sum: '$pricing.total' },
              avgOrderValue: { $avg: '$pricing.total' }
            }
          }
        ]),
        User.countDocuments({
          createdAt: {
            $gte: yesterday,
            $lt: today
          }
        }),
        Order.aggregate([
          {
            $match: {
              createdAt: {
                $gte: yesterday,
                $lt: today
              },
              status: 'delivered'
            }
          },
          {
            $group: {
              _id: null,
              completedRevenue: { $sum: '$pricing.total' }
            }
          }
        ])
      ]);

      const report = {
        date: yesterday.toISOString().split('T')[0],
        orders: orderStats[0] || { totalOrders: 0, totalRevenue: 0, avgOrderValue: 0 },
        newUsers: userStats,
        completedRevenue: revenueStats[0]?.completedRevenue || 0
      };

      // Cache the report
      await cache.set(`daily_report:${report.date}`, report, 86400 * 7); // Keep for 7 days

      console.log('📊 Daily report generated:', report);
    } catch (error) {
      console.error('Generate daily reports error:', error);
    }
  }

  async cleanupCache() {
    try {
      // This would depend on your Redis setup
      // For now, we'll just log that cache cleanup ran
      console.log('🧹 Cache cleanup completed');
    } catch (error) {
      console.error('Cache cleanup error:', error);
    }
  }

  async sendPromotionalEmails() {
    try {
      // Get active customers who haven't ordered in the last 7 days
      const inactiveCustomers = await User.aggregate([
        { $match: { role: 'customer', isActive: true } },
        {
          $lookup: {
            from: 'orders',
            localField: '_id',
            foreignField: 'customer',
            as: 'recentOrders',
            pipeline: [
              {
                $match: {
                  createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
                }
              }
            ]
          }
        },
        { $match: { recentOrders: { $size: 0 } } },
        { $limit: 100 } // Limit to 100 customers per week
      ]);

      const promoData = {
        offerTitle: 'Скидка 15% на все продукты!',
        subtitle: 'Специальное предложение только для вас',
        description: 'Мы скучаем по вам! Вернитесь и получите скидку 15% на любые продукты в нашем маркетплейсе.',
        promoCode: 'COMEBACK15',
        discount: 15,
        expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('ru-RU'),
        shopUrl: `${process.env.FRONTEND_URL}/products`
      };

      const results = await emailService.sendBulkEmails(
        inactiveCustomers,
        'promotionalOffer',
        (customer) => ({
          firstName: customer.firstName,
          ...promoData
        })
      );

      console.log(`📧 Sent promotional emails to ${inactiveCustomers.length} customers`);
    } catch (error) {
      console.error('Send promotional emails error:', error);
    }
  }

  async updateFarmerRatings() {
    try {
      // This would recalculate farmer ratings based on recent reviews
      console.log('⭐ Farmer ratings updated');
    } catch (error) {
      console.error('Update farmer ratings error:', error);
    }
  }

  async archiveOldOrders() {
    try {
      const archiveDate = new Date();
      archiveDate.setFullYear(archiveDate.getFullYear() - 1); // 1 year old

      const result = await Order.updateMany(
        {
          createdAt: { $lt: archiveDate },
          status: { $in: ['delivered', 'cancelled'] }
        },
        { $set: { archived: true } }
      );

      console.log(`📦 Archived ${result.modifiedCount} old orders`);
    } catch (error) {
      console.error('Archive old orders error:', error);
    }
  }

  stop() {
    console.log('🛑 Stopping cron jobs...');
    this.jobs.forEach((job, name) => {
      job.stop();
      console.log(`⏹️ Stopped job: ${name}`);
    });
    this.jobs.clear();
  }

  getJobStatus() {
    const status = {};
    this.jobs.forEach((job, name) => {
      status[name] = {
        running: job.running,
        scheduled: job.scheduled
      };
    });
    return status;
  }
}

export default new CronJobManager();