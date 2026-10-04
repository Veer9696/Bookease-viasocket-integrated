class ApiError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

class BadRequestError extends ApiError {
  constructor(message = "Bad request", details) {
    super(400, message, details);
  }
}

class UnauthorizedError extends ApiError {
  constructor(message = "Unauthorized") {
    super(401, message);
  }
}

class ForbiddenError extends ApiError {
  constructor(message = "Forbidden") {
    super(403, message);
  }
}

class NotFoundError extends ApiError {
  constructor(message = "Not found") {
    super(404, message);
  }
}

class ConflictError extends ApiError {
  constructor(message = "Conflict") {
    super(409, message);
  }
}

module.exports = {
  ApiError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
};
