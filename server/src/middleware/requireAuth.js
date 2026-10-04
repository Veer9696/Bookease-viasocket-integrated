const { UnauthorizedError } = require("../utils/apiError");
const { AUTH_COOKIE_NAME, verifyAuthToken } = require("../utils/jwt");
const { prisma } = require("../config/prismaClient");

async function requireAuth(req, res, next) {
  try {
    const token = req.cookies[AUTH_COOKIE_NAME];
    if (!token) throw new UnauthorizedError("Not signed in");

    const payload = verifyAuthToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) throw new UnauthorizedError("Session no longer valid");

    req.user = user;
    next();
  } catch (err) {
    next(new UnauthorizedError("Not signed in"));
  }
}

// Cheap CSRF mitigation for the cookie-based session: cross-site form
// submissions can't set custom headers, so requiring one on every
// state-changing request blocks naive CSRF without needing a token dance.
function requireFetchHeader(req, res, next) {
  if (req.get("X-Requested-With") !== "fetch") {
    return next(new UnauthorizedError("Missing required request header"));
  }
  next();
}

module.exports = { requireAuth, requireFetchHeader };
