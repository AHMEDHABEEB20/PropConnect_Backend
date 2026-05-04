const { z } = require('zod');
const { ROLES } = require('../users/models/user.model');
const REGISTRABLE_ROLES = ROLES.filter((role) => role !== 'admin');

const registerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(120),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().min(5, 'Phone is required').max(20),
  role: z.enum(REGISTRABLE_ROLES).optional().default('user'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

const verifyOtpSchema = z.object({
  email: z.string().email('Invalid email'),
  otp: z.string().regex(/^\d{6}$/, 'OTP must be a 6-digit code'),
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email'),
});

const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email'),
  otp: z.string().regex(/^\d{6}$/, 'OTP must be a 6-digit code'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Confirm password must be at least 8 characters'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

module.exports = {
  registerSchema,
  loginSchema,
  verifyOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
};
