import { MenteeRepository } from "../data/repository/mentee-repo.js";
import { MatchingService } from "../service/matching-service.js";
import { procedure, router } from "../trpc/trpc.js";
import { createMenteeInputSchema } from "../types/mentee-types.js";
import log from "../utils/logger.js";

const menteeRepo = new MenteeRepository();
const matchingService = new MatchingService();

const createMentee = procedure
  .input(createMenteeInputSchema)
  .mutation(async ({ input }) => {
    log.debug("createMentee", { userId: input.userId });

    const mentee = await menteeRepo.createMentee(
      input.userId.toString(), // Convert number to string to match schema
      input.learningGoals,
      input.experienceLevel,
      input.preferredMentorType,
      input.status,
    );

    // Trigger matching process
    try {
      await matchingService.triggerMatchingForNewMentee(
        input.userId.toString(),
      );
      log.info("Matching process triggered successfully for new mentee", {
        menteeId: mentee.menteeId,
      });
    } catch (error) {
      log.error("Failed to trigger matching process for new mentee", {
        menteeId: mentee.menteeId,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    return mentee;
  });

export const menteeRouter = router({
  createMentee,
});
