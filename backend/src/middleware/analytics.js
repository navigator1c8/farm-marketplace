import { cache } from '../config/redis.js';

// Analytics tracking middleware
export const trackAnalytics = async (req, res, next) => {
  const startTime = Date.now();
  
  // Store original json method
  const originalJson = res.json;
  
  // Override json method to track response
  res.json = function(data) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    // Track analytics data
    trackRequest({
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      responseTime,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: req.user?.id,
      timestamp: new Date()
    });
    
    originalJson.call(this, data);
  };
  
  next();
};

// Track request data
const trackRequest = async (data) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const hour = new Date().getHours();
    
    // Daily stats
    const dailyKey = `analytics:daily:${today}`;
    const dailyStats = await cache.get(dailyKey) || {
      requests: 0,
      errors: 0,
      avgResponseTime: 0,
      uniqueUsers: new Set(),
      endpoints: {},
      userAgents: {},
      statusCodes: {}
    };
    
    dailyStats.requests++;
    if (data.statusCode >= 400) dailyStats.errors++;
    dailyStats.avgResponseTime = (dailyStats.avgResponseTime + data.responseTime) / 2;
    
    if (data.userId) dailyStats.uniqueUsers.add(data.userId);
    
    // Track endpoints
    if (!dailyStats.endpoints[data.path]) {
      dailyStats.endpoints[data.path] = 0;
    }
    dailyStats.endpoints[data.path]++;
    
    // Track user agents
    const browser = extractBrowser(data.userAgent);
    if (!dailyStats.userAgents[browser]) {
      dailyStats.userAgents[browser] = 0;
    }
    dailyStats.userAgents[browser]++;
    
    // Track status codes
    if (!dailyStats.statusCodes[data.statusCode]) {
      dailyStats.statusCodes[data.statusCode] = 0;
    }
    dailyStats.statusCodes[data.statusCode]++;
    
    // Convert Set to Array for JSON serialization
    dailyStats.uniqueUsers = Array.from(dailyStats.uniqueUsers);
    
    await cache.set(dailyKey, dailyStats, 86400); // 24 hours
    
    // Hourly stats
    const hourlyKey = `analytics:hourly:${today}:${hour}`;
    const hourlyStats = await cache.get(hourlyKey) || { requests: 0, errors: 0 };
    hourlyStats.requests++;
    if (data.statusCode >= 400) hourlyStats.errors++;
    
    await cache.set(hourlyKey, hourlyStats, 3600); // 1 hour
    
  } catch (error) {
    console.error('Analytics tracking error:', error);
  }
};

// Extract browser from user agent
const extractBrowser = (userAgent) => {
  if (!userAgent) return 'Unknown';
  
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  if (userAgent.includes('Opera')) return 'Opera';
  
  return 'Other';
};

// Get analytics data
export const getAnalytics = async (req, res) => {
  try {
    const { period = 'daily', date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    let analyticsData;
    
    if (period === 'daily') {
      const key = `analytics:daily:${targetDate}`;
      analyticsData = await cache.get(key);
    } else if (period === 'hourly') {
      const hourlyData = [];
      for (let hour = 0; hour < 24; hour++) {
        const key = `analytics:hourly:${targetDate}:${hour}`;
        const data = await cache.get(key) || { requests: 0, errors: 0 };
        hourlyData.push({ hour, ...data });
      }
      analyticsData = { hourlyData };
    }
    
    res.json({
      status: 'success',
      data: analyticsData || { message: 'No data available for this period' }
    });
    
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve analytics data'
    });
  }
};