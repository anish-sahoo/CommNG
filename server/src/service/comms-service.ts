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
    attachment_url?: string,
  ) {
    // TODO: sanitize string inputs for security/profanity

    if (channel_id !== Math.trunc(channel_id)) {
      throw new BadRequestError("Cannot have decimal points in Channel ID");
    }

    return this.commsRepo.createMessage(
      user_id,
      channel_id,
      content,
      attachment_url,
    );
  }

  async editMessage(
    user_id: string,
    channel_id: number,
    message_id: number,
    content: string,
    attachment_url?: string,
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
      attachment_url,
    );
  }

  async deleteMessage(user_id: string, channel_id: number, message_id: number) {
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

    return this.commsRepo.deleteMessage(message_id, channel_id);
  }

  async updateChannelSettings(channel_id: number, metadata: ChannelUpdateMetadata) {
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
    throw new InternalServerError("Something went wrong updating channel settings");
  }
}
