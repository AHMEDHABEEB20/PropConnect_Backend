'use strict';

const { z } = require('zod');
const { ROLES } = require('./models/user.model');

// ─── Reusable sub-schemas ─────────────────────────────────────────────────────

const locationSchema = z
  .object({
    city:        z.string().min(1, 'City is required').max(100),
    governorate: z.string().min(1, 'Governorate is required').max(100),
  })
  .optional();

const socialSchema = z
  .object({
    whatsapp:  z.string().min(5).max(20).nullable().optional(),
    facebook:  z.string().url('Invalid Facebook URL').nullable().optional(),
    instagram: z.string().url('Invalid Instagram URL').nullable().optional(),
  })
  .optional();

const agentInfoSchema = z
  .object({
    licenseNumber:   z.string().min(1).max(100).optional(),
    agencyName:      z.string().min(1).max(200).optional(),
    agencyLogo:      z.string().url('Invalid agency logo URL').optional(),
    experienceYears: z.coerce.number().int().min(0).max(60).optional(),
    about:           z.string().max(1000).optional(),
    specialties:     z.array(z.string().min(1)).max(10).optional(),
    serviceAreas:    z.array(z.string().min(1)).max(20).optional(),
    languages:       z.array(z.string().min(1)).max(10).optional(),
  })
  .optional();

// ─── Schemas ──────────────────────────────────────────────────────────────────

/**
 * PATCH /users/me
 * All fields optional. Strips non-updatable fields at service level.
 */
const updateProfileSchema = z.object({
  name: z
    .string()
    .min(1, 'Name cannot be empty')
    .max(120, 'Name must be at most 120 characters')
    .optional(),

  phone: z
    .string()
    .min(5, 'Phone is too short')
    .max(20, 'Phone is too long')
    .optional(),

  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(
      /^[a-z0-9_]+$/,
      'Username may only contain lowercase letters, numbers, and underscores'
    )
    .optional(),

  bio: z
    .string()
    .max(500, 'Bio must be at most 500 characters')
    .optional(),

  location:  locationSchema,
  social:    socialSchema,
  agentInfo: agentInfoSchema,
});

/**
 * PATCH /users/:id/role  (admin only)
 */
const updateRoleSchema = z.object({
  role: z.enum(ROLES, {
    errorMap: () => ({ message: `Role must be one of: ${ROLES.join(', ')}` }),
  }),
});

/**
 * GET /users  (admin only — query params)
 */
const listUsersQuerySchema = z.object({
  page:     z.coerce.number().int().min(1).optional().default(1),
  limit:    z.coerce.number().int().min(1).max(100).optional().default(20),
  role:     z.enum(ROLES).optional(),
  isActive: z.enum(['true', 'false']).optional(),
});

module.exports = { updateProfileSchema, updateRoleSchema, listUsersQuerySchema };
