const mongoose = require('mongoose');
const { User } = require('./models/user.model');
const { ApiError } = require('../../shared/errors/ApiError');

// ─── Internal helpers ────────────────────────────────────────────────────────

function generateSlug(username) {
  if (!username) return null;
  return username.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

/**
 * Computes stats for a user dynamically.
 * Right now, everything returns 0 until we build the other modules.
 */
async function computeUserStats(userId, role) {
  // In future phases:
  // const [totalListings, bookmarks, ...] = await Promise.all([
  //   Property.countDocuments({ owner: userId }),
  //   Bookmark.countDocuments({ user: userId }), ...
  // ]);

  const stats = {};
  
  if (role === 'user') {
    stats.bookmarks = 0;
    stats.inquiriesSent = 0;
  } else if (role === 'owner') {
    stats.totalListings = 0;
    stats.activeListings = 0;
    stats.soldListings = 0;
    stats.rentedListings = 0;
    stats.inquiriesReceived = 0;
  } else if (role === 'agent') {
    stats.totalListings = 0;
    stats.activeListings = 0;
    stats.soldListings = 0;
    stats.rentedListings = 0;
    stats.inquiriesReceived = 0;
    stats.averageRating = 0;
    stats.totalReviews = 0;
  } else if (role === 'admin') {
    // Basic admin stats that can be quickly counted now
    const [totalUsers] = await Promise.all([
      User.countDocuments({ isActive: true }),
    ]);
    stats.totalUsers = totalUsers;
    stats.totalListings = 0;
    stats.totalInquiries = 0;
    stats.pendingReports = 0;
  }

  return stats;
}

// ─── Profile Operations ──────────────────────────────────────────────────────

async function getPrivateProfile(userId) {
  const user = await User.findById(userId);
  if (!user || !user.isActive) {
    throw new ApiError(404, 'User not found');
  }

  const stats = await computeUserStats(user._id, user.role);
  return { user, stats };
}

async function getPublicProfile(identifier) {
  // Can find by ID or username/slug
  const query = mongoose.isValidObjectId(identifier)
    ? { _id: identifier, isActive: true }
    : { $or: [{ username: identifier }, { slug: identifier }], isActive: true };

  const user = await User.findOne(query);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const stats = await computeUserStats(user._id, user.role);
  return { user, stats };
}

async function updateProfile(userId, updateData) {
  const user = await User.findById(userId);
  if (!user || !user.isActive) {
    throw new ApiError(404, 'User not found');
  }

  // Handle username & slug generation
  if (updateData.username !== undefined && updateData.username !== user.username) {
    const existing = await User.exists({ username: updateData.username, _id: { $ne: userId } });
    if (existing) {
      throw new ApiError(409, 'Username is already taken');
    }
    user.username = updateData.username;
    user.slug = generateSlug(updateData.username);
  }

  // Update top-level fields
  if (updateData.name) user.name = updateData.name;
  if (updateData.phone) user.phone = updateData.phone;
  if (updateData.bio !== undefined) user.bio = updateData.bio;

  // Deep update for location
  if (updateData.location) {
    user.location = { ...user.location?.toObject(), ...updateData.location };
  }

  // Deep update for social
  if (updateData.social) {
    user.social = { ...user.social?.toObject(), ...updateData.social };
  }

  // Deep update for agentInfo (silently ignore if not agent)
  if (updateData.agentInfo && user.role === 'agent') {
    user.agentInfo = { ...user.agentInfo?.toObject(), ...updateData.agentInfo };
  }

  await user.save();
  const stats = await computeUserStats(user._id, user.role);
  return { user, stats };
}

async function updateAvatar(userId, avatarUrl) {
  const user = await User.findById(userId);
  if (!user || !user.isActive) {
    throw new ApiError(404, 'User not found');
  }

  // Optional: If user already has an avatar, you could call Cloudinary API here 
  // to delete the old image to save space before setting the new one.
  // const oldAvatar = user.avatar;

  user.avatar = avatarUrl;
  await user.save();
  
  const stats = await computeUserStats(user._id, user.role);
  return { user, stats };
}

// ─── Admin Operations ────────────────────────────────────────────────────────

async function listUsers({ page = 1, limit = 20, role, isActive } = {}) {
  const query = {};
  if (role) query.role = role;
  if (isActive !== undefined) query.isActive = isActive === 'true';
  else query.isActive = true; // default to active only

  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(query),
  ]);

  return {
    users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

async function updateRole(targetId, newRole) {
  const user = await User.findOneAndUpdate(
    { _id: targetId, isActive: true },
    { $set: { role: newRole } },
    { new: true }
  );

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  return { user };
}

async function deleteUserById(id) {
  // Soft delete instead of hard delete
  const deleted = await User.findOneAndUpdate(
    { _id: id, isActive: true },
    { $set: { isActive: false } },
    { new: true }
  );

  if (!deleted) {
    throw new ApiError(404, 'User not found or already deleted');
  }

  return { user: deleted };
}

module.exports = {
  getPrivateProfile,
  getPublicProfile,
  updateProfile,
  updateAvatar,
  listUsers,
  updateRole,
  deleteUserById,
};
