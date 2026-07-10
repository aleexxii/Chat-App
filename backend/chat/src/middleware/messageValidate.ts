import type{ NextFunction, Request, Response } from "express";

export const validateMessage = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { chatId, text } = req.body;

  const hasText = typeof text === "string" && text.trim().length > 0;
  const hasImage = !!req.file;

  if (!chatId?.trim()) {
    return res.status(400).json({
      status: "error",
      message: "Chat ID is required",
    });
  }

  if (!hasText && !hasImage) {
    return res.status(400).json({
      status: "error",
      message: "Either text or image is required",
    });
  }

  if (hasText && text.length > 2000) {
    return res.status(400).json({
      status: "error",
      message: "Message cannot exceed 2000 characters",
    });
  }

  next();
};
