import { CommsRepository } from "../data/repository/comms-repo.js";
import { BadRequestError } from "../types/errors.js";

export class CommsService {
  private commsRepo: CommsRepository;

  constructor(commsRepo?: CommsRepository) {
    this.commsRepo = commsRepo ?? new CommsRepository();
  }

  async getChannelById(channel_id: number) {
    if (channel_id !== Math.trunc(channel_id)) {
      throw new BadRequestError("Cannot have decimal points in Channel ID");
    }

    return this.commsRepo.getChannelById(channel_id);
  }

  async createMessage(
    user_id: number,
    channel_id: number,
    content: string,
    attachment_url?: string,
  ) {
    // TODO: sanitize string inputs for security/profanity

    if (channel_id !== Math.trunc(channel_id)) {
      throw new BadRequestError("Cannot have decimal points in Channel ID");
    }

    if (user_id !== Math.trunc(user_id)) {
      throw new BadRequestError("Cannot have decimal points in User ID");
    }

    this.commsRepo.createMessage(user_id, channel_id, content, attachment_url);
  }
}
