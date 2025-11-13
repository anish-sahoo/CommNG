import { z } from "zod";

const attachmentFileIdsSchema = z
  .array(z.uuid())
  .max(10, "Too many attachments")
  .optional();

export const postPostSchema = z.object({
  channelId: z.coerce.number().int().positive(),
  content: z.string().min(1, "Post content cannot be empty"),
  attachmentFileIds: attachmentFileIdsSchema,
});

export const editPostSchema = z.object({
  channelId: z.coerce.number().int().positive(),
  messageId: z.coerce.number().int().positive(),
  content: z.string().min(1, "Post content cannot be empty"),
  attachmentFileIds: attachmentFileIdsSchema,
});

export const deletePostSchema = z.object({
  channelId: z.coerce.number().int().positive(),
  messageId: z.coerce.number().int().positive(),
});

export const createChannelSchema = z.object({
  name: z
    .string()
    .min(1, "Channel name cannot be empty")
    .max(100, "Channel name too long"),
  postingPermissions: z.enum(["everyone", "custom", "admin"]).default("admin"),
  metadata: z
    .object({
      description: z.string().optional(),
      type: z.boolean().optional(),
      icon: z.string().default("announce"),
      imageFileId: z.string().optional(),
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
  imageFileId: z.string().optional(),
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
  notificationsEnabled: z.boolean().default(true),
});

export const deleteSubscriptionSchema = z.object({
  subscriptionId: z.coerce.number().int().positive(),
});

export const deleteChannelSchema = z.object({
  channelId: z.coerce.number().int().positive(),
});

export const leaveChannelSchema = z.object({
  channelId: z.coerce.number().int().positive(),
});

export const joinChannelSchema = z.object({
  channelId: z.coerce.number().int().positive(),
});

export const removeMemberSchema = z.object({
  channelId: z.coerce.number().int().positive(),
  userId: z.string(),
});

export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;
export type DeleteSubscriptionInput = z.infer<typeof deleteSubscriptionSchema>;
export type DeleteChannelInput = z.infer<typeof deleteChannelSchema>;
export type LeaveChannelInput = z.infer<typeof leaveChannelSchema>;
export type JoinChannelInput = z.infer<typeof joinChannelSchema>;
export type RemoveMemberInput = z.infer<typeof removeMemberSchema>;
export type DeletePostInput = z.infer<typeof deletePostSchema>;
export type ToggleReactionInput = z.infer<typeof toggleReactionSchema>;
export type GetChannelMessagesInput = z.infer<typeof getChannelMessagesSchema>;
export type GetChannelMembersInput = z.infer<typeof getChannelMembersSchema>;
export type UpdateChannelInput = z.infer<typeof updateChannelSchema>;
export type CreateChannelInput = z.infer<typeof createChannelSchema>;
export type ChannelUpdateMetadata = z.infer<typeof channelUpdateMetadata>;
