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

// Channel subscription schemas
export const createSubscriptionSchema = z.object({
  channelId: z.coerce.number().int().positive(),
  permission: z.enum(["read", "write", "both"]),
  notificationsEnabled: z.boolean().default(true),
});

export const deleteSubscriptionSchema = z.object({
  subscriptionId: z.coerce.number().int().positive(),
});

export const getUserSubscriptionsSchema = z.object({
  userId: z.coerce.number().int().positive().optional(), // Optional for getting current user's subscriptions
});

export type RegisterDeviceInput = z.infer<typeof registerDeviceSchema>;
export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;
export type DeleteSubscriptionInput = z.infer<typeof deleteSubscriptionSchema>;
export type GetUserSubscriptionsInput = z.infer<
  typeof getUserSubscriptionsSchema
>;
