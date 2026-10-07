const { OAuth2Client } = require("google-auth-library");
const { env } = require("../config/env");
const { prisma } = require("../config/prismaClient");
const { ApiError, ConflictError, UnauthorizedError } = require("../utils/apiError");
const { sanitizeUser } = require("./auth.service");

function isConfigured() {
  return !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.GOOGLE_CALLBACK_URL);
}

function getClient() {
  if (!isConfigured()) throw new ApiError(503, "Google sign-in is not configured");
  return new OAuth2Client(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET, env.GOOGLE_CALLBACK_URL);
}

function buildAuthUrl(state) {
  return getClient().generateAuthUrl({
    scope: ["openid", "email", "profile"],
    state,
    prompt: "select_account",
  });
}

// Exchanges the callback's one-time code and verifies the returned ID token's
// signature and audience before trusting anything in it.
async function getProfileFromCode(code) {
  const client = getClient();
  const { tokens } = await client.getToken(code);
  const ticket = await client.verifyIdToken({ idToken: tokens.id_token, audience: env.GOOGLE_CLIENT_ID });
  const payload = ticket.getPayload();

  if (!payload.email || !payload.email_verified) {
    throw new UnauthorizedError("Your Google account's email address isn't verified");
  }

  return {
    googleId: payload.sub,
    email: payload.email.toLowerCase(),
    name: payload.name || payload.email.split("@")[0],
    avatarUrl: payload.picture || null,
  };
}

// Returns the existing BookEase user for this Google account, or null if
// they're new. A password account with the same (Google-verified) email is the
// same person, so it gets linked rather than duplicated.
async function findUserForGoogleProfile(profile) {
  const byGoogleId = await prisma.user.findFirst({
    where: { googleId: profile.googleId },
    include: { doctorProfile: true },
  });
  if (byGoogleId) return sanitizeUser(byGoogleId);

  const byEmail = await prisma.user.findFirst({
    where: { email: { equals: profile.email, mode: "insensitive" } },
  });
  if (!byEmail) return null;
  if (byEmail.googleId && byEmail.googleId !== profile.googleId) {
    throw new ConflictError("This email is already linked to a different Google account");
  }

  const linked = await prisma.user.update({
    where: { id: byEmail.id },
    data: { googleId: profile.googleId, avatarUrl: byEmail.avatarUrl ?? profile.avatarUrl },
    include: { doctorProfile: true },
  });
  return sanitizeUser(linked);
}

async function createGoogleUser(profile, { role, phone, specialty }) {
  // The pending signup may be submitted twice, or the email registered in the
  // meantime — either way, sign in to the account that now exists.
  const existing = await findUserForGoogleProfile(profile);
  if (existing) return existing;

  try {
    const user = await prisma.user.create({
      data: {
        email: profile.email,
        googleId: profile.googleId,
        avatarUrl: profile.avatarUrl,
        name: profile.name,
        phone,
        role,
        ...(role === "DOCTOR" ? { doctorProfile: { create: { specialty, fee: 0 } } } : {}),
      },
      include: { doctorProfile: true },
    });
    return sanitizeUser(user);
  } catch (err) {
    if (err.code === "P2002") throw new ConflictError("An account for this Google user already exists");
    throw err;
  }
}

module.exports = { isConfigured, buildAuthUrl, getProfileFromCode, findUserForGoogleProfile, createGoogleUser };
