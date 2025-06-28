import { cache } from '../config/redis.js';

// Cache middleware for GET requests
export const cacheMiddleware = (duration = 3600, keyGenerator = null) => {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    try {
      // Generate cache key
      const cacheKey = keyGenerator 
        ? keyGenerator(req)
        : `cache:${req.originalUrl}:${JSON.stringify(req.query)}`;

      // Try to get from cache
      const cachedData = await cache.get(cacheKey);
      
      if (cachedData) {
        console.log(`🎯 Cache hit: ${cacheKey}`);
        return res.json(cachedData);
      }

      // Store original json method
      const originalJson = res.json;

      // Override json method to cache response
      res.json = function(data) {
        // Only cache successful responses
        if (res.statusCode === 200) {
          cache.set(cacheKey, data, duration);
          console.log(`💾 Cached: ${cacheKey}`);
        }
        
        // Call original json method
        originalJson.call(this, data);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next();
    }
  };
};

// Cache invalidation middleware
export const invalidateCache = (patterns = []) => {
  return async (req, res, next) => {
    // Store original json method
    const originalJson = res.json;

    // Override json method to invalidate cache after successful operations
    res.json = function(data) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Invalidate cache patterns
        patterns.forEach(async (pattern) => {
          try {
            await cache.del(pattern);
            console.log(`🗑️ Cache invalidated: ${pattern}`);
          } catch (error) {
            console.error('Cache invalidation error:', error);
          }
        });
      }
      
      originalJson.call(this, data);
    };

    next();
  };
};

// User-specific cache
export const userCache = (duration = 1800) => {
  return cacheMiddleware(duration, (req) => {
    return `user:${req.user?.id}:${req.originalUrl}:${JSON.stringify(req.query)}`;
  });
};

// Product cache
export const productCache = (duration = 3600) => {
  return cacheMiddleware(duration, (req) => {
    return `products:${req.originalUrl}:${JSON.stringify(req.query)}`;
  });
};

// Farmer cache
export const farmerCache = (duration = 1800) => {
  return cacheMiddleware(duration, (req) => {
    return `farmers:${req.originalUrl}:${JSON.stringify(req.query)}`;
  });
};