import type { MessageBlastRepository } from "../data/repository/message-blast-repo.js";
import type { UserRepository } from "../data/repository/user-repo.js";
import { InternalServerError, UnauthorizedError } from "../types/errors.js";
import type { CreateMessageBlastInput } from "../types/message-blast-types.js";
import log from "../utils/logger.js";
import notificationService from "./notification-service.js";
import { policyEngine } from "./policy-engine.js";

export class MessageBlastService {
  private messageBlastRepository: MessageBlastRepository;
  private userRepository: UserRepository;

  constructor(
    messageBlastRepository: MessageBlastRepository,
    userRepository: UserRepository,
  ) {
    this.messageBlastRepository = messageBlastRepository;
    this.userRepository = userRepository;
  }

  async createMessageBlast(input: CreateMessageBlastInput, userId: string) {
    const permission = await policyEngine.validate(
      userId,
      `global:blast:create`,
    );
    if (!permission) {
      throw new UnauthorizedError(
        "Not enough permissions to send message blast",
      );
    }
    const result = await this.messageBlastRepository.createMessageBlast(
      input.senderId,
      input.title,
      input.content,
      input.targetAudience,
      input.validUntil,
    );
    if (!result) {
      throw new InternalServerError("Something went wrong");
    }
    notificationService
      .sendTargetedNotifications(input.targetAudience, {
        title: input.title,
        body: input.content,
      })
      .then(
        async () =>
          await this.messageBlastRepository.markAsSent(result.blastId),
      )
      .catch(async (err) => {
        log.error(
          { blastId: result.blastId, err },
          "Failed to send notifications for message blast",
        );
        await this.messageBlastRepository.markAsFailed(result.blastId);
      });
  }

  async getActiveBlastsForUser(userId: string) {
    const userData = await this.userRepository.getUserData(userId);
    if (!userData) {
      return [];
    }
    return await this.messageBlastRepository.getMessageBlastsForUser({
      branch: userData.branch ?? undefined,
      rank: userData.rank ?? undefined,
      department: userData.department ?? undefined,
    });
  }
}
