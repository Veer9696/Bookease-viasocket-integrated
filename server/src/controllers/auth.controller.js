const authService = require("../services/auth.service");
const { signAuthToken, setAuthCookie, clearAuthCookie } = require("../utils/jwt");

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
  res.json({ user: authService.sanitizeUser(req.user) });
}

module.exports = { register, login, logout, me };
