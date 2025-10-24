import { z } from "zod";

export const postPostSchema = z.object({
  channelId: z.coerce.number().int().positive(),
  content: z.string().min(1, "Post content cannot be empty"),
  attachmentUrl: z.string().url().optional(),
});

export const editPostSchema = z.object({
  channelId: z.coerce.number().int().positive(),
  messageId: z.coerce.number().int().positive(),
  content: z.string().min(1, "Post content cannot be empty"),
  attachmentUrl: z.string().url().optional(),
});

export const deletePostSchema = z.object({
  channelId: z.coerce.number().int().positive(),
  messageId: z.coerce.number().int().positive(),
});
export const registerDeviceSchema = z.object({
  deviceType: z.string(),
  deviceToken: z.string(),
});

// Channel creation schema
export const createChannelSchema = z.object({
  name: z
    .string()
    .min(1, "Channel name cannot be empty")
    .max(100, "Channel name too long"),
  metadata: z.record(z.unknown()).optional(), // Optional JSON metadata
});

export type CreateChannelInput = z.infer<typeof createChannelSchema>;

// Channel members schema
export const getChannelMembersSchema = z.object({
  channelId: z.coerce.number().int().positive(),
});

export type GetChannelMembersInput = z.infer<typeof getChannelMembersSchema>;

// Channel subscription schemas
export const createSubscriptionSchema = z.object({
  channelId: z.coerce.number().int().positive(),
  permission: z.enum(["read", "write", "both"]),
  notificationsEnabled: z.boolean().default(true),
});

export const deleteSubscriptionSchema = z.object({
  subscriptionId: z.coerce.number().int().positive(),
});

export type RegisterDeviceInput = z.infer<typeof registerDeviceSchema>;
export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;
export type DeleteSubscriptionInput = z.infer<typeof deleteSubscriptionSchema>;
export type DeletePostInput = z.infer<typeof deletePostSchema>;
