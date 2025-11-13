import { eq } from "drizzle-orm";
import { channels } from "../data/db/schema.js";
import type {
  CommsRepository,
  Transaction,
} from "../data/repository/comms-repo.js";
import type { ChannelUpdateMetadata } from "../types/comms-types.js";
import {
  BadRequestError,
  ForbiddenError,
  InternalServerError,
} from "../types/errors.js";
import log from "../utils/logger.js";
import { policyEngine } from "./policy-engine.js";

export class CommsService {
  private commsRepo: CommsRepository;

  constructor(commsRepo: CommsRepository) {
    this.commsRepo = commsRepo;
  }

  async getChannelById(channel_id: number) {
    if (channel_id !== Math.trunc(channel_id)) {
      throw new BadRequestError("Cannot have decimal points in Channel ID");
    }

    return this.commsRepo.getChannelById(channel_id);
  }

  async getChannelMembers(channel_id: number) {
    if (channel_id !== Math.trunc(channel_id)) {
      throw new BadRequestError("Cannot have decimal points in Channel ID");
    }

    return this.commsRepo.getChannelMembers(channel_id);
  }

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
        `channel:${channel_id}:admin`,
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

  async getChannelSettings(channel_id: number) {
    return this.commsRepo.getChannelDataByID(channel_id);
  }

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

  async deleteChannel(user_id: string, channel_id: number) {
    if (channel_id !== Math.trunc(channel_id)) {
      throw new BadRequestError("Cannot have decimal points in Channel ID");
    }
    const isAdmin = await policyEngine.validate(
      user_id,
      `channel:${channel_id}:admin`,
    );
    if (!isAdmin) {
      throw new ForbiddenError(
        "Only channel administrators can delete this channel",
      );
    }
    await this.getChannelById(channel_id);
    return this.commsRepo.deleteChannel(channel_id);
  }

  async leaveChannel(user_id: string, channel_id: number) {
    if (channel_id !== Math.trunc(channel_id)) {
      throw new BadRequestError("Cannot have decimal points in Channel ID");
    }
    await this.getChannelById(channel_id);
    const isAdmin = await policyEngine.validate(
      user_id,
      `channel:${channel_id}:admin`,
    );

    if (isAdmin) {
      throw new ForbiddenError(
        "Channel administrators cannot leave the channel. Please delete the channel or transfer admin rights first.",
      );
    }
    return this.commsRepo.removeUserFromChannel(user_id, channel_id);
  }

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
      `channel:${channel_id}:admin`,
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

    // Check if user already has a role in this channel
    const hasRole = await policyEngine.validate(
      user_id,
      `channel:${channel_id}:read`,
    );

    if (hasRole) {
      throw new BadRequestError("You are already a member of this channel");
    }

    // Create read role and assign it to the user
    const roleKey = `channel:${channel_id}:read`;
    await policyEngine.createRoleAndAssign(
      user_id,
      user_id,
      roleKey,
      "read",
      "channel",
      channel_id,
    );

    if (channelData?.postPermissionLevel === "everyone") {
      await policyEngine.createRoleAndAssign(
        user_id,
        user_id,
        `channel:${channel_id}:post`,
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
