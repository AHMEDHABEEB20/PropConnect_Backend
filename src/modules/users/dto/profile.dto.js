'use strict';

/**
 * Profile DTO — centralized response builders.
 *
 * Two contexts:
 *   buildPrivateProfileResponse  → GET /users/me  (full self-view)
 *   buildPublicProfileResponse   → GET /users/:identifier  (public, trimmed)
 *
 * Rules enforced here:
 *   - No manual field deletion — projection is additive-only.
 *   - Null / empty social links are never returned.
 *   - agentInfo.licenseNumber is stripped from public profiles.
 *   - Phone is public only for agents.
 *   - Public profile exposes memberSince (year string), not raw createdAt.
 *   - Stats are injected from the service layer (computed, not stored).
 */

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns a social object with only non-null/non-empty keys.
 * Returns undefined when nothing is set so the key is omitted entirely.
 */
function buildSocialLinks(social) {
  if (!social) return undefined;
  const result = {};
  if (social.whatsapp) result.whatsapp = social.whatsapp;
  if (social.facebook)  result.facebook  = social.facebook;
  if (social.instagram) result.instagram = social.instagram;
  return Object.keys(result).length > 0 ? result : undefined;
}

/**
 * Builds the agentInfo block.
 * @param {object} agentInfo  - raw agentInfo subdocument
 * @param {boolean} isPublic  - strip sensitive fields (licenseNumber) for public view
 */
function buildAgentInfo(agentInfo, isPublic) {
  if (!agentInfo) return undefined;

  const info = {
    agencyName:      agentInfo.agencyName      || null,
    agencyLogo:      agentInfo.agencyLogo      || null,
    experienceYears: agentInfo.experienceYears ?? null,
    about:           agentInfo.about           || null,
    specialties:     agentInfo.specialties     || [],
    serviceAreas:    agentInfo.serviceAreas    || [],
    languages:       agentInfo.languages       || [],
  };

  // licenseNumber is sensitive — only visible to the agent themselves
  if (!isPublic) {
    info.licenseNumber = agentInfo.licenseNumber || null;
  }

  return info;
}

/**
 * Builds the stats block by role.
 * Accepts a pre-computed stats object from the service layer.
 * Unknown keys are safely ignored.
 */
function buildStats(role, stats = {}) {
  switch (role) {
    case 'user':
      return {
        bookmarks:      stats.bookmarks      ?? 0,
        inquiriesSent:  stats.inquiriesSent  ?? 0,
      };

    case 'owner':
      return {
        totalListings:      stats.totalListings      ?? 0,
        activeListings:     stats.activeListings     ?? 0,
        soldListings:       stats.soldListings       ?? 0,
        rentedListings:     stats.rentedListings     ?? 0,
        inquiriesReceived:  stats.inquiriesReceived  ?? 0,
      };

    case 'agent':
      return {
        totalListings:      stats.totalListings      ?? 0,
        activeListings:     stats.activeListings     ?? 0,
        soldListings:       stats.soldListings       ?? 0,
        rentedListings:     stats.rentedListings     ?? 0,
        inquiriesReceived:  stats.inquiriesReceived  ?? 0,
        averageRating:      stats.averageRating      ?? 0,
        totalReviews:       stats.totalReviews       ?? 0,
      };

    case 'admin':
      return {
        totalUsers:      stats.totalUsers      ?? 0,
        totalListings:   stats.totalListings   ?? 0,
        totalInquiries:  stats.totalInquiries  ?? 0,
        pendingReports:  stats.pendingReports  ?? 0,
      };

    default:
      return {};
  }
}

// ─── Public builders ──────────────────────────────────────────────────────────

/**
 * Full private profile.
 * Returned only to the authenticated user themselves via GET /users/me.
 */
function buildPrivateProfileResponse(user, stats = {}) {
  const u = user.toObject ? user.toObject() : { ...user };

  return {
    id:       String(u._id),
    name:     u.name,
    username: u.username || null,
    slug:     u.slug     || null,
    email:    u.email,
    phone:    u.phone,
    role:     u.role,
    avatar:   u.avatar   || null,
    bio:      u.bio      || null,
    location: u.location || null,
    social:   buildSocialLinks(u.social),

    // agentInfo only exists for agents
    ...(u.role === 'agent' && {
      agentInfo: buildAgentInfo(u.agentInfo, /* isPublic */ false),
    }),

    // Status / trust flags
    isVerified:         u.isVerified,
    isActive:           u.isActive,
    isPhoneVerified:    u.isPhoneVerified,
    isIdentityVerified: u.isIdentityVerified,
    isAgentVerified:    u.isAgentVerified,

    stats:     buildStats(u.role, stats),
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  };
}

/**
 * Trimmed public profile.
 * Returned to any visitor via GET /users/:identifier.
 *
 * Excludes: email, isActive, updatedAt, isPhoneVerified, isIdentityVerified
 * Phone visibility: agents only
 * createdAt → memberSince (year string)
 */
function buildPublicProfileResponse(user, stats = {}) {
  const u = user.toObject ? user.toObject() : { ...user };
  const isAgent = u.role === 'agent';

  return {
    id:       String(u._id),
    name:     u.name,
    username: u.username || null,
    slug:     u.slug     || null,

    // Phone is only public for agents (owners & users keep it private)
    ...(isAgent && { phone: u.phone }),

    role:     u.role,
    avatar:   u.avatar || null,
    bio:      u.bio    || null,
    location: u.location || null,
    social:   buildSocialLinks(u.social),

    ...(isAgent && {
      agentInfo: buildAgentInfo(u.agentInfo, /* isPublic */ true),
    }),

    // Trust signals visible publicly
    isVerified:      u.isVerified,
    isAgentVerified: u.isAgentVerified,

    stats: buildStats(u.role, stats),

    // Return year string instead of raw timestamp
    memberSince: new Date(u.createdAt).getFullYear().toString(),
  };
}

module.exports = { buildPrivateProfileResponse, buildPublicProfileResponse };
