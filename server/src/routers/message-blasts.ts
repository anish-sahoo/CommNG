import z from "zod";
import { MessageBlastRepository } from "../data/repository/message-blast-repo.js";
import { UserRepository } from "../data/repository/user-repo.js";
import { broadcastRole } from "../data/roles.js";
import { MessageBlastService } from "../service/message-blast-service.js";
import { withErrorHandling } from "../trpc/error_handler.js";
import { ensureHasRole, protectedProcedure, router } from "../trpc/trpc.js";
import {
  createMessageBlastInputSchema,
  deleteMessageBlastInputSchema,
  getMessageBlastOutputSchema,
} from "../types/message-blast-types.js";

const messageBlastRepository = new MessageBlastRepository();
const userRepository = new UserRepository();
const messageBlastService = new MessageBlastService(
  messageBlastRepository,
  userRepository,
);

const createAndSendMessageBlast = protectedProcedure
  .input(createMessageBlastInputSchema)
  .output(z.void())
  .meta({
    openapi: {
      method: "POST",
      path: "/messageBlasts.createAndSendMessageBlast",
      summary: "Create and send a broadcast",
      tags: ["Broadcasts"],
    },
  })
  .mutation(({ ctx, input }) =>
    withErrorHandling("sendMessageBlast", async () => {
      ensureHasRole(ctx, [broadcastRole("create")]);

      await messageBlastService.createMessageBlast(input, ctx.auth.user.id);
    }),
  );

const getActiveMessageBlastsForUser = protectedProcedure
  .output(z.array(getMessageBlastOutputSchema))
  .meta({
    openapi: {
      method: "POST",
      path: "/messageBlasts.getActiveMessageBlastsForUser",
      summary: "Get all active broadcasts for a user",
      tags: ["Broadcasts"],
    },
  })
  .query(({ ctx }) =>
    withErrorHandling("getActiveMessageBlastsForUser", async () => {
      return await messageBlastService.getActiveBlastsForUser(ctx.auth.user.id);
    }),
  );

const deleteMessageBlast = protectedProcedure
  .input(deleteMessageBlastInputSchema)
  .output(z.void())
  .meta({
    openapi: {
      method: "POST",
      path: "/messageBlasts.deleteMessageBlast",
      summary: "Delete a broadcast",
      tags: ["Broadcasts"],
    },
  })
  .mutation(({ ctx, input }) =>
    withErrorHandling("deleteMessageBlast", async () => {
      ensureHasRole(ctx, [broadcastRole("create")]);

      await messageBlastService.deleteMessageBlast(input.blastId);
    }),
  );

const canManageBroadcasts = protectedProcedure
  .output(z.boolean())
  .meta({
    openapi: {
      method: "POST",
      path: "/messageBlasts.canManageBroadcasts",
      summary: "Check if the user can manage broadcasts",
      tags: ["Broadcasts"],
    },
  })
  .query(({ ctx }) =>
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
