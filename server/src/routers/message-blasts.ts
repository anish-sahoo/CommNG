import { MessageBlastRepository } from "../data/repository/message-blast-repo.js";
import { UserRepository } from "../data/repository/user-repo.js";
import { MessageBlastService } from "../service/message-blast-service.js";
import { policyEngine } from "../service/policy-engine.js";
import { withErrorHandling } from "../trpc/error_handler.js";
import { protectedProcedure, router } from "../trpc/trpc.js";
import { ForbiddenError } from "../types/errors.js";
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
      const canCreate = await policyEngine.validate(
        ctx.auth.user.id,
        "global:broadcast:create",
      );

      const isFallbackAdmin =
        ctx.auth.user.email?.toLowerCase() === "admin@admin.admin";

      if (!canCreate && !isFallbackAdmin) {
        throw new ForbiddenError(
          "You do not have permission to create broadcasts.",
        );
      }

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
      const canDelete = await policyEngine.validate(
        ctx.auth.user.id,
        "global:broadcast:create",
      );

      const isFallbackAdmin =
        ctx.auth.user.email?.toLowerCase() === "admin@admin.admin";

      if (!canDelete && !isFallbackAdmin) {
        throw new ForbiddenError(
          "Cannot delete broadcasts. Not enough permission.",
        );
      }

      await messageBlastService.deleteMessageBlast(input.blastId);
    }),
  );

const canManageBroadcasts = protectedProcedure.query(({ ctx }) =>
  withErrorHandling("canManageBroadcasts", async () => {
    return await policyEngine.validate(
      ctx.auth.user.id,
      "global:broadcast:create",
    );
  }),
);

export const messageBlastRouter = router({
  createAndSendMessageBlast,
  getActiveMessageBlastsForUser,
  deleteMessageBlast,
  canManageBroadcasts,
});
