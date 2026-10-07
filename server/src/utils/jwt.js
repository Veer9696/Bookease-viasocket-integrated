const jwt = require("jsonwebtoken");
const { env } = require("../config/env");

const AUTH_COOKIE_NAME = "bookease_token";
const TOKEN_TTL = "7d";

function signAuthToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, env.JWT_SECRET, {
    expiresIn: TOKEN_TTL,
  });
}

function verifyAuthToken(token) {
  return jwt.verify(token, env.JWT_SECRET);
}

function setAuthCookie(res, token) {
  res.cookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

function clearAuthCookie(res) {
  res.clearCookie(AUTH_COOKIE_NAME);
}

// A new Google user's verified profile is held here (not in the DB) while they
// pick Patient or Doctor. The audience keeps it from passing as a session.
const PENDING_SIGNUP_COOKIE_NAME = "bookease_google_signup";
const PENDING_SIGNUP_AUDIENCE = "google-signup";
const PENDING_SIGNUP_TTL_MS = 15 * 60 * 1000;

function setPendingSignupCookie(res, profile) {
  const token = jwt.sign({ profile }, env.JWT_SECRET, {
    audience: PENDING_SIGNUP_AUDIENCE,
    expiresIn: PENDING_SIGNUP_TTL_MS / 1000,
  });
  res.cookie(PENDING_SIGNUP_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: PENDING_SIGNUP_TTL_MS,
  });
}

// Returns the pending Google profile, or null if missing/expired/tampered.
function readPendingSignup(req) {
  const token = req.cookies[PENDING_SIGNUP_COOKIE_NAME];
  if (!token) return null;
  try {
    return jwt.verify(token, env.JWT_SECRET, { audience: PENDING_SIGNUP_AUDIENCE }).profile;
  } catch {
    return null;
  }
}

function clearPendingSignupCookie(res) {
  res.clearCookie(PENDING_SIGNUP_COOKIE_NAME);
}

module.exports = {
  AUTH_COOKIE_NAME,
  signAuthToken,
  verifyAuthToken,
  setAuthCookie,
  clearAuthCookie,
  setPendingSignupCookie,
  readPendingSignup,
  clearPendingSignupCookie,
};
