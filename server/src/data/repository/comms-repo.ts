import { eq } from "drizzle-orm";
import { ConflictError, NotFoundError } from "../../types/errors.js";
import { channels, messages, userDevices } from "../db/schema/index.js";
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
}
