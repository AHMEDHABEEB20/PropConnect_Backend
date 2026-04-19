const { User } = require('../../modules/users/models/user.model');
const { ApiError } = require('../errors/ApiError');
const { verifyAccessToken } = require('../utils/jwt.util');

async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      throw new ApiError(401, 'Authentication required');
    }

    const token = header.slice(7);
    const decoded = verifyAccessToken(token);

    const user = await User.findById(decoded.sub).select('-password');
    if (!user) {
      throw new ApiError(401, 'User no longer exists');
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { authenticate };
