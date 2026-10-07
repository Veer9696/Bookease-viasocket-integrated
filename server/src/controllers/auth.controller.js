const crypto = require("crypto");
const authService = require("../services/auth.service");
const googleAuthService = require("../services/googleAuth.service");
const { env } = require("../config/env");
const { logger } = require("../utils/logger");
const { UnauthorizedError } = require("../utils/apiError");
const {
  signAuthToken,
  setAuthCookie,
  clearAuthCookie,
  setPendingSignupCookie,
  readPendingSignup,
  clearPendingSignupCookie,
} = require("../utils/jwt");
const { prisma } = require("../config/prismaClient");

async function register(req, res) {
  const user = await authService.register(req.body);
  const token = signAuthToken(user);
  setAuthCookie(res, token);
  res.status(201).json({ user });
}

async function login(req, res) {
  const user = await authService.login(req.body);
  const token = signAuthToken(user);
  setAuthCookie(res, token);
  res.json({ user });
}

async function logout(req, res) {
  clearAuthCookie(res);
  res.status(204).end();
}

async function me(req, res) {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: { doctorProfile: true, savedAddresses: { orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] } },
  });
  res.json({ user: authService.sanitizeUser(user || req.user) });
}

// --- Google OAuth 2.0 ---
// These are full-page browser navigations, not fetch calls, so failures
// redirect back to the login page with an error code instead of JSON.

const GOOGLE_STATE_COOKIE_NAME = "bookease_google_state";
const GOOGLE_STATE_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
};

function clientUrl(path) {
  return `${env.CLIENT_ORIGIN || ""}${path}`;
}

function redirectWithError(res, code, returnPath = "/login") {
  res.redirect(clientUrl(`${returnPath}?oauthError=${code}`));
}

function homePathFor(user) {
  return user.role === "DOCTOR" ? "/doctor/dashboard" : "/dashboard";
}

async function googleStart(req, res) {
  const returnPath = req.query.from === "register" ? "/register" : "/login";
  if (!googleAuthService.isConfigured()) return redirectWithError(res, "not_configured", returnPath);

  // Random state round-trips through Google; the callback rejects any response
  // that doesn't carry it back (blocks login CSRF).
  const state = crypto.randomBytes(16).toString("hex");
  const statePayload = JSON.stringify({ state, from: returnPath });
  res.cookie(GOOGLE_STATE_COOKIE_NAME, statePayload, { ...GOOGLE_STATE_COOKIE_OPTIONS, maxAge: 10 * 60 * 1000 });
  res.redirect(googleAuthService.buildAuthUrl(state));
}

async function googleCallback(req, res) {
  let expectedState = null;
  let returnPath = "/login";

  const rawState = req.cookies[GOOGLE_STATE_COOKIE_NAME];
  if (rawState) {
    try {
      if (rawState.startsWith("{")) {
        const parsed = JSON.parse(rawState);
        expectedState = parsed.state;
        returnPath = parsed.from || "/login";
      } else {
        expectedState = rawState;
      }
    } catch {
      expectedState = rawState;
    }
  }

  res.clearCookie(GOOGLE_STATE_COOKIE_NAME, GOOGLE_STATE_COOKIE_OPTIONS);

  if (req.query.error) return redirectWithError(res, "cancelled", returnPath);
  if (!expectedState || req.query.state !== expectedState || !req.query.code) {
    return redirectWithError(res, "expired", returnPath);
  }

  try {
    const code = String(req.query.code).trim();
    const profile = await googleAuthService.getProfileFromCode(code);
    const user = await googleAuthService.findUserForGoogleProfile(profile);

    if (user) {
      setAuthCookie(res, signAuthToken(user));
      return res.redirect(clientUrl(homePathFor(user)));
    }

    setPendingSignupCookie(res, profile);
    res.redirect(clientUrl("/signup/google"));
  } catch (err) {
    logger.warn("Google sign-in failed:", err.message);
    const code = err.statusCode === 409 ? "conflict" : "failed";
    redirectWithError(res, code, returnPath);
  }
}

async function googlePending(req, res) {
  const profile = readPendingSignup(req);
  if (!profile) throw new UnauthorizedError("Your Google sign-up session expired. Please try again.");
  res.json({ profile: { name: profile.name, email: profile.email, avatarUrl: profile.avatarUrl } });
}

async function googleComplete(req, res) {
  const profile = readPendingSignup(req);
  if (!profile) throw new UnauthorizedError("Your Google sign-up session expired. Please try again.");

  const user = await googleAuthService.createGoogleUser(profile, req.body);
  clearPendingSignupCookie(res);
  setAuthCookie(res, signAuthToken(user));
  res.status(201).json({ user });
}

module.exports = { register, login, logout, me, googleStart, googleCallback, googlePending, googleComplete };
