import { cache } from '../config/redis.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import Farmer from '../models/Farmer.js';
import mongoose from 'mongoose';

// Get dashboard analytics
export const getDashboardAnalytics = async (req, res) => {
  try {
    const { period = '30', startDate, endDate } = req.query;
    
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    } else {
      const days = parseInt(period);
      const start = new Date();
      start.setDate(start.getDate() - days);
      dateFilter = { createdAt: { $gte: start } };
    }

    // Check cache first
    const cacheKey = `analytics:dashboard:${period}:${startDate || ''}:${endDate || ''}`;
    const cachedData = await cache.get(cacheKey);
    
    if (cachedData) {
      return res.json({
        status: 'success',
        data: cachedData
      });
    }

    // Get analytics data
    const [
      totalUsers,
      totalFarmers,
      totalProducts,
      totalOrders,
      totalRevenue,
      orderStats,
      userGrowth,
      topProducts,
      topFarmers,
      revenueByDay
    ] = await Promise.all([
      User.countDocuments({ isActive: true }),
      Farmer.countDocuments({ isActive: true }),
      Product.countDocuments({ isActive: true }),
      Order.countDocuments(dateFilter),
      Order.aggregate([
        { $match: dateFilter },
        { $group: { _id: null, total: { $sum: '$pricing.total' } } }
      ]),
      getOrderStatistics(dateFilter),
      getUserGrowthData(dateFilter),
      getTopProducts(dateFilter),
      getTopFarmers(dateFilter),
      getRevenueByDay(dateFilter)
    ]);

    const analytics = {
      overview: {
        totalUsers,
        totalFarmers,
        totalProducts,
        totalOrders,
        totalRevenue: totalRevenue[0]?.total || 0
      },
      orderStats,
      userGrowth,
      topProducts,
      topFarmers,
      revenueByDay
    };

    // Cache for 1 hour
    await cache.set(cacheKey, analytics, 3600);

    res.json({
      status: 'success',
      data: analytics
    });

  } catch (error) {
    console.error('Get dashboard analytics error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Внутренняя ошибка сервера'
    });
  }
};

// Get sales analytics
export const getSalesAnalytics = async (req, res) => {
  try {
    const { period = 'month', farmerId } = req.query;
    
    let matchFilter = {};
    if (farmerId) {
      matchFilter['items.farmer'] = new mongoose.Types.ObjectId(farmerId);
    }

    // Set date range based on period
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    matchFilter.createdAt = { $gte: startDate };

    const salesData = await Order.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          totalSales: { $sum: '$pricing.total' },
          orderCount: { $sum: 1 },
          avgOrderValue: { $avg: '$pricing.total' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Get product performance
    const productPerformance = await Order.aggregate([
      { $match: matchFilter },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          totalSold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } },
          orderCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      status: 'success',
      data: {
        salesData,
        productPerformance,
        period,
        dateRange: { startDate, endDate: now }
      }
    });

  } catch (error) {
    console.error('Get sales analytics error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Внутренняя ошибка сервера'
    });
  }
};

// Get user analytics
export const getUserAnalytics = async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const userAnalytics = await User.aggregate([
      {
        $facet: {
          registrationTrend: [
            { $match: { createdAt: { $gte: startDate } } },
            {
              $group: {
                _id: {
                  year: { $year: '$createdAt' },
                  month: { $month: '$createdAt' },
                  day: { $dayOfMonth: '$createdAt' }
                },
                count: { $sum: 1 }
              }
            },
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
          ],
          roleDistribution: [
            { $match: { isActive: true } },
            {
              $group: {
                _id: '$role',
                count: { $sum: 1 }
              }
            }
          ],
          verificationStatus: [
            { $match: { isActive: true } },
            {
              $group: {
                _id: '$isVerified',
                count: { $sum: 1 }
              }
            }
          ],
          activityStatus: [
            {
              $group: {
                _id: '$isActive',
                count: { $sum: 1 }
              }
            }
          ]
        }
      }
    ]);

    // Get user engagement data
    const engagementData = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: '$customer',
          orderCount: { $sum: 1 },
          totalSpent: { $sum: '$pricing.total' },
          lastOrder: { $max: '$createdAt' }
        }
      },
      {
        $bucket: {
          groupBy: '$orderCount',
          boundaries: [1, 2, 5, 10, 20, 50],
          default: '50+',
          output: {
            count: { $sum: 1 },
            avgSpent: { $avg: '$totalSpent' }
          }
        }
      }
    ]);

    res.json({
      status: 'success',
      data: {
        ...userAnalytics[0],
        engagementData
      }
    });

  } catch (error) {
    console.error('Get user analytics error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Внутренняя ошибка сервера'
    });
  }
};

