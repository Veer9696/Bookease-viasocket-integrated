const { BadRequestError } = require("../utils/apiError");

// Wraps a zod schema: validates req.body (or req.query) and replaces it with
// the parsed/coerced result so controllers can trust the shape downstream.
function validate(schema, source = "body") {
  return function (req, res, next) {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return next(new BadRequestError("Validation failed", result.error.flatten().fieldErrors));
    }
    req[source] = result.data;
    next();
  };
}

module.exports = { validate };
