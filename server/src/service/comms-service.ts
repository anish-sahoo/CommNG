import { eq } from "drizzle-orm";
import { channels } from "../data/db/schema.js";
import type {
  CommsRepository,
  Transaction,
} from "../data/repository/comms-repo.js";
import { channelRole } from "../data/roles.js";
import type { ChannelUpdateMetadata } from "../types/comms-types.js";
import {
  BadRequestError,
  ForbiddenError,
  InternalServerError,
} from "../types/errors.js";
import log from "../utils/logger.js";
import { policyEngine } from "./policy-engine.js";

/**
 * Service for communication-related business logic (channels, messages, subscriptions)
 */
export class CommsService {
  private commsRepo: CommsRepository;

  constructor(commsRepo: CommsRepository) {
    this.commsRepo = commsRepo;
  }

  /**
   * Get channel by ID
   * @param channel_id Channel ID
   * @returns Channel object
   * @throws BadRequestError if channel_id has decimal points
   */
  async getChannelById(channel_id: number) {
    if (channel_id !== Math.trunc(channel_id)) {
      throw new BadRequestError("Cannot have decimal points in Channel ID");
    }

    return this.commsRepo.getChannelById(channel_id);
  }

  /**
   * Get all members of a channel
   * @param channel_id Channel ID
   * @returns Array of channel members
   * @throws BadRequestError if channel_id has decimal points
   */
  async getChannelMembers(channel_id: number) {
    if (channel_id !== Math.trunc(channel_id)) {
      throw new BadRequestError("Cannot have decimal points in Channel ID");
    }

    return this.commsRepo.getChannelMembers(channel_id);
  }

  /**
   * Create a new message in a channel
   * @param user_id Sender user ID
   * @param channel_id Channel ID
   * @param content Message content
   * @param attachment_file_ids Optional array of file IDs for attachments
   * @returns Created message object
   * @throws BadRequestError if channel_id has decimal points
   */
  async createMessage(
    user_id: string,
    channel_id: number,
    content: string,
    attachment_file_ids?: string[],
  ) {
    // TODO: sanitize string inputs for security/profanity

    if (channel_id !== Math.trunc(channel_id)) {
      throw new BadRequestError("Cannot have decimal points in Channel ID");
    }

    return this.commsRepo.createMessage(
      user_id,
      channel_id,
      content,
      attachment_file_ids,
    );
  }

  /**
   * Edit an existing message
   * @param user_id User ID (must be the message author)
   * @param channel_id Channel ID
   * @param message_id Message ID
   * @param content New message content
   * @param attachment_file_ids Optional array of file IDs for attachments
   * @returns Updated message object
   * @throws BadRequestError if IDs have decimal points or message doesn't belong to channel
   * @throws ForbiddenError if user is not the message author
   */
  async editMessage(
    user_id: string,
    channel_id: number,
    message_id: number,
    content: string,
    attachment_file_ids?: string[],
  ) {
    if (channel_id !== Math.trunc(channel_id)) {
      throw new BadRequestError("Cannot have decimal points in Channel ID");
    }

    if (message_id !== Math.trunc(message_id)) {
      throw new BadRequestError("Cannot have decimal points in Message ID");
    }

    const existingMessage = await this.commsRepo.getMessageById(message_id);

    if (existingMessage.channelId !== channel_id) {
      throw new BadRequestError(
        "Message does not belong to the specified channel",
      );
    }

    if (existingMessage.senderId !== user_id) {
      throw new ForbiddenError(
        "Only the original poster can edit this message",
      );
    }

    return this.commsRepo.updateMessage(
      message_id,
      channel_id,
      content,
      attachment_file_ids,
    );
  }

