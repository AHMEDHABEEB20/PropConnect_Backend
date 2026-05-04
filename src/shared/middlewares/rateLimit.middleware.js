const rateLimit = require('express-rate-limit');

function createAuthRateLimiter() {
  const windowMs = Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000;
  const max = Number(process.env.AUTH_RATE_LIMIT_MAX) || 50;

  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: false,
    handler: (req, res, _next, options) => {
      res.status(options.statusCode).json({
        success: false,
        message: 'Too many requests. Please try again later.',
        data: {},
      });
    },
  });
}

function createGlobalRateLimiter() {
  const windowMs = Number(process.env.GLOBAL_RATE_LIMIT_WINDOW_MS) || 60 * 1000;
  const max = Number(process.env.GLOBAL_RATE_LIMIT_MAX) || 200;

  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: false,
    skip: (req) => req.path.startsWith('/api/v1/auth'),
    handler: (req, res, _next, options) => {
      res.status(options.statusCode).json({
        success: false,
        message: 'Too many requests. Please try again later.',
        data: {},
      });
    },
  });
}

module.exports = { createAuthRateLimiter, createGlobalRateLimiter };
