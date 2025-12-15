export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const ErrorCodes = {
  // Auth errors
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  USER_EXISTS: "USER_EXISTS",
  UNAUTHORIZED: "UNAUTHORIZED",

  // Validation errors
  INVALID_INPUT: "INVALID_INPUT",

  // Post errors
  POST_NOT_FOUND: "POST_NOT_FOUND",
  GENERATION_FAILED: "GENERATION_FAILED",

  // General errors
  INTERNAL_ERROR: "INTERNAL_ERROR",
  RATE_LIMITED: "RATE_LIMITED",
};
