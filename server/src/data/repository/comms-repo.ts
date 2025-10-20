import { and, eq } from "drizzle-orm";
import { ConflictError, NotFoundError } from "../../types/errors.js";
import {
  channelSubscriptions,
  channels,
  messages,
  userDevices,
} from "../db/schema/index.js";
import { db } from "../db/sql.js";

export type UserPermissionsResult = {
  canPost: boolean;
  subscriptionPermission: string | null;
  hasDirectRolePermission: boolean;
  hasMessageRolePermission: boolean;
};

export class CommsRepository {
  async getChannelById(channel_id: number) {
    const [channel] = await db
      .select({ id: channels.channelId })
      .from(channels)
      .where(eq(channels.channelId, channel_id))
      .limit(1);

    if (!channel) {
      throw new NotFoundError("Channel not found");
    }

    return channel;
  }

  async createMessage(
    user_id: number,
    channel_id: number,
    content: string,
    attachment_url?: string,
  ) {
    const [created] = await db
      .insert(messages)
      .values({
        channelId: channel_id,
        senderId: user_id,
        message: content,
        attachmentUrl: attachment_url,
      })
      .returning({
        messageId: messages.messageId,
        channelId: messages.channelId,
        senderId: messages.senderId,
        message: messages.message,
        attachmentUrl: messages.attachmentUrl,
        createdAt: messages.createdAt,
      });

    if (!created) {
      throw new ConflictError("Message post failed!");
    }

    return created;
  }

  // Channel subscription methods
  async createSubscription(
    userId: number,
    channelId: number,
    permission: "read" | "write" | "both",
    notificationsEnabled: boolean = true,
  ) {
    // Check if subscription already exists
    const existingSubscription = await db
      .select()
      .from(channelSubscriptions)
      .where(
        and(
          eq(channelSubscriptions.userId, userId),
          eq(channelSubscriptions.channelId, channelId),
        ),
      )
      .limit(1);

    if (existingSubscription.length > 0) {
      throw new ConflictError("User is already subscribed to this channel");
    }

    const [subscription] = await db
      .insert(channelSubscriptions)
      .values({
        userId,
        channelId,
        permission,
        notificationsEnabled,
      })
      .returning();

    return subscription;
  }

  async deleteSubscription(subscriptionId: number, userId: number) {
    const [deleted] = await db
      .delete(channelSubscriptions)
      .where(
        and(
          eq(channelSubscriptions.subscriptionId, subscriptionId),
          eq(channelSubscriptions.userId, userId), // Ensure user can only delete their own subscriptions
        ),
      )
      .returning();

    if (!deleted) {
      throw new NotFoundError(
        "Subscription not found or you don't have permission to delete it",
      );
    }

    return deleted;
  }

  async getUserSubscriptions(userId: number) {
    return await db
      .select({
        subscriptionId: channelSubscriptions.subscriptionId,
        channelId: channelSubscriptions.channelId,
        permission: channelSubscriptions.permission,
        notificationsEnabled: channelSubscriptions.notificationsEnabled,
        channelName: channels.name,
      })
      .from(channelSubscriptions)
      .innerJoin(
        channels,
        eq(channelSubscriptions.channelId, channels.channelId),
      )
      .where(eq(channelSubscriptions.userId, userId));
  }

  async registerDevice(
    userId: number,
    deviceType: string,
    deviceToken: string,
  ) {
    const [device] = await db
      .insert(userDevices)
      .values({
        userId,
        deviceType,
        deviceToken,
      })
      .returning();

    return device;
  }
}
