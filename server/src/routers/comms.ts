import { CommsService } from "../service/comms-service.js";
import { policyEngine } from "../service/policy-engine.js";
import { procedure, router } from "../trpc/trpc.js";
import { postPostSchema } from "../types/comms-types.js";
import { ForbiddenError, UnauthorizedError } from "../types/errors.js";
import log from "../utils/logger.js";

const commsService = new CommsService();

const ping = procedure.query(() => {
  log.debug("ping");
  return "pong from comms";
});

/**
 * createPost
 * Allows an authenticated user to post a message in a channel if they have write permissions.
 */
const createPost = procedure
  .input(postPostSchema)
  .mutation(async ({ ctx, input }) => {
    const userId = ctx.userId ?? ctx.user?.userId ?? null;
    if (!userId) {
      throw new UnauthorizedError("Sign in required");
    }

    await commsService.getChannelById(input.channelId);

    const canPost = await policyEngine.validate(
      userId,
      `channel:${input.channelId}:post`,
    );

    if (!canPost) {
      throw new ForbiddenError(
        "You do not have permission to post in this channel",
      );
    }

    const createdPost = commsService.createMessage(
      userId,
      input.channelId,
      input.content,
      input.attachmentUrl,
    );

    return createdPost;
  });

export const commsRouter = router({
  ping,
  createPost,
});
