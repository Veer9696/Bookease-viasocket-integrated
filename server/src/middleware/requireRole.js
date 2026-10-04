const { ForbiddenError } = require("../utils/apiError");

function requireRole(...roles) {
  return function (req, res, next) {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new ForbiddenError("You do not have access to this resource"));
    }
    next();
  };
}

module.exports = { requireRole };
