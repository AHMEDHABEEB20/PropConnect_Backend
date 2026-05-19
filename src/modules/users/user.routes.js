const express = require('express');
const userController = require('./user.controller');
const { asyncHandler } = require('../../shared/middlewares/error.middleware');
const { authenticate, requireAdmin } = require('../../shared/middlewares/auth.middleware');
const { validateBody, validateQuery } = require('../../shared/middlewares/validation.middleware');
const { uploadAvatar } = require('../../shared/middlewares/upload.middleware');
const {
  updateProfileSchema,
  updateRoleSchema,
  listUsersQuerySchema,
} = require('./user.validation');

const router = express.Router();

// ─── Profile Routes (Public & Authenticated) ─────────────────────────────────

// Get own profile (requires auth)
router.get('/me', authenticate, asyncHandler(userController.getMyProfile));
// Update own profile (requires auth)
router.patch(
  '/me',
  authenticate,
  validateBody(updateProfileSchema),
  asyncHandler(userController.updateMyProfile)
);

// Upload avatar (requires auth)
router.patch(
  '/me/avatar',
  authenticate,
  uploadAvatar.single('image'),
  asyncHandler(userController.uploadAvatar)
);

// Get public profile by ID or username
// Must be defined after /me so "me" is not treated as an identifier
router.get('/:identifier', asyncHandler(userController.getPublicProfile));

// ─── Admin Routes ────────────────────────────────────────────────────────────

router.use(authenticate, requireAdmin); // Apply admin guard to all routes below

// List users with filtering/pagination
router.get(
  '/',
  validateQuery(listUsersQuerySchema),
  asyncHandler(userController.listUsers)
);

// Change user role
router.patch(
  '/role/:id',
  validateBody(updateRoleSchema),
  asyncHandler(userController.updateUserRole)
);

// Soft delete user
router.delete('/:id', asyncHandler(userController.deleteUser));

module.exports = router;
