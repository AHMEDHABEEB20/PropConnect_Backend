const mongoose = require('mongoose');
const { User } = require('./models/user.model');
const { ApiError } = require('../../shared/errors/ApiError');

async function listUsers() {
  const users = await User.find().select('-password').sort({ createdAt: -1 }).lean();
  return { users };
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
