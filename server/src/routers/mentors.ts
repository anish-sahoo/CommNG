import { MenteeRepository } from "../data/repository/mentee-repo.js";
import { MentorRepository } from "../data/repository/mentor-repo.js";
import { MentorshipService } from "../service/mentorship-service.js";
import { withErrorHandling } from "../trpc/error_handler.js";
import { procedure, protectedProcedure, router } from "../trpc/trpc.js";
import log from "../utils/logger.js";

const mentorRepo = new MentorRepository();
const menteeRepo = new MenteeRepository();
const mentorshipService = new MentorshipService(mentorRepo, menteeRepo);

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
  getMentors,
  getMentorshipData,
});
