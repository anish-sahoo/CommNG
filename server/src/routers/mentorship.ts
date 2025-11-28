import { MenteeRepository } from "../data/repository/mentee-repo.js";
import { MentorRepository } from "../data/repository/mentor-repo.js";
import { MatchingService } from "../service/matching-service.js";
import { MentorshipService } from "../service/mentorship-service.js";
import { withErrorHandling } from "../trpc/error_handler.js";
import { protectedProcedure, router } from "../trpc/trpc.js";
import { createMenteeInputSchema } from "../types/mentee-types.js";
import { createMentorInputSchema } from "../types/mentor-types.js";
import log from "../utils/logger.js";
import { z } from "zod";

const mentorRepo = new MentorRepository();
const menteeRepo = new MenteeRepository();
const mentorshipService = new MentorshipService(
  mentorRepo,
  menteeRepo,
  new MatchingService(),
);

const createMentor = protectedProcedure
  .input(createMentorInputSchema)
  .mutation(({ input }) =>
    withErrorHandling("", async () => {
      log.debug({ userId: input.userId }, "createMentor");
      return await mentorshipService.createMentor(input);
    }),
  );

const createMentee = protectedProcedure
  .input(createMenteeInputSchema)
  .mutation(({ input }) =>
    withErrorHandling("createMentee", async () => {
      return await mentorshipService.createMentee(input);
    }),
  );

const requestMentorship = protectedProcedure
  .input(z.object({ 
    mentorUserId: z.string(),
    message: z.string().optional()
  }))
  .mutation(({ input, ctx }) =>
    withErrorHandling("requestMentorship", async () => {
      return await mentorshipService.requestMentorship(ctx.auth.user.id, input.mentorUserId, input.message);
    }),
  );

const declineMentorshipRequest = protectedProcedure
  .input(z.object({ matchId: z.number() }))
  .mutation(({ input, ctx }) =>
    withErrorHandling("declineMentorshipRequest", async () => {
      return await mentorshipService.declineMentorshipRequest(input.matchId, ctx.auth.user.id);
    }),
  );

const getMentorshipData = protectedProcedure
  .meta({
    description:
      "Get mentor/mentee data and communication information for mentorship homepage",
  })
  .query(async ({ ctx }) =>
    withErrorHandling("getMentorshipData", async () => {
      const userId = ctx.auth.user.id;
      log.debug({ userId }, "getMentorshipData");
      return await mentorshipService.getMentorshipData(userId);
    }),
  );

export const mentorshipRouter = router({
  createMentor,
  createMentee,
  requestMentorship,
  declineMentorshipRequest,
  getMentorshipData,
});