  /**
   * Delete a message (author or channel admin only)
   * @param user_id User ID (message author or channel admin)
   * @param channel_id Channel ID
   * @param message_id Message ID
   * @param fileService Optional file service to delete attachments
   * @returns Deleted message object
   * @throws BadRequestError if IDs have decimal points or message doesn't belong to channel
   * @throws ForbiddenError if user is not author or admin
   */
  async deleteMessage(
    user_id: string,
    channel_id: number,
    message_id: number,
    fileService?: { deleteFile: (fileId: string) => Promise<void> },
  ) {
    if (channel_id !== Math.trunc(channel_id)) {
      throw new BadRequestError("Cannot have decimal points in Channel ID");
    }

    if (message_id !== Math.trunc(message_id)) {
      throw new BadRequestError("Cannot have decimal points in Message ID");
    }

    const existingMessage = await this.commsRepo.getMessageById(message_id);

    if (existingMessage.channelId !== channel_id) {
      throw new BadRequestError(
        "Message does not belong to the specified channel",
      );
    }

    if (existingMessage.senderId !== user_id) {
      const isAdmin = await policyEngine.validate(
        user_id,
        channelRole("admin", channel_id),
      );

      if (!isAdmin) {
        throw new ForbiddenError(
          "Only the original poster or a channel admin can delete this message",
        );
      }
    }

    const result = await this.commsRepo.deleteMessage(message_id, channel_id);

    // Delete associated files from storage and database
    if (fileService && result.attachmentFileIds) {
      for (const fileId of result.attachmentFileIds) {
        try {
          await fileService.deleteFile(fileId);
        } catch (error) {
          log.error(
            { fileId, error },
            "Failed to delete file associated with message",
          );
          // Continue with other deletions even if one fails
        }
      }
    }

    return result;
  }

  /**
   * Get channel settings by ID
   * @param channel_id Channel ID
   * @returns Channel settings object
   */
  async getChannelSettings(channel_id: number) {
    return this.commsRepo.getChannelDataByID(channel_id);
  }

  /**
   * Update channel settings (name, posting permissions, description)
   * @param channel_id Channel ID
   * @param metadata Channel update metadata
   * @returns Updated channel settings
   * @throws InternalServerError if update fails
   */
  async updateChannelSettings(
    channel_id: number,
    metadata: ChannelUpdateMetadata,
  ) {
    await this.getChannelById(channel_id);
    const updates: ((tx: Transaction) => Promise<unknown>)[] = [];

    if (metadata.name) {
      updates.push((tx: Transaction) =>
        tx
          .update(channels)
          .set({ name: metadata.name })
          .where(eq(channels.channelId, channel_id)),
      );
    }

    if (metadata.postingPermissions) {
      updates.push((tx) =>
        tx
          .update(channels)
          .set({ postPermissionLevel: metadata.postingPermissions })
          .where(eq(channels.channelId, channel_id)),
      );
    }

    if (metadata.description) {
      updates.push((tx) =>
        tx
          .update(channels)
          .set({ description: metadata.description })
          .where(eq(channels.channelId, channel_id)),
      );
    }
    const result = await this.commsRepo.updateChannelSettings(updates);
    if (result) {
      return this.commsRepo.getChannelDataByID(channel_id);
    }
    throw new InternalServerError(
      "Something went wrong updating channel settings",
    );
  }

  /**
   * Delete a channel (admin only)
   * @param user_id User ID (must be channel admin)
   * @param channel_id Channel ID
   * @returns Deleted channel object
   * @throws BadRequestError if channel_id has decimal points
   * @throws ForbiddenError if user is not channel admin
   */
  async deleteChannel(user_id: string, channel_id: number) {
    if (channel_id !== Math.trunc(channel_id)) {
      throw new BadRequestError("Cannot have decimal points in Channel ID");
    }
    const isAdmin = await policyEngine.validate(
      user_id,
      channelRole("admin", channel_id),
    );
    if (!isAdmin) {
      throw new ForbiddenError(
        "Only channel administrators can delete this channel",
      );
    }
    await this.getChannelById(channel_id);
    return this.commsRepo.deleteChannel(channel_id);
  }

