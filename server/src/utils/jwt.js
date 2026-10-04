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

module.exports = {
  AUTH_COOKIE_NAME,
  signAuthToken,
  verifyAuthToken,
  setAuthCookie,
  clearAuthCookie,
};