// Get product analytics
export const getProductAnalytics = async (req, res) => {
  try {
    const { period = '30', categoryId } = req.query;
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    let matchFilter = { createdAt: { $gte: startDate } };
    if (categoryId) {
      matchFilter.category = new mongoose.Types.ObjectId(categoryId);
    }

    const productAnalytics = await Product.aggregate([
      {
        $facet: {
          categoryDistribution: [
            { $match: { isActive: true } },
            {
              $group: {
                _id: '$category',
                count: { $sum: 1 },
                avgPrice: { $avg: '$price.amount' }
              }
            },
            {
              $lookup: {
                from: 'categories',
                localField: '_id',
                foreignField: '_id',
                as: 'category'
              }
            },
            { $unwind: '$category' }
          ],
          priceDistribution: [
            { $match: { isActive: true } },
            {
              $bucket: {
                groupBy: '$price.amount',
                boundaries: [0, 100, 300, 500, 1000, 2000],
                default: '2000+',
                output: {
                  count: { $sum: 1 },
                  avgRating: { $avg: '$rating.average' }
                }
              }
            }
          ],
          stockStatus: [
            { $match: { isActive: true } },
            {
              $group: {
                _id: '$availability.inStock',
                count: { $sum: 1 }
              }
            }
          ],
          organicDistribution: [
            { $match: { isActive: true } },
            {
              $group: {
                _id: '$characteristics.isOrganic',
                count: { $sum: 1 },
                avgPrice: { $avg: '$price.amount' }
              }
            }
          ]
        }
      }
    ]);

    // Get product performance from orders
    const productPerformance = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          totalSold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } },
          orderCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      { $sort: { totalRevenue: -1 } },
      { $limit: 20 }
    ]);

    res.json({
      status: 'success',
      data: {
        ...productAnalytics[0],
        productPerformance
      }
    });

  } catch (error) {
    console.error('Get product analytics error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Внутренняя ошибка сервера'
    });
  }
};

// Helper functions
const getOrderStatistics = async (dateFilter) => {
  return await Order.aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalValue: { $sum: '$pricing.total' }
      }
    }
  ]);
};

const getUserGrowthData = async (dateFilter) => {
  return await User.aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        },
        newUsers: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
  ]);
};

const getTopProducts = async (dateFilter) => {
  return await Order.aggregate([
    { $match: dateFilter },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.product',
        totalSold: { $sum: '$items.quantity' },
        totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } }
      }
    },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'product'
      }
    },
    { $unwind: '$product' },
    { $sort: { totalRevenue: -1 } },
    { $limit: 5 }
  ]);
};

const getTopFarmers = async (dateFilter) => {
  return await Order.aggregate([
    { $match: dateFilter },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.farmer',
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } }
      }
    },
    {
      $lookup: {
        from: 'farmers',
        localField: '_id',
        foreignField: '_id',
        as: 'farmer'
      }
    },
    { $unwind: '$farmer' },
    { $sort: { totalRevenue: -1 } },
    { $limit: 5 }
  ]);
};

const getRevenueByDay = async (dateFilter) => {
  return await Order.aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        },
        revenue: { $sum: '$pricing.total' },
        orderCount: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
  ]);
};