const mongoose = require('mongoose');
const { User } = require('./models/user.model');
const { ApiError } = require('../../shared/errors/ApiError');

async function listUsers({ page = 1, limit = 20 } = {}) {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));
  const skip = (safePage - 1) * safeLimit;

  const [users, total] = await Promise.all([
    User.find().select('-password').sort({ createdAt: -1 }).skip(skip).limit(safeLimit).lean(),
    User.countDocuments(),
  ]);

  return {
    users,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.max(1, Math.ceil(total / safeLimit)),
    },
  };
}

async function deleteUserById(id) {
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, 'Invalid user id');
  }

  const deleted = await User.findByIdAndDelete(id).select('-password').lean();
  if (!deleted) {
    throw new ApiError(404, 'User not found');
  }

  return { user: deleted };
}

module.exports = {
  listUsers,
  deleteUserById,
};
