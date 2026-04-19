const { ApiError } = require('../errors/ApiError');
const { logger } = require('../utils/logger');

function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

function notFoundHandler(req, res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

function errorHandler(err, req, res, _next) {
  const statusCode =
    err.statusCode && Number.isInteger(err.statusCode) ? err.statusCode : 500;

  const message =
    statusCode === 500 && process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message || 'Something went wrong';

  const data = {};

  if (err.details) {
    data.details = err.details;
  }

  if (statusCode === 500 && process.env.NODE_ENV !== 'production' && err.stack) {
    data.stack = err.stack;
  }

  if (statusCode >= 500) {
    logger.error(err.message, {
      statusCode,
      path: req.originalUrl,
      method: req.method,
      stack: err.stack,
    });
  } else if (statusCode >= 400) {
    logger.warn(err.message, {
      statusCode,
      path: req.originalUrl,
      method: req.method,
    });
  }

  res.status(statusCode).json({
    success: false,
    message,
    data,
  });
}

module.exports = { asyncHandler, notFoundHandler, errorHandler };
