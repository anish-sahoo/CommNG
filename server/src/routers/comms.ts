import { CommsRepository } from "../data/repository/comms-repo.js";
import { CommsService } from "../service/comms-service.js";
import { policyEngine } from "../service/policy-engine.js";
import { withErrorHandling } from "../trpc/error_handler.js";
import { procedure, router } from "../trpc/trpc.js";
import {
  createChannelSchema,
  postPostSchema,
  registerDeviceSchema,
} from "../types/comms-types.js";
import { ForbiddenError, UnauthorizedError } from "../types/errors.js";
import log from "../utils/logger.js";

const commsService = new CommsService();
const commsRepo = new CommsRepository();

const ping = procedure.query(() => {
  log.debug("ping");
  return "pong from comms";
});

const registerDevice = procedure
  .input(registerDeviceSchema)
  .mutation(({ input }) =>
    withErrorHandling("registerDevice", async () => {
      log.debug({ deviceType: input.deviceType }, "registerDevice");

      return await commsRepo.registerDevice(
        1, // TODO: get from auth context
        input.deviceType,
        input.deviceToken,
      );
    }),
  );

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

// Channel creation endpoint
const createChannel = procedure
  .input(createChannelSchema)
  .mutation(({ ctx, input }) =>
    withErrorHandling("createChannel", async () => {
      const userId = ctx.userId ?? ctx.user?.userId ?? null;
      if (!userId) {
        throw new UnauthorizedError("Sign in required");
      }

      log.debug({ userId, channelName: input.name }, "Creating channel");

      return await commsRepo.createChannel(input.name, input.metadata);
    }),
  );

export const commsRouter = router({
  ping,
  registerDevice,
  createPost,
  createChannel,
});
