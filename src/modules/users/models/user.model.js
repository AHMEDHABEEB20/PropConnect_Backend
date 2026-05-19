'use strict';

const mongoose = require('mongoose');

const ROLES = ['user', 'owner', 'agent', 'admin'];

// ─── Sub-schemas (no _id, embedded in user doc) ──────────────────────────────

const locationSchema = new mongoose.Schema(
  {
    city: { type: String, trim: true },
    governorate: { type: String, trim: true },
  },
  { _id: false }
);

const socialSchema = new mongoose.Schema(
  {
    whatsapp: { type: String, default: null },
    facebook: { type: String, default: null },
    instagram: { type: String, default: null },
  },
  { _id: false }
);

const agentInfoSchema = new mongoose.Schema(
  {
    licenseNumber: { type: String, trim: true, default: null },
    agencyName:    { type: String, trim: true, default: null },
    agencyLogo:    { type: String, default: null },             // Cloudinary URL
    experienceYears: { type: Number, min: 0, max: 60, default: null },
    about:         { type: String, maxlength: 1000, default: null },
    specialties:   { type: [String], default: [] },
    serviceAreas:  { type: [String], default: [] },
    languages:     { type: [String], default: [] },
  },
  { _id: false }
);

// ─── Main user schema ─────────────────────────────────────────────────────────

const userSchema = new mongoose.Schema(
  {
    // ── Core identity ──────────────────────────────────────────────────────────
    name: {
      type: String,
      required: true,
      trim: true,
    },
    username: {
      type: String,
      unique: true,
      sparse: true,   // allows multiple null values (username is optional)
      lowercase: true,
      trim: true,
      default: null,
    },
    slug: {
      type: String,
      unique: true,
      sparse: true,   // derived from username; also optional until set
      lowercase: true,
      trim: true,
      default: null,
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
      select: false,  // never returned in queries by default
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

    // ── Profile content ────────────────────────────────────────────────────────
    avatar:   { type: String, default: null },   // Cloudinary URL, set via /uploads
    bio:      { type: String, maxlength: 500, default: null },
    location: { type: locationSchema, default: null },
    social:   { type: socialSchema, default: null },

    // ── Agent-specific block ───────────────────────────────────────────────────
    agentInfo: { type: agentInfoSchema, default: null },

    // ── Status flags ──────────────────────────────────────────────────────────
    isVerified:         { type: Boolean, default: false },  // email OTP verified
    isActive:           { type: Boolean, default: true },   // false = soft-deleted
    isPhoneVerified:    { type: Boolean, default: false },  // future: SMS OTP
    isIdentityVerified: { type: Boolean, default: false },  // future: KYC
    isAgentVerified:    { type: Boolean, default: false },  // future: license check
  },
  { timestamps: true }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
userSchema.index({ createdAt: -1 });
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ isActive: 1 });

module.exports = {
  User: mongoose.model('User', userSchema),
  ROLES,
};
