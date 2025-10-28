import { z } from "zod";

export const subscribeInputSchema = z.object({
  endpoint: z.string().min(1),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
  topics: z.array(z.string()).optional(),
});

export const notificationPayloadSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1).max(200).optional(),
  data: z.any().optional(),
});

export type SubscribeInput = z.infer<typeof subscribeInputSchema>;
export type PushSubscriptionKeys = SubscribeInput["keys"];
export type NotificationPayload = z.infer<typeof notificationPayloadSchema>;
