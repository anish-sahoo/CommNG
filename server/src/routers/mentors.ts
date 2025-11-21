import { MenteeRepository } from "@/data/repository/mentee-repo.js";
import { MentorRepository } from "@/data/repository/mentor-repo.js";
import { MatchingService } from "@/service/matching-service.js";
import { MentorshipService } from "@/service/mentorship-service.js";
import { withErrorHandling } from "@/trpc/error_handler.js";
import { procedure, protectedProcedure, router } from "@/trpc/trpc.js";
import { createMentorInputSchema } from "@/types/mentor-types.js";
import log from "@/utils/logger.js";

const mentorRepo = new MentorRepository();
const menteeRepo = new MenteeRepository();
const matchingService = new MatchingService();
const mentorshipService = new MentorshipService(mentorRepo, menteeRepo);

const createMentor = protectedProcedure
  .input(createMentorInputSchema)
  .mutation(async ({ input }) => {
    log.debug({ userId: input.userId }, "createMentor");

    const mentor = await mentorRepo.createMentor(
      input.userId,
      input.mentorshipPreferences,
      input.rank,
      input.yearsOfService,
      input.eligibilityData ?? undefined,
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

const getMentorshipData = protectedProcedure
  .meta({
    description:
      "Get mentor/mentee data and communication information for mentorship homepage",
  })
  .query(async ({ ctx }) => {
    return withErrorHandling("getMentorshipData", async () => {
      const userId = ctx.auth.user.id;
      log.debug({ userId }, "getMentorshipData");
      return await mentorshipService.getMentorshipData(userId);
    });
  });

export const mentorRouter = router({
  createMentor,
  getMentors,
  getMentorshipData,
});