  /**
   * Leave a channel (removes roles and subscription, admin cannot leave)
   * @param user_id User ID
   * @param channel_id Channel ID
   * @returns Success object
   * @throws BadRequestError if channel_id has decimal points
   * @throws ForbiddenError if user is channel admin
   */
  async leaveChannel(user_id: string, channel_id: number) {
    if (channel_id !== Math.trunc(channel_id)) {
      throw new BadRequestError("Cannot have decimal points in Channel ID");
    }
    await this.getChannelById(channel_id);
    const isAdmin = await policyEngine.validate(
      user_id,
      channelRole("admin", channel_id),
    );

    if (isAdmin) {
      throw new ForbiddenError(
        "Channel administrators cannot leave the channel. Please delete the channel or transfer admin rights first.",
      );
    }
    return this.commsRepo.removeUserFromChannel(user_id, channel_id);
  }

  /**
   * Remove a user from a channel (admin only)
   * @param user_id User ID of the requester (must be channel admin)
   * @param channel_id Channel ID
   * @param target_user_id User ID of the user to remove
   * @returns Success object
   * @throws BadRequestError if channel_id has decimal points or user tries to remove themselves
   * @throws ForbiddenError if requester is not channel admin
   */
  async removeUserFromChannel(
    user_id: string,
    channel_id: number,
    target_user_id: string,
  ) {
    if (channel_id !== Math.trunc(channel_id)) {
      throw new BadRequestError("Cannot have decimal points in Channel ID");
    }
    await this.getChannelById(channel_id);

    // Verify the requester is admin
    const isAdmin = await policyEngine.validate(
      user_id,
      channelRole("admin", channel_id),
    );
    if (!isAdmin) {
      throw new ForbiddenError(
        "Only channel administrators can remove members",
      );
    }

    // Don't allow removing yourself
    if (user_id === target_user_id) {
      throw new BadRequestError("Cannot remove yourself from the channel");
    }

    return this.commsRepo.removeUserFromChannel(target_user_id, channel_id);
  }

  /**
   * Join a public channel (creates read role and auto-subscribes)
   * @param user_id User ID
   * @param channel_id Channel ID
   * @returns Success object with channel ID
   * @throws BadRequestError if channel_id has decimal points or user already member
   * @throws ForbiddenError if channel is not public
   */
  async joinChannel(user_id: string, channel_id: number) {
    if (channel_id !== Math.trunc(channel_id)) {
      throw new BadRequestError("Cannot have decimal points in Channel ID");
    }

    // Check if channel exists
    await this.getChannelById(channel_id);

    // Get channel data to check if it's public
    const channelData = await this.commsRepo.getChannelDataByID(channel_id);

    // Check if channel is public (default is public if not specified)
    const channelType =
      channelData?.metadata &&
      typeof channelData.metadata === "object" &&
      "type" in channelData.metadata
        ? channelData.metadata.type
        : "public";

    if (channelType !== "public") {
      throw new ForbiddenError("Cannot join a private channel");
    }

    const roleKey = channelRole("read", channel_id);

    // Check if user already has a role in this channel
    const hasRole = await policyEngine.validate(user_id, roleKey);

    if (hasRole) {
      throw new BadRequestError("You are already a member of this channel");
    }

    // Create read role and assign it to the user
    await policyEngine.createAndAssignChannelRole(
      user_id,
      user_id,
      roleKey,
      "read",
      "channel",
      channel_id,
    );

    if (channelData?.postPermissionLevel === "everyone") {
      const postRoleKey = channelRole("post", channel_id);
      await policyEngine.createAndAssignChannelRole(
        user_id,
        user_id,
        postRoleKey,
        "post",
        "channel",
        channel_id,
      );
    }

    // Auto-subscribe the user with notifications enabled
    await this.commsRepo.ensureChannelSubscription(user_id, channel_id);

    return { success: true, channelId: channel_id };
  }
}
