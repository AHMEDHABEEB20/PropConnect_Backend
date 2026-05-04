const bcrypt = require('bcrypt');
const { User } = require('../users/models/user.model');
const Otp = require('./models/otp.model');
const { ApiError } = require('../../shared/errors/ApiError');
const { generateOtp } = require('../../shared/utils/generateOtp');
const { enqueueEmail } = require('../../shared/utils/emailQueue');
const { signAccessToken } = require('../../shared/utils/jwt.util');
const { clearCachedUser } = require('../../shared/middlewares/auth.middleware');

const OTP_TTL_MS = 5 * 60 * 1000;
const BCRYPT_ROUNDS = 12;
const MSG_EMAIL_EXISTS = 'Email is already registered';
const MSG_INVALID_CREDENTIALS = 'Invalid email or password';
const MSG_INVALID_OTP = 'Invalid or expired OTP';

function normalizeEmail(email) {
  return email.toLowerCase();
}

function toPublicUser(userDoc) {
  const u = userDoc.toObject ? userDoc.toObject() : { ...userDoc };
  delete u.password;
  return u;
}

async function issueOtpForEmail(email, purposeLabel) {
  const normalizedEmail = normalizeEmail(email);
  const plainOtp = generateOtp();
  const hashedOtp = await bcrypt.hash(plainOtp, BCRYPT_ROUNDS);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  await Otp.findOneAndUpdate(
    { email: normalizedEmail },
    { $set: { otp: hashedOtp, expiresAt } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  enqueueEmail({
    to: email,
    subject: 'Your PropConnect verification code',
    text: `Your ${purposeLabel} code is ${plainOtp}. It expires in 5 minutes.`,
    html: `<p>Your <strong>${purposeLabel}</strong> code is <strong>${plainOtp}</strong>.</p><p>It expires in 5 minutes.</p>`,
  });
}

async function register({ name, email, password, phone, role }) {
  const emailLower = normalizeEmail(email);

  const existing = await User.exists({ email: emailLower });
  if (existing) {
    throw new ApiError(409, MSG_EMAIL_EXISTS);
  }

  const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

  let user;
  try {
    user = await User.create({
      name,
      email: emailLower,
      password: hashedPassword,
      phone,
      role,
      isVerified: false,
    });
  } catch (err) {
    if (err.code === 11000) {
      throw new ApiError(409, MSG_EMAIL_EXISTS);
    }
    throw err;
  }

  await issueOtpForEmail(user.email, 'registration');

  return { user: toPublicUser(user) };
}

async function login({ email, password }) {
  const emailLower = normalizeEmail(email);

  const user = await User.findOne({ email: emailLower }).select('+password');
  if (!user) {
    throw new ApiError(401, MSG_INVALID_CREDENTIALS);
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    throw new ApiError(401, MSG_INVALID_CREDENTIALS);
  }

  if (!user.isVerified) {
    throw new ApiError(403, 'Please verify your account OTP before logging in');
  }

  const token = signAccessToken(user);

  return {
    token,
    user: toPublicUser(user),
  };
}

async function verifyOtp({ email, otp }) {
  const emailLower = normalizeEmail(email);

  const record = await validateOtpForEmail(emailLower, otp);

  const user = await User.findOneAndUpdate(
    { email: emailLower },
    { $set: { isVerified: true } },
    { new: true }
  ).select('-password');

  if (!user) {
    await Otp.deleteOne({ _id: record._id });
    throw new ApiError(404, 'User not found');
  }

  await Otp.deleteOne({ _id: record._id });

  const token = signAccessToken(user);

  return {
    token,
    user: toPublicUser(user),
  };
}

async function forgotPassword({ email }) {
  const emailLower = normalizeEmail(email);
  const user = await User.findOne({ email: emailLower }).select('email').lean();
  if (user) {
    await issueOtpForEmail(emailLower, 'password reset');
  }

  return {};
}

async function resetPassword({ email, otp, newPassword, confirmPassword }) {
  const emailLower = normalizeEmail(email);
  const user = await User.findOne({ email: emailLower }).select('+password');
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  if (newPassword !== confirmPassword) {
    throw new ApiError(400, 'Passwords do not match');
  }

  const record = await validateOtpForEmail(emailLower, otp);
  const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

  user.password = hashedPassword;
  await user.save();
  await Otp.deleteOne({ _id: record._id });

  return {};
}

async function logout(user) {
  clearCachedUser(user?._id);
  return {};
}

async function validateOtpForEmail(emailLower, otp) {
  const record = await Otp.findOne({ email: emailLower });
  if (!record) {
    throw new ApiError(400, MSG_INVALID_OTP);
  }

  if (record.expiresAt.getTime() <= Date.now()) {
    await Otp.deleteOne({ _id: record._id });
    throw new ApiError(400, MSG_INVALID_OTP);
  }

  const ok = await bcrypt.compare(otp, record.otp);
  if (!ok) {
    throw new ApiError(400, MSG_INVALID_OTP);
  }

  return record;
}

module.exports = {
  register,
  login,
  verifyOtp,
  forgotPassword,
  resetPassword,
  logout,
};
