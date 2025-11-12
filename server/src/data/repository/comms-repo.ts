import { and, desc, eq, inArray, sql } from "drizzle-orm";
import type { QueryResult } from "pg";
import { ConflictError, NotFoundError } from "../../types/errors.js";
import { fileMetadataSchema } from "../../types/file-types.js";
import log from "../../utils/logger.js";
import {
  channelSubscriptions,
  channels,
  files,
  messageAttachments,
  messageReactions,
  messages,
  roles,
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

export type MessageAttachmentRecord = {
  fileId: string;
  fileName: string;
  contentType?: string | null;
};

/**
 * Repository for communication-related database operations (channels, messages, subscriptions, etc)
 */
export class CommsRepository {
  private async getAttachmentsForMessages(
    executor: Transaction | typeof db,
    messageIds: number[],
  ): Promise<Map<number, MessageAttachmentRecord[]>> {
    const attachmentMap = new Map<number, MessageAttachmentRecord[]>();

    if (messageIds.length === 0) {
      return attachmentMap;
    }

    const attachmentRows = await executor
      .select({
        messageId: messageAttachments.messageId,
        fileId: messageAttachments.fileId,
        fileName: files.fileName,
        metadata: files.metadata,
      })
      .from(messageAttachments)
      .innerJoin(files, eq(messageAttachments.fileId, files.fileId))
      .where(inArray(messageAttachments.messageId, messageIds));

    for (const row of attachmentRows) {
      const parsedMetadata = fileMetadataSchema.safeParse(row.metadata);
      const contentType = parsedMetadata.success
        ? (parsedMetadata.data.contentType ?? null)
        : null;
      const existing = attachmentMap.get(row.messageId) ?? [];
      existing.push({
        fileId: row.fileId,
        fileName: row.fileName,
        contentType,
      });
      attachmentMap.set(row.messageId, existing);
    }

    for (const messageId of messageIds) {
      if (!attachmentMap.has(messageId)) {
        attachmentMap.set(messageId, []);
      }
    }

    return attachmentMap;
  }

  /**
   * Get channel by its ID
   * @param channel_id Channel ID
   * @returns Channel object
   * @throws NotFoundError if channel not found
   */
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

  /**
   * Get all members of a channel, including their roles
   * @param channel_id Channel ID
   * @returns Array of member objects
   */
  async getChannelMembers(channel_id: number) {
    const members = await db
      .select({
        userId: users.id,
        name: users.name,
        email: users.email,
        rank: users.rank,
        branch: users.branch,
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

  /**
   * Create a new message in a channel, optionally with attachments
   * @param user_id Sender user ID
   * @param channel_id Channel ID
   * @param content Message content
   * @param attachmentFileIds Optional array of file IDs for attachments
   * @returns Created message object with attachments
   * @throws ConflictError if message creation fails
   */
  async createMessage(
    user_id: string,
    channel_id: number,
    content: string,
    attachmentFileIds?: string[],
  ) {
    return await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(messages)
        .values({
          channelId: channel_id,
          senderId: user_id,
          message: content,
        })
        .returning({
          messageId: messages.messageId,
          channelId: messages.channelId,
          senderId: messages.senderId,
          message: messages.message,
          createdAt: messages.createdAt,
        });

      if (!created) {
        throw new ConflictError("Message post failed!");
      }

      const uniqueAttachmentIds = Array.from(
        new Set(attachmentFileIds ?? []),
      ).filter((fileId) => fileId);

      if (uniqueAttachmentIds.length > 0) {
        await tx
          .insert(messageAttachments)
          .values(
            uniqueAttachmentIds.map((fileId) => ({
              messageId: created.messageId,
              fileId,
            })),
          )
          .onConflictDoNothing({
            target: [messageAttachments.messageId, messageAttachments.fileId],
          });
      }

      const attachmentMap = await this.getAttachmentsForMessages(tx, [
        created.messageId,
      ]);

      return {
        ...created,
        attachments: attachmentMap.get(created.messageId) ?? [],
      };
    });
  }

  /**
   * Get a message by its ID, including attachments
   * @param message_id Message ID
   * @returns Message object with attachments
   * @throws NotFoundError if message not found
   */
  async getMessageById(message_id: number) {
    const [message] = await db
      .select({
        messageId: messages.messageId,
        channelId: messages.channelId,
        senderId: messages.senderId,
        message: messages.message,
        createdAt: messages.createdAt,
      })
      .from(messages)
      .where(eq(messages.messageId, message_id))
      .limit(1);

    if (!message) {
      throw new NotFoundError("Message not found");
    }

    const attachmentMap = await this.getAttachmentsForMessages(db, [
      message.messageId,
    ]);

    return {
      ...message,
      attachments: attachmentMap.get(message.messageId) ?? [],
    };
  }

  /**
   * Update a message's content and attachments
   * @param message_id Message ID
   * @param channel_id Channel ID
   * @param content New message content
   * @param attachmentFileIds Optional array of file IDs for attachments
   * @returns Updated message object with attachments
   * @throws ConflictError if update fails
   */
  async updateMessage(
    message_id: number,
    channel_id: number,
    content: string,
    attachmentFileIds?: string[],
  ) {
    return await db.transaction(async (tx) => {
      const [updated] = await tx
        .update(messages)
        .set({
          message: content,
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
          createdAt: messages.createdAt,
        });

      if (!updated) {
        throw new ConflictError("Message update failed!");
      }

      if (attachmentFileIds) {
        await tx
          .delete(messageAttachments)
          .where(eq(messageAttachments.messageId, message_id));

        const uniqueFileIds = Array.from(new Set(attachmentFileIds)).filter(
          (fileId) => fileId,
        );

        if (uniqueFileIds.length > 0) {
          await tx
            .insert(messageAttachments)
            .values(
              uniqueFileIds.map((fileId) => ({
                messageId: message_id,
                fileId,
              })),
            )
            .onConflictDoNothing({
              target: [messageAttachments.messageId, messageAttachments.fileId],
            });
        }
      }

      const attachmentMap = await this.getAttachmentsForMessages(tx, [
        updated.messageId,
      ]);

      return {
        ...updated,
        attachments: attachmentMap.get(updated.messageId) ?? [],
      };
    });
  }

  /**
   * Delete a message and return its details and attachment file IDs
   * @param message_id Message ID
   * @param channel_id Channel ID
   * @returns Deleted message object and attachment file IDs
   * @throws NotFoundError if message not found
   */
  async deleteMessage(message_id: number, channel_id: number) {
    // First, get the attachments before deleting the message
    const attachments = await db
      .select({
        fileId: messageAttachments.fileId,
      })
      .from(messageAttachments)
      .where(eq(messageAttachments.messageId, message_id));

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
        createdAt: messages.createdAt,
      });

    if (!deleted) {
      throw new NotFoundError("Message not found");
    }

    return {
      ...deleted,
      attachmentFileIds: attachments.map((a) => a.fileId),
    };
  }
  // Channel subscription methods - for notification preferences only
  /**
   * Create a channel subscription for a user, throws if already exists
   * @param userId User ID
   * @param channelId Channel ID
   * @param notificationsEnabled Whether notifications are enabled (default: true)
   * @returns Created subscription object
   * @throws ConflictError if already subscribed
   */
  async createSubscription(
    userId: string,
    channelId: number,
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
        notificationsEnabled,
      })
      .returning();

    return subscription;
  }

  /**
   * Ensure a user is subscribed to a channel, creates if missing
   * @param userId User ID
   * @param channelId Channel ID
   * @returns True if subscription exists or was created, false on error
   */
  async ensureChannelSubscription(userId: string, channelId: number) {
    try {
      // Check if subscription already exists
      const existing = await db
        .select()
        .from(channelSubscriptions)
        .where(
          and(
            eq(channelSubscriptions.userId, userId),
            eq(channelSubscriptions.channelId, channelId),
          ),
        )
        .limit(1);

      if (existing.length === 0) {
        // Create subscription with notifications enabled by default
        await db.insert(channelSubscriptions).values({
          userId,
          channelId,
          notificationsEnabled: true,
        });
        log.debug({ userId, channelId }, "Auto-created channel subscription");
      }
      return true;
    } catch (e) {
      log.error(
        e,
        `Error ensuring subscription for user ${userId} in channel ${channelId}`,
      );
      return false;
    }
  }

  /**
   * Delete a user's channel subscription by subscription ID
   * @param subscriptionId Subscription ID
   * @param userId User ID
   * @returns Deleted subscription object
   * @throws NotFoundError if not found or no permission
   */
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

  /**
   * Get all channel subscriptions for a user
   * @param userId User ID
   * @returns Array of subscription objects
   */
  async getUserSubscriptions(userId: string) {
    return await db
      .select({
        subscriptionId: channelSubscriptions.subscriptionId,
        channelId: channelSubscriptions.channelId,
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

  /**
   * Get channel data by channel name
   * @param name Channel name
   * @returns Channel data array
   */
  async getChannelDataByName(name: string) {
    return await db
      .select()
      .from(channels)
      .where(eq(channels.name, name))
      .limit(1);
  }

  /**
   * Get channel data by channel ID
   * @param channel_id Channel ID
   * @returns Channel data object
   */
  async getChannelDataByID(channel_id: number) {
    const [result] = await db
      .select()
      .from(channels)
      .where(eq(channels.channelId, channel_id))
      .limit(1);
    return result;
  }

  // Channel creation method
  /**
   * Create a new channel. Throws if name already exists.
   * @param name Channel name
   * @param metadata Optional channel metadata
   * @param postingPermissions Posting permission level (default: "admin")
   * @returns Created channel object
   * @throws ConflictError if channel name exists
   */
  async createChannel(
    name: string,
    metadata?: Record<string, unknown>,
    postingPermissions: "admin" | "everyone" | "custom" = "admin",
  ) {
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
        postPermissionLevel: postingPermissions,
      })
      .returning();

    return channel;
  }

  /**
   * Get all channels accessible to a user, with permissions.
   * @param userId User ID
   * @returns Array of accessible channel objects
   */
  async getAccessibleChannels(userId: string) {
    const accessibleChannels = await db.execute<{
      channelId: number;
      name: string;
      metadata: Record<string, unknown> | null;
      // What *this specific user* can do in the channel right now (derived from their roles)
      userPermission: "admin" | "post" | "read" | null;
      // The channel’s default posting policy (how the channel itself is configured: read-only, everyone, or custom)
      postPermissionLevel: "admin" | "everyone" | "custom";
    }>(sql`
      SELECT DISTINCT ON (c.channel_id)
        c.channel_id AS "channelId",
        c.name,
        c.metadata,
        c.post_permission_level AS "postPermissionLevel",
        CASE
          WHEN MAX(CASE WHEN r.action = 'admin' THEN 3 WHEN r.action = 'post' THEN 2 WHEN r.action = 'read' THEN 1 ELSE 0 END) >= 3 THEN 'admin'::text
          WHEN MAX(CASE WHEN r.action = 'admin' THEN 3 WHEN r.action = 'post' THEN 2 WHEN r.action = 'read' THEN 1 ELSE 0 END) = 2 THEN 'post'::text
          WHEN MAX(CASE WHEN r.action = 'admin' THEN 3 WHEN r.action = 'post' THEN 2 WHEN r.action = 'read' THEN 1 ELSE 0 END) = 1 THEN 'read'::text
          ELSE NULL
        END as "userPermission"
      FROM ${channels} c
      LEFT JOIN ${userRoles} ur ON ur.user_id = ${userId}
      LEFT JOIN ${roles} r ON r.role_id = ur.role_id
        AND r.channel_id = c.channel_id
        AND r.namespace = 'channel'
      WHERE
        COALESCE(c.metadata->>'type', 'public') = 'public'
        OR r.role_id IS NOT NULL
      GROUP BY c.channel_id, c.name, c.metadata, c.post_permission_level
      ORDER BY c.channel_id, c.name
    `);

    return accessibleChannels.rows;
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
      messageIds.map((id) => sql`(${id}::int)`),
      sql`, `,
    );

    const result = new Map<
      number,
      {
        emoji: string;
        count: number;
        reactedByCurrentUser: boolean;
      }[]
    >();

    let reactionRows: QueryResult<{
      message_id: number;
      reactions: Array<{
        emoji: string;
        count: number;
        reactedByCurrentUser: boolean;
      }> | null;
    }> | null = null;

    try {
      reactionRows = await db.execute<{
        message_id: number;
        reactions: Array<{
          emoji: string;
          count: number;
          reactedByCurrentUser: boolean;
        }> | null;
      }>(sql`
        with message_list(message_id) as (values ${valuesList}),
        reaction_totals as (
          select mr.message_id,
                 mr.emoji,
                 count(*) as reaction_count,
                 bool_or(mr.user_id = (${currentUserId})) as reacted_by_current_user
          from message_list ml
          left join ${messageReactions} mr on mr.message_id = ml.message_id
          where mr.message_id is not null
          group by mr.message_id, mr.emoji
        )
        select ml.message_id,
               coalesce(
                 json_agg(
                   json_build_object(
                     'emoji', rt.emoji,
                     'count', rt.reaction_count,
                     'reactedByCurrentUser', rt.reacted_by_current_user
                   )
                   order by rt.reaction_count desc, rt.emoji asc
                 ) filter (where rt.emoji is not null),
                 '[]'::json
               ) as reactions
        from message_list ml
        left join reaction_totals rt on rt.message_id = ml.message_id
        group by ml.message_id;
      `);
    } catch (error) {
      log.error({ error }, "Failed to load reactions for channel messages");
      return result;
    }

    if (!reactionRows) {
      return result;
    }

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

  /**
   * Get all messages in a channel, with reactions and attachments.
   * @param channel_id Channel ID
   * @param currentUserId Current user ID (for reactions)
   * @returns Array of message objects with reactions and attachments
   */
  async getChannelMessages(channel_id: number, currentUserId: string) {
    const messagesList = await db
      .select({
        messageId: messages.messageId,
        channelId: messages.channelId,
        senderId: messages.senderId,
        message: messages.message,
        createdAt: messages.createdAt,
        authorName: users.name,
        authorRank: users.rank,
        authorDepartment: users.department,
        authorBranch: users.branch,
      })
      .from(messages)
      .leftJoin(users, eq(messages.senderId, users.id))
      .where(eq(messages.channelId, channel_id))
      .orderBy(desc(messages.createdAt));

    const reactionMap = await this.getReactionsForMessages(
      messagesList.map((message) => message.messageId),
      currentUserId,
    );

    const attachmentMap = await this.getAttachmentsForMessages(
      db,
      messagesList.map((message) => message.messageId),
    );

    return messagesList.map((message) => ({
      ...message,
      reactions: reactionMap.get(message.messageId) ?? [],
      attachments: attachmentMap.get(message.messageId) ?? [],
    }));
  }

  /**
   * Set or remove a reaction for a message by a user.
   * @param messageId Message ID
   * @param userId User ID
   * @param emoji Emoji string
   * @param active True to add, false to remove
   * @returns Array of reactions for the message
   */
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

  /**
   * Batch update channel settings using a list of update functions.
   * @param listOfUpdates Array of update functions (transaction)
   * @returns True if successful, false on error
   */
  async updateChannelSettings(
    listOfUpdates: ((tx: Transaction) => Promise<unknown>)[],
  ): Promise<boolean> {
    try {
      await db.transaction(async (tx) => {
        for (const update of listOfUpdates) {
          await update(tx);
        }
      });
      return true;
    } catch (err) {
      log.error(err, "Error updating channel settings");
      return false;
    }
  }

  /**
   * Delete a channel by its ID. Throws if not found.
   * @param channelId Channel ID
   * @returns Deleted channel object
   * @throws NotFoundError if channel not found
   */
  async deleteChannel(channelId: number) {
    const [deleted] = await db
      .delete(channels)
      .where(eq(channels.channelId, channelId))
      .returning();

    if (!deleted) {
      throw new NotFoundError("Channel not found");
    }

    return deleted;
  }

  /**
   * Remove a user from a channel (roles and subscription).
   * @param userId User ID
   * @param channelId Channel ID
   * @returns Success object
   */
  async removeUserFromChannel(userId: string, channelId: number) {
    return await db.transaction(async (tx) => {
      // Get user's roles in this channel
      const userChannelRoles = await tx
        .select({ roleId: roles.roleId })
        .from(roles)
        .innerJoin(userRoles, eq(userRoles.roleId, roles.roleId))
        .where(
          and(
            eq(roles.channelId, channelId),
            eq(roles.namespace, "channel"),
            eq(userRoles.userId, userId),
          ),
        );

      // Remove all role assignments for this user in this channel
      if (userChannelRoles.length > 0) {
        const roleIds = userChannelRoles.map((r) => r.roleId);
        await tx
          .delete(userRoles)
          .where(
            and(
              eq(userRoles.userId, userId),
              inArray(userRoles.roleId, roleIds),
            ),
          );
      }

      // Remove subscription
      await tx
        .delete(channelSubscriptions)
        .where(
          and(
            eq(channelSubscriptions.userId, userId),
            eq(channelSubscriptions.channelId, channelId),
          ),
        );

      return { success: true };
    });
  }

  /*async getChannelSettings(channelId: number) {
    const [channel] = await db
      .select({
        channelId: channels.channelId,
        name: channels.name,
        description: channels.description,
        metadata: channels.metadata,
      })
      .from(channels)
      .where(eq(channels.channelId, channelId))
      .limit(1);
      
    if (!channel) {
      throw new NotFoundError("Channel not found");
    }
    return channel;
  }*/
}
