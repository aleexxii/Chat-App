import { z } from "zod";

export const sendMessageSchema = z
  .object({
    chatId: z.string().min(1, "Chat ID is required"),

    text: z
      .string()
      .trim()
      .max(2000, "Message text cannot exceed 1000 characters")
      .optional()
      .or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    if (!data.text?.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "Either text or image is required",
        path: ["text"],
      });
    }
  });
