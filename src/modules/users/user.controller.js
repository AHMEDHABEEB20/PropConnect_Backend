const userService = require('./user.service');
const { success } = require('../../shared/utils/apiResponse');
const {
  buildPrivateProfileResponse,
  buildPublicProfileResponse,
} = require('./dto/profile.dto');

// ─── Profile Endpoints ───────────────────────────────────────────────────────

async function getMyProfile(req, res) {
  const { user, stats } = await userService.getPrivateProfile(req.user._id);
  const data = buildPrivateProfileResponse(user, stats);
  return success(res, 'Profile fetched successfully', { user: data });
}



async function updateMyProfile(req, res) {
  const { user, stats } = await userService.updateProfile(req.user._id, req.body);
  const data = buildPrivateProfileResponse(user, stats);
  return success(res, 'Profile updated successfully', { user: data });
}

async function getPublicProfile(req, res) {
  const { identifier } = req.params;
  const { user, stats } = await userService.getPublicProfile(identifier);
  const data = buildPublicProfileResponse(user, stats);
  return success(res, 'User profile fetched successfully', { user: data });
}

async function uploadAvatar(req, res) {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No image provided' });
  }

  // req.file.path contains the Cloudinary URL created by the multer-storage-cloudinary middleware
  const { user, stats } = await userService.updateAvatar(req.user._id, req.file.path);
  const data = buildPrivateProfileResponse(user, stats);
  
  return success(res, 'Avatar uploaded successfully', { user: data });
}

// ─── Admin Endpoints ─────────────────────────────────────────────────────────

async function listUsers(req, res) {
  const result = await userService.listUsers(req.query);
  
  // Build public profile shape for the list, plus pagination
  const users = result.users.map((u) => buildPublicProfileResponse(u, {}));
  
  return success(res, 'Users fetched successfully', {
    users,
    pagination: result.pagination,
  });
}

async function updateUserRole(req, res) {
  const { id } = req.params;
  const { role } = req.body;
  const { user } = await userService.updateRole(id, role);
  
  // Return the public shape for the updated user
  const data = buildPublicProfileResponse(user, {});
  return success(res, 'User role updated successfully', { user: data });
}

async function deleteUser(req, res) {
  const { id } = req.params;
  await userService.deleteUserById(id);
  return success(res, 'User deleted successfully', {});
}

module.exports = {
  getMyProfile,
  updateMyProfile,
  uploadAvatar,
  getPublicProfile,
  listUsers,
  updateUserRole,
  deleteUser,
};
