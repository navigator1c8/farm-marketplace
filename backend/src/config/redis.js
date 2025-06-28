import Redis from 'redis';

let redisClient = null;

const connectRedis = async () => {
  try {
    if (!redisClient) {
      redisClient = Redis.createClient({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        db: process.env.REDIS_DB || 0,
        retryDelayOnFailover: 100,
        enableReadyCheck: true,
        maxRetriesPerRequest: 3,
      });

      redisClient.on('error', (err) => {
        console.error('❌ Redis connection error:', err);
      });

      redisClient.on('connect', () => {
        console.log('✅ Redis connected successfully');
      });

      redisClient.on('ready', () => {
        console.log('🚀 Redis ready for operations');
      });

      await redisClient.connect();
    }

    return redisClient;
  } catch (error) {
    console.error('❌ Failed to connect to Redis:', error);
    return null;
  }
};

// Cache helper functions
export const cache = {
  async get(key) {
    try {
      if (!redisClient) await connectRedis();
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  },

  async set(key, value, ttl = 3600) {
    try {
      if (!redisClient) await connectRedis();
      await redisClient.setEx(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  },

  async del(key) {
    try {
      if (!redisClient) await connectRedis();
      await redisClient.del(key);
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  },

  async flush() {
    try {
      if (!redisClient) await connectRedis();
      await redisClient.flushDb();
      return true;
    } catch (error) {
      console.error('Cache flush error:', error);
      return false;
    }
  },

  async exists(key) {
    try {
      if (!redisClient) await connectRedis();
      return await redisClient.exists(key);
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  }
};

export { connectRedis, redisClient };
export default redisClient;