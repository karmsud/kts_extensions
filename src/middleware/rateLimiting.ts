import rateLimit from 'express-rate-limit';

// General API rate limiting (increased for development)
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs (increased for dev)
  message: 'Too many requests from this IP, please try again later.'
});

// Stricter rate limiting for file uploads
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit file uploads to 5 per 15 minutes
  message: 'Too many file upload attempts from this IP, please try again later.'
});

// Authentication related endpoints (if added later)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit login attempts
  message: 'Too many authentication attempts from this IP, please try again later.'
});

// Strict rate limiting for sensitive operations
export const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // very limited for sensitive operations
  message: 'Rate limit exceeded for sensitive operations, please try again later.'
}); 