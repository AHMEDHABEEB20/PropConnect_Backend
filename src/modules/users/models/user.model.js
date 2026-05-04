const mongoose = require('mongoose');

const ROLES = ['user', 'owner', 'agent', 'admin'];

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ROLES,
      default: 'user',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Supports admin user listing sorted by newest first.
userSchema.index({ createdAt: -1 });

module.exports = {
  User: mongoose.model('User', userSchema),
  ROLES,
};
