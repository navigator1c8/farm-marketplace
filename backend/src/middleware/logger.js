import morgan from 'morgan';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Create write streams for different log levels
const accessLogStream = fs.createWriteStream(
  path.join(logsDir, 'access.log'),
  { flags: 'a' }
);

const errorLogStream = fs.createWriteStream(
  path.join(logsDir, 'error.log'),
  { flags: 'a' }
);

// Custom token for user ID
morgan.token('user-id', (req) => {
  return req.user ? req.user.id : 'anonymous';
});

// Custom token for request body (for POST/PUT requests)
morgan.token('body', (req) => {
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    // Don't log sensitive data
    const sensitiveFields = ['password', 'token', 'secret'];
    const body = { ...req.body };
    
    sensitiveFields.forEach(field => {
      if (body[field]) {
        body[field] = '[HIDDEN]';
      }
    });
    
    return JSON.stringify(body);
  }
  return '';
});

// Define log formats
const accessLogFormat = ':remote-addr - :user-id [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ms';

const errorLogFormat = ':remote-addr - :user-id [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ms :body';

// Access logger (all requests)
export const accessLogger = morgan(accessLogFormat, {
  stream: accessLogStream,
  skip: (req, res) => {
    // Skip logging for health checks and static files
    return req.url === '/health' || req.url.startsWith('/static');
  }
});

// Error logger (4xx and 5xx responses)
export const errorLogger = morgan(errorLogFormat, {
  stream: errorLogStream,
  skip: (req, res) => res.statusCode < 400
});

// Console logger for development
export const consoleLogger = morgan('dev', {
  skip: (req, res) => {
    // Skip in production or for health checks
    return process.env.NODE_ENV === 'production' || req.url === '/health';
  }
});

// Custom error logging function
export const logError = (error, req = null) => {
  const timestamp = new Date().toISOString();
  const userInfo = req && req.user ? `User: ${req.user.id}` : 'User: anonymous';
  const requestInfo = req ? `${req.method} ${req.url}` : 'No request info';
  
  const errorLog = `[${timestamp}] ERROR - ${userInfo} - ${requestInfo}\n${error.stack}\n\n`;
  
  errorLogStream.write(errorLog);
  
  // Also log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error(errorLog);
  }
};

// Custom info logging function
export const logInfo = (message, data = null) => {
  const timestamp = new Date().toISOString();
  const dataStr = data ? ` - Data: ${JSON.stringify(data)}` : '';
  
  const infoLog = `[${timestamp}] INFO - ${message}${dataStr}\n`;
  
  accessLogStream.write(infoLog);
  
  if (process.env.NODE_ENV === 'development') {
    console.log(infoLog);
  }
};

export default {
  accessLogger,
  errorLogger,
  consoleLogger,
  logError,
  logInfo
};