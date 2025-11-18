import type { MessageBlastRepository } from "@/data/repository/message-blast-repo.js";
import type { UserRepository } from "@/data/repository/user-repo.js";
import notificationService from "@/service/notification-service.js";
import type { CreateMessageBlastInput } from "@/types/message-blast-types.js";
import log from "@/utils/logger.js";

/**
 * Service for creating and managing message blasts (broadcast messages)
 */
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

  /**
   * Create a new message blast and send notifications to target audience
   * @param input Message blast input data
   * @param userId User ID of creator
   */
  async createMessageBlast(input: CreateMessageBlastInput, userId: string) {
    const result = await this.messageBlastRepository.createMessageBlast(
      userId,
      input.title,
      input.content,
      input.targetAudience,
      input.validUntil,
    );
    await this.messageBlastRepository.markAsSent(result.blastId);

    notificationService
      .sendTargetedNotifications(input.targetAudience || null, {
        title: input.title,
        body: input.content,
      })
      .catch(async (err) => {
        log.error(
          { blastId: result.blastId, err },
          "Failed to send notifications for broadcast",
        );
        await this.messageBlastRepository.markAsFailed(result.blastId);
      });
  }

  /**
   * Get all active message blasts for a user based on their profile
   * @param userId User ID
   * @returns Array of active message blasts
   */
  async getActiveBlastsForUser(userId: string) {
    const userData = await this.userRepository.getUserData(userId);
    if (!userData) {
      return [];
    }
    return await this.messageBlastRepository.getMessageBlastsForUser(
      {
        branch: userData.branch ?? undefined,
        rank: userData.rank ?? undefined,
        department: userData.department ?? undefined,
      },
      userId,
    );
  }

  /**
   * Delete a message blast by ID
   * @param blastId Blast ID
   */
  async deleteMessageBlast(blastId: number) {
    await this.messageBlastRepository.deleteMessageBlast(blastId);
  }
}
