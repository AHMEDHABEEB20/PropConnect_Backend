const express = require('express');
const { validateBody } = require('../../shared/middlewares/validation.middleware');
const { asyncHandler } = require('../../shared/middlewares/error.middleware');
const { createAuthRateLimiter } = require('../../shared/middlewares/rateLimit.middleware');
const { authenticate } = require('../../shared/middlewares/auth.middleware');
const {
  registerSchema,
  loginSchema,
  verifyOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} = require('./auth.validation');
const authController = require('./auth.controller');

const router = express.Router();
const authLimiter = createAuthRateLimiter();

router.use(authLimiter);

router.post('/register', validateBody(registerSchema), asyncHandler(authController.register));
router.post('/login', validateBody(loginSchema), asyncHandler(authController.login));
router.post('/verify-otp', validateBody(verifyOtpSchema), asyncHandler(authController.verifyOtp));
router.post(
  '/forgot-password',
  validateBody(forgotPasswordSchema),
  asyncHandler(authController.forgotPassword)
);
router.post(
  '/reset-password',
  validateBody(resetPasswordSchema),
  asyncHandler(authController.resetPassword)
);
router.post('/logout', authenticate, asyncHandler(authController.logout));

module.exports = router;
