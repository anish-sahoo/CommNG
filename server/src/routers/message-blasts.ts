import { MessageBlastRepository } from "../data/repository/message-blast-repo.js";
import { UserRepository } from "../data/repository/user-repo.js";
import { broadcastRole } from "../data/roles.js";
import { MessageBlastService } from "../service/message-blast-service.js";
import { withErrorHandling } from "../trpc/error_handler.js";
import { ensureHasRole, protectedProcedure, router } from "../trpc/trpc.js";
import {
  createMessageBlastInputSchema,
  deleteMessageBlastInputSchema,
} from "../types/message-blast-types.js";

const messageBlastRepository = new MessageBlastRepository();
const userRepository = new UserRepository();
const messageBlastService = new MessageBlastService(
  messageBlastRepository,
  userRepository,
);

const createAndSendMessageBlast = protectedProcedure
  .input(createMessageBlastInputSchema)
  .mutation(({ ctx, input }) =>
    withErrorHandling("sendMessageBlast", async () => {
      ensureHasRole(ctx, [broadcastRole("create")]);

      await messageBlastService.createMessageBlast(input, ctx.auth.user.id);
    }),
  );

const getActiveMessageBlastsForUser = protectedProcedure.query(({ ctx }) =>
  withErrorHandling("getActiveMessageBlastsForUser", async () => {
    return await messageBlastService.getActiveBlastsForUser(ctx.auth.user.id);
  }),
);

const deleteMessageBlast = protectedProcedure
  .input(deleteMessageBlastInputSchema)
  .mutation(({ ctx, input }) =>
    withErrorHandling("deleteMessageBlast", async () => {
      ensureHasRole(ctx, [broadcastRole("create")]);

      await messageBlastService.deleteMessageBlast(input.blastId);
    }),
  );

const canManageBroadcasts = protectedProcedure.query(({ ctx }) =>
  withErrorHandling("canManageBroadcasts", async () => {
    try {
      ensureHasRole(ctx, [broadcastRole("create")]);
      return true;
    } catch {
      return false;
    }
  }),
);

export const messageBlastRouter = router({
  createAndSendMessageBlast,
  getActiveMessageBlastsForUser,
  deleteMessageBlast,
  canManageBroadcasts,
});
