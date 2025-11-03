import { MentorRepository } from "../data/repository/mentor-repo.js";
import { MatchingService } from "../service/matching-service.js";
import { procedure, protectedProcedure, router } from "../trpc/trpc.js";
import { createMentorInputSchema } from "../types/mentor-types.js";
import log from "../utils/logger.js";

const mentorRepo = new MentorRepository();
const matchingService = new MatchingService();

const createMentor = protectedProcedure
  .input(createMentorInputSchema)
  .mutation(async ({ input }) => {
    log.debug({ userId: input.userId }, "createMentor");

    const mentor = await mentorRepo.createMentor(
      input.userId,
      input.mentorshipPreferences,
      input.rank,
      input.yearsOfService,
      input.eligibilityData,
      input.status,
    );

    // Trigger matching process
    try {
      await matchingService.triggerMatchingForNewMentor(input.userId);
      log.info(
        { mentorId: mentor.mentorId },
        "Matching process triggered successfully for new mentor",
      );
    } catch (error) {
      log.error(
        {
          mentorId: mentor.mentorId,
          error: error instanceof Error ? error.message : String(error),
        },
        "Failed to trigger matching process for new mentor",
      );
    }

    return mentor;
  });

const getMentors = procedure.query(() => {
  log.debug("getMentors");
  return ["Alice", "Bob"];
});

export const mentorRouter = router({
  createMentor,
  getMentors,
});
