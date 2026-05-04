const jwt = require('jsonwebtoken');
const { ApiError } = require('../errors/ApiError');

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined');
  }
  if (process.env.NODE_ENV === 'production' && secret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters in production');
  }
  return secret;
}

function signAccessToken(user) {
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign(
    {
      sub: String(user._id),
      email: user.email,
      role: user.role,
    },
    getSecret(),
    { expiresIn, algorithm: 'HS256' }
  );
}

function verifyAccessToken(token) {
  try {
    return jwt.verify(token, getSecret(), { algorithms: ['HS256'] });
  } catch {
    throw new ApiError(401, 'Invalid or expired token');
  }
}

module.exports = { signAccessToken, verifyAccessToken };
