import { CommsRepository } from "../data/repository/comms-repo.js";
import { CommsService } from "../service/comms-service.js";
import { policyEngine } from "../service/policy-engine.js";
import { withErrorHandling } from "../trpc/error_handler.js";
import { procedure, router } from "../trpc/trpc.js";
import {
  createChannelSchema,
  createSubscriptionSchema,
  deleteSubscriptionSchema,
  editPostSchema,
  getUserSubscriptionsSchema,
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

    const createdPost = await commsService.createMessage(
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

/**
 * editPost
 * Allows an authenticated user to edit a previously posted message if they authored it.
 */
const editPost = procedure
  .input(editPostSchema)
  .mutation(async ({ ctx, input }) => {
    const userId = ctx.userId ?? ctx.user?.userId ?? null;
    if (!userId) {
      throw new UnauthorizedError("Sign in required");
    }

    const canPost = await policyEngine.validate(
      userId,
      `channel:${input.channelId}:post`,
    );

    if (!canPost) {
      throw new ForbiddenError(
        "You do not have permission to edit posts in this channel",
      );
    }

    const updatedPost = await commsService.editMessage(
      userId,
      input.channelId,
      input.messageId,
      input.content,
      input.attachmentUrl,
    );

    return updatedPost;
  });
// Channel subscription endpoints
const createSubscription = procedure
  .input(createSubscriptionSchema)
  .mutation(({ ctx, input }) =>
    withErrorHandling("createSubscription", async () => {
      const userId = ctx.userId ?? ctx.user?.userId ?? null;
      if (!userId) {
        throw new UnauthorizedError("Sign in required");
      }

      log.debug(
        { userId, channelId: input.channelId },
        "Creating subscription",
      );

      return await commsRepo.createSubscription(
        userId,
        input.channelId,
        input.permission,
        input.notificationsEnabled,
      );
    }),
  );

const deleteSubscription = procedure
  .input(deleteSubscriptionSchema)
  .mutation(({ ctx, input }) =>
    withErrorHandling("deleteSubscription", async () => {
      const userId = ctx.userId ?? ctx.user?.userId ?? null;
      if (!userId) {
        throw new UnauthorizedError("Sign in required");
      }

      log.debug(
        { userId, subscriptionId: input.subscriptionId },
        "Deleting subscription",
      );

      return await commsRepo.deleteSubscription(input.subscriptionId, userId);
    }),
  );

const getUserSubscriptions = procedure
  .input(getUserSubscriptionsSchema)
  .query(({ ctx, input }) =>
    withErrorHandling("getUserSubscriptions", async () => {
      const userId = ctx.userId ?? ctx.user?.userId ?? input.userId ?? null;
      if (!userId) {
        throw new UnauthorizedError("Sign in required");
      }

      log.debug({ userId }, "Getting user subscriptions");

      return await commsRepo.getUserSubscriptions(userId);
    }),
  );

export const commsRouter = router({
  ping,
  registerDevice,
  createPost,
  createChannel,
  editPost,
  createSubscription,
  deleteSubscription,
  getUserSubscriptions,
});
