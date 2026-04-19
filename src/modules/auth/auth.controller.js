const authService = require('./auth.service');
const { success } = require('../../shared/utils/apiResponse');

async function register(req, res) {
  const data = await authService.register(req.body);
  return success(res, 'Account created. OTP sent to your email.', data, 201);
}

async function login(req, res) {
  await authService.login(req.body);
  return success(res, 'OTP sent to your email', {});
}

async function verifyOtp(req, res) {
  const data = await authService.verifyOtp(req.body);
  return success(res, 'OTP verified successfully', data);
}

async function forgotPassword(req, res) {
  await authService.forgotPassword(req.body);
  return success(res, 'OTP sent to your email', {});
}

async function resetPassword(req, res) {
  await authService.resetPassword(req.body);
  return success(res, 'Password reset successfully', {});
}

module.exports = {
  register,
  login,
  verifyOtp,
  forgotPassword,
  resetPassword,
};
