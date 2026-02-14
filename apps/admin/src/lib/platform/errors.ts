export class AppError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status = 500) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super("UNAUTHORIZED", message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super("FORBIDDEN", message, 403);
  }
}

export class ValidationError extends AppError {
  constructor(message = "Invalid request") {
    super("VALIDATION_ERROR", message, 400);
  }
}

export class RateLimitError extends AppError {
  constructor(message = "Too many requests") {
    super("RATE_LIMITED", message, 429);
  }
}
