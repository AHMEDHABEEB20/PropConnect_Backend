const jwt = require('jsonwebtoken');
const { ApiError } = require('../errors/ApiError');

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined');
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
    { expiresIn }
  );
}

function verifyAccessToken(token) {
  try {
    return jwt.verify(token, getSecret());
  } catch {
    throw new ApiError(401, 'Invalid or expired token');
  }
}

module.exports = { signAccessToken, verifyAccessToken };
