import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";

/**
 * Global API error handler
 * - Duplicate key (Mongo code 11000) => 409
 * - Mongoose CastError (invalid ObjectId) => 400
 * - Fallback => 500
 */
function handleApiErrors(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Mongoose duplicate key error
  if (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: number }).code === 11000
  ) {
    return res.status(409).json({
      message: "A record with that value already exists.",
    });
  }

  // Mongoose cast error (e.g., bad ObjectId)
  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({
      message: "Invalid identifier format.",
    });
  }

  // Generic fallback (no stack trace leak)
  return res.status(500).json({
    message: "Something went wrong. Please try again later.",
  });
}

export default handleApiErrors