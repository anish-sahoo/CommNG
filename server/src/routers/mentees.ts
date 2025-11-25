import { MenteeRepository } from "../data/repository/mentee-repo.js";
import { MatchingService } from "../service/matching-service.js";
import { protectedProcedure, router } from "../trpc/trpc.js";
import { createMenteeInputSchema } from "../types/mentee-types.js";
import log from "../utils/logger.js";

const menteeRepo = new MenteeRepository();
const matchingService = new MatchingService();

const createMentee = protectedProcedure
  .input(createMenteeInputSchema)
  .mutation(async ({ input }) => {
    log.debug({ userId: input.userId }, "createMentee");

    const mentee = await menteeRepo.createMentee(
      input.userId,
      input.learningGoals,
      input.experienceLevel,
      input.preferredMentorType,
      input.status,
    );

    // Trigger matching process
    try {
      await matchingService.triggerMatchingForNewMentee(input.userId);
      log.info(
        { menteeId: mentee.menteeId },
        "Matching process triggered successfully for new mentee",
      );
    } catch (error) {
      log.error(
        {
          menteeId: mentee.menteeId,
          error: error instanceof Error ? error.message : String(error),
        },
        "Failed to trigger matching process for new mentee",
      );
    }

    return mentee;
  });

export const menteeRouter = router({
  createMentee,
});
