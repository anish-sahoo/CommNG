import { z } from "zod";
import { roleKeySchema } from "../data/roles.js";

const attachmentFileIdsSchema = z
  .array(z.uuid())
  .max(10, "Too many attachments")
  .optional();

const messageAttachmentSchema = z.object({
  fileId: z.string(),
  fileName: z.string(),
  contentType: z.string().nullish(),
});

const reactionSchema = z.object({
  emoji: z.string(),
  count: z.number(),
  reactedByCurrentUser: z.boolean(),
});

export const postPostSchema = z.object({
  channelId: z.coerce.number().int().positive(),
  content: z.string().min(1, "Post content cannot be empty"),
  attachmentFileIds: attachmentFileIdsSchema,
});

export const postPostOutputSchema = z.object({
  attachments: z.array(messageAttachmentSchema),
  messageId: z.number(),
  channelId: z.number(),
  senderId: z.string().nullable(),
  message: z.string().nullable(),
  createdAt: z.date(),
});

export const editPostSchema = z.object({
  channelId: z.coerce.number().int().positive(),
  messageId: z.coerce.number().int().positive(),
  content: z.string().min(1, "Post content cannot be empty"),
  attachmentFileIds: attachmentFileIdsSchema,
});

export const editPostOutputSchema = postPostOutputSchema;

export const deletePostSchema = z.object({
  channelId: z.coerce.number().int().positive(),
  messageId: z.coerce.number().int().positive(),
});

export const deletePostOutputSchema = postPostOutputSchema
  .omit({ attachments: true })
  .extend(z.object({ attachmentFileIds: z.array(z.string()) }).shape);

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

export const createChannelOutputSchema = z.object({
  channelId: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  createdAt: z.date(),
  metadata: z.unknown(),
  postPermissionLevel: z.enum(["custom", "admin", "everyone"]),
});

const channelUpdateMetadata = z.object({
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

export const updateChannelOutputSchema = createChannelOutputSchema.optional();

// Channel members schema
export const getChannelMembersSchema = z.object({
  channelId: z.coerce.number().int().positive(),
});

export const getChannelMembersOutputSchema = z.array(
  z.object({
    userId: z.string(),
    name: z.string(),
    email: z.string(),
    rank: z.string().nullish(),
    branch: z.string().nullish(),
    department: z.string().nullish(),
    image: z.string().nullish(),
    roleKey: roleKeySchema,
    action: z.string(),
  }),
);

// Get channel messages schema
export const getChannelMessagesSchema = z.object({
  channelId: z.coerce.number().int().positive(),
});

export const getChannelMessagesOutputSchema = z.array(
  z.object({
    reactions: z.array(reactionSchema),
    attachments: z.array(messageAttachmentSchema),
    messageId: z.number(),
    channelId: z.number(),
    senderId: z.string().nullable(),
    message: z.string().nullable(),
    createdAt: z.date(),
    authorName: z.string().nullable(),
    authorImage: z.string().nullable(),
    authorRank: z.string().nullable(),
    authorDepartment: z.string().nullable(),
    authorBranch: z.string().nullable(),
  }),
);

export const toggleReactionSchema = z.object({
  channelId: z.coerce.number().int().positive(),
  messageId: z.coerce.number().int().positive(),
  emoji: z.string().min(1),
  active: z.boolean(),
});

export const toggleReactionOutputSchema = z.object({
  messageId: z.number(),
  reactions: z.array(reactionSchema),
});

const subscriptionSchema = z.object({
  userId: z.string(),
  subscriptionId: z.number(),
  channelId: z.number(),
  notificationsEnabled: z.boolean(),
  createdAt: z.date(),
});

export const getUserSubscriptionsOutputSchema = z.array(
  subscriptionSchema
    .omit({ createdAt: true, userId: true })
    .extend(z.object({ channelName: z.string() }).shape),
);

// Channel subscription schemas
export const createSubscriptionSchema = z.object({
  channelId: z.coerce.number().int().positive(),
  notificationsEnabled: z.boolean().default(true),
});

export const createSubscriptionOutputSchema = subscriptionSchema.optional();

export const deleteSubscriptionSchema = z.object({
  subscriptionId: z.coerce.number().int().positive(),
});

export const deleteSubscriptionOutputSchema = subscriptionSchema;

export const updateSubscriptionSchema = z.object({
  channelId: z.coerce.number().int().positive(),
  userId: z.coerce.string().min(1),
  notificationsEnabled: z.boolean().default(true),
});

export const updateSubscriptionOutputSchema = subscriptionSchema
  .extend(z.object({ userId: z.string() }).shape)
  .optional();

export const deleteChannelSchema = z.object({
  channelId: z.coerce.number().int().positive(),
});

export const deleteChannelOutputSchema = z.object({
  name: z.string(),
  metadata: z.unknown(),
  createdAt: z.date(),
  description: z.string().nullable(),
  channelId: z.number(),
  postPermissionLevel: z.enum(["custom", "admin", "everyone"]),
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

export const getAllChannelsOutputSchema = z.array(
  z.object({
    channelId: z.number(),
    name: z.string(),
    metadata: z.record(z.string(), z.unknown()).nullable(),
    userPermission: z.enum(["admin", "post", "read"]).nullable(),
    postPermissionLevel: z.enum(["admin", "everyone", "custom"]),
  }),
);

export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;
export type DeleteSubscriptionInput = z.infer<typeof deleteSubscriptionSchema>;
export type updateSubscriptionInput = z.infer<typeof updateSubscriptionSchema>;
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
