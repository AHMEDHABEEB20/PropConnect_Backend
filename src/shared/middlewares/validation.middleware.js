const { ZodError } = require('zod');
const { ApiError } = require('../errors/ApiError');

function _parseWithSchema(schema, data, next) {
  try {
    return { parsed: schema.parse(data), error: null };
  } catch (e) {
    if (e instanceof ZodError) {
      const details = e.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      }));
      next(new ApiError(400, 'Validation failed', details));
      return { parsed: null, error: true };
    }
    next(e);
    return { parsed: null, error: true };
  }
}

function validateBody(schema) {
  return (req, res, next) => {
    const { parsed, error } = _parseWithSchema(schema, req.body, next);
    if (!error) {
      req.body = parsed;
      next();
    }
  };
}

function validateQuery(schema) {
  return (req, res, next) => {
    const { parsed, error } = _parseWithSchema(schema, req.query, next);
    if (!error) {
      req.query = parsed;
      next();
    }
  };
}

module.exports = { validateBody, validateQuery };
