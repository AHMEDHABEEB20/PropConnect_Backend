const { ZodError } = require('zod');
const { ApiError } = require('../errors/ApiError');

function validateBody(schema) {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (e) {
      if (e instanceof ZodError) {
        const details = e.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        }));
        return next(new ApiError(400, 'Validation failed', details));
      }
      next(e);
    }
  };
}

module.exports = { validateBody };
