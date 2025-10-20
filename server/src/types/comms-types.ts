import { z } from "zod";

export const postPostSchema = z.object({
  channelId: z.coerce.number().int().positive(),
  content: z.string().min(1, "Post content cannot be empty"),
  attachmentUrl: z.string().url().optional(),
});

export const registerDeviceSchema = z.object({
  deviceType: z.string(),
  deviceToken: z.string(),
});

export type RegisterDeviceInput = z.infer<typeof registerDeviceSchema>;

// Channel creation schema
export const createChannelSchema = z.object({
  name: z
    .string()
    .min(1, "Channel name cannot be empty")
    .max(100, "Channel name too long"),
  metadata: z.record(z.unknown()).optional(), // Optional JSON metadata
});

export type CreateChannelInput = z.infer<typeof createChannelSchema>;
