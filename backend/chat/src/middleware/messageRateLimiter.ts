import type { NextFunction, Request, Response } from "express";
import type { AuthenticatedRequest } from "./isAuth.js";
import RateLimiter from "../utils/rateLimiter.js";

const messageLimit = new RateLimiter(5,1000); // 5 messages per second
export const messageRateLimiter = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const userId = (req as AuthenticatedRequest).user?._id;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (!messageLimit.canSend(userId.toString())) {
    return res.status(429).json({ message: "Too many requests" });
  }

  next();
};
