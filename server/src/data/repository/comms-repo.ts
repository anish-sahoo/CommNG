import { and, eq, isNotNull, or, sql } from "drizzle-orm";
import {
  ConflictError,
  InternalServerError,
  NotFoundError,
} from "../../types/errors.js";
import log from "../../utils/logger.js";
import {
  channelSubscriptions,
  channels,
  messageReactions,
  messages,
  roles,
  userDevices,
  userRoles,
  users,
} from "../db/schema.js";
import { db } from "../db/sql.js";

export type Transaction = Parameters<typeof db.transaction>[0] extends (
  arg: infer T,
) => unknown
  ? T
  : never;

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
    const members = await db
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

  async getChannelDataByName(name: string) {
    return await db
      .select()
      .from(channels)
      .where(eq(channels.name, name))
      .limit(1);
  }

  async getChannelDataByID(channel_id: number) {
    const [result] = await db
      .select()
      .from(channels)
      .where(eq(channels.channelId, channel_id))
      .limit(1);
    return result;
  }

  // Channel creation method
  async createChannel(name: string, metadata?: Record<string, unknown>) {
    // Check if channel with this name already exists
    const existingChannel = await this.getChannelDataByName(name);

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

  async getAccessibleChannels(userId: string) {
    const accessibleChannels = await db
      .selectDistinct({
        channelId: channels.channelId,
        name: channels.name,
        metadata: channels.metadata,
      })
      .from(channels)
      .leftJoin(
        channelSubscriptions,
        and(
          eq(channelSubscriptions.channelId, channels.channelId),
          eq(channelSubscriptions.userId, userId),
        ),
      )
      .leftJoin(userRoles, eq(userRoles.userId, userId))
      .leftJoin(
        roles,
        and(
          eq(userRoles.roleId, roles.roleId),
          eq(roles.channelId, channels.channelId),
          eq(roles.namespace, "channel"),
        ),
      )
      .where(
        or(
          sql`coalesce(${channels.metadata}->>'type', 'public') = 'public'`,
          isNotNull(channelSubscriptions.subscriptionId),
          isNotNull(roles.roleId),
        ),
      )
      .orderBy(channels.name);

    return accessibleChannels;
  }

  // Get channel messages method
  private async getReactionsForMessages(
    messageIds: number[],
    currentUserId: string,
  ) {
    if (!messageIds.length) {
      return new Map<
        number,
        {
          emoji: string;
          count: number;
          reactedByCurrentUser: boolean;
        }[]
      >();
    }

    const valuesList = sql.join(
      messageIds.map((id) => sql`${id}`),
      sql`, `,
    );

    const reactionRows = await db.execute<{
      message_id: number;
      reactions: Array<{
        emoji: string;
        count: number;
        reactedByCurrentUser: boolean;
      }> | null;
    }>(sql`
      with message_list(message_id) as (
        values ${valuesList}
      )
      select ml.message_id,
        coalesce(
          json_agg(
            json_build_object(
              'emoji', mr.emoji,
              'count', count(mr.emoji),
              'reactedByCurrentUser', bool_or(mr.user_id = ${currentUserId})
            )
            order by count(mr.emoji) desc, mr.emoji asc
          ),
          '[]'::json
        ) as reactions
      from message_list ml
      left join ${messageReactions} mr on mr.message_id = ml.message_id
      group by ml.message_id
    `);

    const result = new Map<
      number,
      {
        emoji: string;
        count: number;
        reactedByCurrentUser: boolean;
      }[]
    >();

    for (const row of reactionRows.rows) {
      const reactionsArray = Array.isArray(row.reactions) ? row.reactions : [];
      result.set(
        row.message_id,
        reactionsArray.map((reaction) => ({
          emoji: reaction.emoji,
          count: Number(reaction.count),
          reactedByCurrentUser: Boolean(reaction.reactedByCurrentUser),
        })),
      );
    }

    for (const messageId of messageIds) {
      if (!result.has(messageId)) {
        result.set(messageId, []);
      }
    }

    return result;
  }

  async getChannelMessages(channel_id: number, currentUserId: string) {
    const messagesList = await db
      .select({
        messageId: messages.messageId,
        channelId: messages.channelId,
        senderId: messages.senderId,
        message: messages.message,
        attachmentUrl: messages.attachmentUrl,
        createdAt: messages.createdAt,
        authorName: users.name,
        authorClearanceLevel: users.clearanceLevel,
        authorDepartment: users.department,
      })
      .from(messages) // Retrieve from messages table
      .leftJoin(users, eq(messages.senderId, users.id))
      .where(eq(messages.channelId, channel_id))
      .orderBy(messages.createdAt);

    const reactionMap = await this.getReactionsForMessages(
      messagesList.map((message) => message.messageId),
      currentUserId,
    );

    return messagesList.map((message) => ({
      ...message,
      reactions: reactionMap.get(message.messageId) ?? [],
    }));
  }

  async setMessageReaction({
    messageId,
    userId,
    emoji,
    active,
  }: {
    messageId: number;
    userId: string;
    emoji: string;
    active: boolean;
  }) {
    await db.transaction(async (tx) => {
      if (active) {
        await tx
          .insert(messageReactions)
          .values({
            messageId,
            userId,
            emoji,
          })
          .onConflictDoNothing();
      } else {
        await tx
          .delete(messageReactions)
          .where(
            and(
              eq(messageReactions.messageId, messageId),
              eq(messageReactions.userId, userId),
              eq(messageReactions.emoji, emoji),
            ),
          );
      }
    });

    const reactions = await this.getReactionsForMessages([messageId], userId);

    return reactions.get(messageId) ?? [];
  }

  async updateChannelSettings(
    listOfUpdates: ((tx: Transaction) => Promise<unknown>)[],
  ): Promise<boolean> {
    try {
      await db.transaction(async (tx) => {
        for (const updateFn of listOfUpdates) {
          await updateFn(tx);
        }
      });
      return true;
    } catch (err) {
      log.error(err, "Error updating channel settings");
      throw new InternalServerError("Error updating channel settings");
    }
  }
}
