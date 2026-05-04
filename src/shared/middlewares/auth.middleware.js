const { User } = require('../../modules/users/models/user.model');
const { ApiError } = require('../errors/ApiError');
const { verifyAccessToken } = require('../utils/jwt.util');

const ROLE_ADMIN = 'admin';
const AUTH_USER_CACHE_TTL_MS = Number(process.env.AUTH_USER_CACHE_TTL_MS) || 30 * 1000;
const authUserCache = new Map();

function getCachedUser(userId) {
  const cached = authUserCache.get(userId);
  if (!cached) {
    return null;
  }

  if (cached.expiresAt <= Date.now()) {
    authUserCache.delete(userId);
    return null;
  }

  return cached.user;
}

function setCachedUser(userId, user) {
  authUserCache.set(userId, {
    user,
    expiresAt: Date.now() + AUTH_USER_CACHE_TTL_MS,
  });
}

async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      throw new ApiError(401, 'Authentication required');
    }

    const token = header.slice(7);
    const decoded = verifyAccessToken(token);
    const userId = decoded.sub;
    let user = getCachedUser(userId);
    if (!user) {
      user = await User.findById(userId)
        .select('_id name email phone role isVerified createdAt updatedAt')
        .lean();
      if (user) {
        setCachedUser(userId, user);
      }
    }
    if (!user) {
      throw new ApiError(401, 'User no longer exists');
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== ROLE_ADMIN) {
    return next(new ApiError(403, 'Forbidden'));
  }
  next();
}

module.exports = { authenticate, requireAdmin };
