import { z } from "zod";

export const postPostSchema = z.object({
  channelId: z.coerce.number().int().positive(),
  content: z.string().min(1, "Post content cannot be empty"),
  attachmentUrl: z.string().url().optional(),
});
