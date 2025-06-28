import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss';
import hpp from 'hpp';

// MongoDB injection protection
export const mongoSanitization = mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    console.warn(`⚠️ Potential MongoDB injection attempt: ${key} in ${req.path}`);
  }
});

// XSS protection
export const xssProtection = (req, res, next) => {
  // Clean request body
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = xss(req.body[key]);
      }
    });
  }

  // Clean query parameters
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = xss(req.query[key]);
      }
    });
  }

  next();
};

// HTTP Parameter Pollution protection
export const hppProtection = hpp({
  whitelist: ['sort', 'fields', 'page', 'limit', 'category', 'tags']
});

// Request size limiter
export const requestSizeLimiter = (req, res, next) => {
  const maxSize = process.env.MAX_REQUEST_SIZE || '10mb';
  
  if (req.headers['content-length'] && 
      parseInt(req.headers['content-length']) > parseInt(maxSize)) {
    return res.status(413).json({
      status: 'error',
      message: 'Request entity too large'
    });
  }
  
  next();
};

// IP whitelist/blacklist
export const ipFilter = (options = {}) => {
  const { whitelist = [], blacklist = [] } = options;
  
  return (req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    
    // Check blacklist first
    if (blacklist.length > 0 && blacklist.includes(clientIP)) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }
    
    // Check whitelist if defined
    if (whitelist.length > 0 && !whitelist.includes(clientIP)) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }
    
    next();
  };
};

// Security headers
export const securityHeaders = (req, res, next) => {
  // Remove server information
  res.removeHeader('X-Powered-By');
  
  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  next();
};

// API key validation
export const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const validApiKeys = process.env.VALID_API_KEYS?.split(',') || [];
  
  if (req.path.startsWith('/api/public/')) {
    return next();
  }
  
  if (!apiKey || !validApiKeys.includes(apiKey)) {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid or missing API key'
    });
  }
  
  next();
};