import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import ConnectRedis from 'connect-redis';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';

import connectDB from './config/database.js';
import { connectRedis, redisClient } from './config/redis.js';
import { specs, swaggerUi } from './config/swagger.js';
import errorHandler from './middleware/errorHandler.js';
import { accessLogger, errorLogger, consoleLogger } from './middleware/logger.js';
import { trackAnalytics } from './middleware/analytics.js';
import { 
  mongoSanitization, 
  xssProtection, 
  hppProtection, 
  securityHeaders,
  requestSizeLimiter 
} from './middleware/security.js';
import routes from './routes/index.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import notificationService from './services/notificationService.js';
import cronJobManager from './scripts/cronJobs.js';
import emailService from './services/emailService.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3000;

// Initialize services
const initializeServices = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Connect to Redis
    await connectRedis();
    
    // Initialize WebSocket for notifications
    if (process.env.WEBSOCKET_ENABLED === 'true') {
      notificationService.initialize(server);
    }
    
    // Verify email service
    await emailService.verifyConnection();
    
    // Start cron jobs
    if (process.env.NODE_ENV === 'production') {
      cronJobManager.start();
    }
    
    console.log('✅ All services initialized successfully');
  } catch (error) {
    console.error('❌ Service initialization failed:', error);
    process.exit(1);
  }
};

// Trust proxy (for deployment behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  }
}));

app.use(securityHeaders);
app.use(requestSizeLimiter);
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    status: 'error',
    message: 'Слишком много запросов с этого IP, попробуйте позже.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks and static files
    return req.url === '/health' || req.url.startsWith('/static');
  }
});

app.use('/api/', limiter);

// Session configuration
if (redisClient) {
  const RedisStore = ConnectRedis(session);
  app.use(session({
    store: new RedisStore({ client: redisClient }),
    secret: process.env.SESSION_SECRET || 'your-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: parseInt(process.env.SESSION_MAX_AGE) || 86400000 // 24 hours
    }
  }));
}

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'http://localhost:3000',
      'http://localhost:5173',
      'http://127.0.0.1:5173'
    ].filter(Boolean);

    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-API-Key'],
  exposedHeaders: ['X-Total-Count', 'X-Rate-Limit-Remaining']
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security middleware
app.use(mongoSanitization);
app.use(xssProtection);
app.use(hppProtection);

// Logging middleware
app.use(accessLogger);
app.use(errorLogger);
app.use(consoleLogger);

// Analytics tracking
app.use(trackAnalytics);

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/static', express.static(path.join(__dirname, '../public')));

// API Documentation
if (process.env.API_DOCS_ENABLED === 'true') {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Farm Marketplace API Documentation'
  }));
}

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      services: {
        database: 'connected',
        redis: redisClient ? 'connected' : 'disconnected',
        email: await emailService.verifyConnection() ? 'connected' : 'disconnected'
      },
      version: '2.0.0'
    };

    res.status(200).json(health);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

// System info endpoint (admin only)
app.get('/system-info', (req, res) => {
  res.json({
    status: 'success',
    data: {
      nodeVersion: process.version,
      platform: process.platform,
      architecture: process.arch,
      cpuUsage: process.cpuUsage(),
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
      loadAverage: require('os').loadavg(),
      cronJobs: cronJobManager.getJobStatus()
    }
  });
});

// API routes
app.use('/api', routes);
app.use('/api/v1/analytics', analyticsRoutes);

// Webhook endpoints (before error handling)
app.post('/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['stripe-signature'];
    const paymentService = (await import('./services/paymentService.js')).default;
    
    const result = await paymentService.handleWebhook(signature, req.body);
    res.json(result);
  } catch (error) {
    console.error('Stripe webhook error:', error);
    res.status(400).json({ error: error.message });
  }
});

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    status: 'success',
    message: 'Farm Marketplace API v2.0',
    version: '2.0.0',
    documentation: process.env.API_DOCS_ENABLED === 'true' ? '/api-docs' : null,
    endpoints: {
      auth: '/api/v1/auth',
      users: '/api/v1/users',
      farmers: '/api/v1/farmers',
      products: '/api/v1/products',
      categories: '/api/v1/categories',
      orders: '/api/v1/orders',
      reviews: '/api/v1/reviews',
      cart: '/api/v1/cart',
      wishlist: '/api/v1/wishlist',
      payments: '/api/v1/payments',
      deliveries: '/api/v1/deliveries',
      notifications: '/api/v1/notifications',
      promoCodes: '/api/v1/promo-codes',
      pickupPoints: '/api/v1/pickup-points',
      analytics: '/api/v1/analytics'
    },
    features: [
      'JWT Authentication',
      'Real-time Notifications',
      'Advanced Analytics',
      'Image Processing',
      'Payment Integration',
      'Email Service',
      'Caching System',
      'Rate Limiting',
      'Security Middleware',
      'API Documentation',
      'Automated Backups',
      'Cron Jobs'
    ]
  });
});

// 404 handler
app.all('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Маршрут ${req.originalUrl} не найден`,
    availableEndpoints: '/api'
  });
});

// Global error handler
app.use(errorHandler);

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`🛑 ${signal} получен. Завершение работы сервера...`);
  
  server.close(async () => {
    console.log('🔌 HTTP сервер закрыт');
    
    try {
      // Stop cron jobs
      cronJobManager.stop();
      
      // Close database connection
      await require('mongoose').connection.close();
      console.log('🗄️ База данных отключена');
      
      // Close Redis connection
      if (redisClient) {
        await redisClient.quit();
        console.log('🔴 Redis отключен');
      }
      
      console.log('✅ Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  });
  
  // Force close after 30 seconds
  setTimeout(() => {
    console.error('⚠️ Принудительное завершение работы');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});

// Start server
const startServer = async () => {
  try {
    await initializeServices();
    
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Сервер запущен на порту ${PORT}`);
      console.log(`🌍 Окружение: ${process.env.NODE_ENV}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`📚 API docs: http://localhost:${PORT}/api-docs`);
      console.log(`🔗 API base URL: http://localhost:${PORT}/api/v1`);
      console.log(`⚡ WebSocket: ${process.env.WEBSOCKET_ENABLED === 'true' ? 'Enabled' : 'Disabled'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;