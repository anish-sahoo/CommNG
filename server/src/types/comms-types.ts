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

export const createChannelSchema = z.object({
  name: z
    .string()
    .min(1, "Channel name cannot be empty")
    .max(100, "Channel name too long"),
  metadata: z
    .object({
      description: z.string().optional(),
      isPrivate: z.boolean().optional(),
      tags: z.array(z.string()).optional(),
    })
    .loose()
    .optional(),
});

export const channelUpdateMetadata = z.object({
  name: z
    .string()
    .min(1, "Channel name cannot be empty")
    .max(100, "Channel name too long"),
  description: z.string().optional(),
  postingPermissions: z.enum(["everyone", "custom", "admin"]).optional(),
});

export const updateChannelSchema = z.object({
  channelId: z.coerce.number().int().positive(),
  metadata: channelUpdateMetadata,
});

// Channel members schema
export const getChannelMembersSchema = z.object({
  channelId: z.coerce.number().int().positive(),
});

// Get channel messages schema
export const getChannelMessagesSchema = z.object({
  channelId: z.coerce.number().int().positive(),
});

export const toggleReactionSchema = z.object({
  channelId: z.coerce.number().int().positive(),
  messageId: z.coerce.number().int().positive(),
  emoji: z.string().min(1),
  active: z.boolean(),
});

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
export type ToggleReactionInput = z.infer<typeof toggleReactionSchema>;
export type GetChannelMessagesInput = z.infer<typeof getChannelMessagesSchema>;
export type GetChannelMembersInput = z.infer<typeof getChannelMembersSchema>;
export type UpdateChannelInput = z.infer<typeof updateChannelSchema>;
export type CreateChannelInput = z.infer<typeof createChannelSchema>;
export type ChannelUpdateMetadata = z.infer<typeof channelUpdateMetadata>;
