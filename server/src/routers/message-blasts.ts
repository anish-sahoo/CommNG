import { MessageBlastRepository } from "../data/repository/message-blast-repo.js";
import { UserRepository } from "../data/repository/user-repo.js";
import { MessageBlastService } from "../service/message-blast-service.js";
import { withErrorHandling } from "../trpc/error_handler.js";
import { protectedProcedure, router } from "../trpc/trpc.js";
import { createMessageBlastInputSchema } from "../types/message-blast-types.js";
import { requirePermission } from "../utils/access_control.js";

const messageBlastRepository = new MessageBlastRepository();
const userRepository = new UserRepository();
const messageBlastService = new MessageBlastService(
  messageBlastRepository,
  userRepository,
);

const createAndSendMessageBlast = protectedProcedure
  .input(createMessageBlastInputSchema)
  .use(
    requirePermission(
      `global:blast:create`,
      "Cannot create blasts. Not enough permission.",
    ),
  )
  .mutation(({ ctx, input }) =>
    withErrorHandling("sendMessageBlast", async () => {
      await messageBlastService.createMessageBlast(input, ctx.auth.user.id);
    }),
  );

const getActiveMessageBlastsForUser = protectedProcedure.query(({ ctx }) =>
  withErrorHandling("getActiveMessageBlastsForUser", async () => {
    return await messageBlastService.getActiveBlastsForUser(ctx.auth.user.id);
  }),
);

export const messageBlastRouter = router({
  createAndSendMessageBlast,
  getActiveMessageBlastsForUser,
});
