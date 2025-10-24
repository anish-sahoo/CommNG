import { and, eq } from "drizzle-orm";
import { ConflictError, NotFoundError } from "../../types/errors.js";
import {
  channelSubscriptions,
  channels,
  messages,
  roles,
  userDevices,
  userRoles,
  users,
} from "../db/schema.js";
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

  async getChannelMembers(channel_id: number) {
    const [members] = await db
      .select({
        userId: users.id,
        name: users.name,
        email: users.email,
        clearanceLevel: users.clearanceLevel,
        department: users.department,
        roleKey: roles.roleKey,
        action: roles.action,
      })
      .from(userRoles) // start from userRoles table because it has info abt both users and roles
      .innerJoin(users, eq(userRoles.userId, users.id)) // join to get user details
      .innerJoin(roles, eq(userRoles.roleId, roles.roleId)) // join to get role details
      .where(
        and(
          eq(roles.channelId, channel_id), // find for the specific channel
          eq(roles.namespace, "channel"), // only channel roles
        ),
      );

    return members;
  }

  async createMessage(
    user_id: string,
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

  async getMessageById(message_id: number) {
    const [message] = await db
      .select({
        messageId: messages.messageId,
        channelId: messages.channelId,
        senderId: messages.senderId,
        message: messages.message,
        attachmentUrl: messages.attachmentUrl,
        createdAt: messages.createdAt,
      })
      .from(messages)
      .where(eq(messages.messageId, message_id))
      .limit(1);

    if (!message) {
      throw new NotFoundError("Message not found");
    }

    return message;
  }

  async updateMessage(
    message_id: number,
    channel_id: number,
    content: string,
    attachment_url?: string,
  ) {
    const [updated] = await db
      .update(messages)
      .set({
        message: content,
        attachmentUrl: attachment_url ?? null,
      })
      .where(
        and(
          eq(messages.messageId, message_id),
          eq(messages.channelId, channel_id),
        ),
      )
      .returning({
        messageId: messages.messageId,
        channelId: messages.channelId,
        senderId: messages.senderId,
        message: messages.message,
        attachmentUrl: messages.attachmentUrl,
        createdAt: messages.createdAt,
      });

    if (!updated) {
      throw new ConflictError("Message update failed!");
    }

    return updated;
  }

  async deleteMessage(message_id: number, channel_id: number) {
    const [deleted] = await db
      .delete(messages)
      .where(
        and(
          eq(messages.messageId, message_id),
          eq(messages.channelId, channel_id),
        ),
      )
      .returning({
        messageId: messages.messageId,
        channelId: messages.channelId,
        senderId: messages.senderId,
        message: messages.message,
        attachmentUrl: messages.attachmentUrl,
        createdAt: messages.createdAt,
      });

    if (!deleted) {
      throw new NotFoundError("Message not found");
    }

    return deleted;
  }
  // Channel subscription methods
  async createSubscription(
    userId: string,
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

  async deleteSubscription(subscriptionId: number, userId: string) {
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

  async getUserSubscriptions(userId: string) {
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
    userId: string,
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

  // Channel creation method
  async createChannel(name: string, metadata?: Record<string, unknown>) {
    // Check if channel with this name already exists
    const existingChannel = await db
      .select()
      .from(channels)
      .where(eq(channels.name, name))
      .limit(1);

    if (existingChannel.length > 0) {
      throw new ConflictError("Channel with this name already exists");
    }

    const [channel] = await db
      .insert(channels)
      .values({
        name,
        metadata: metadata || null,
      })
      .returning();

    return channel;
  }

  async getAllChannels() {
    return await db
      .select({
        channelId: channels.channelId,
        name: channels.name,
        metadata: channels.metadata,
      })
      .from(channels);
  }
}
