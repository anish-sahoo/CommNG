import { CommsRepository } from "../data/repository/comms-repo.js";
import { CommsService } from "../service/comms-service.js";
import { policyEngine } from "../service/policy-engine.js";
import { withErrorHandling } from "../trpc/error_handler.js";
import { protectedProcedure, router } from "../trpc/trpc.js";
import {
  createChannelSchema,
  createSubscriptionSchema,
  deletePostSchema,
  deleteSubscriptionSchema,
  editPostSchema,
  getChannelMembersSchema,
  postPostSchema,
  registerDeviceSchema,
} from "../types/comms-types.js";
import { ForbiddenError } from "../types/errors.js";
import log from "../utils/logger.js";

const commsRepo = new CommsRepository();
const commsService = new CommsService(commsRepo);

const registerDevice = protectedProcedure
  .input(registerDeviceSchema)
  .mutation(({ ctx, input }) =>
    withErrorHandling("registerDevice", async () => {
      log.debug({ deviceType: input.deviceType }, "registerDevice");

      return await commsRepo.registerDevice(
        ctx.auth.user.id, // TODO: get from auth context
        input.deviceType,
        input.deviceToken,
      );
    }),
  );

/**
 * createPost
 * Allows an authenticated user to post a message in a channel if they have write permissions.
 */
const createPost = protectedProcedure
  .input(postPostSchema)
  .mutation(async ({ ctx, input }) => {
    const userId = ctx.auth.user.id;

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

/**
 * getAllChannels
 * Retrieves a list of all channels. (no matter if public or private?)
 */
const getAllChannels = protectedProcedure.query(({ ctx }) =>
  withErrorHandling("getAllChannels", async () => {
    log.debug("Getting all channels");

    return await commsRepo.getAllChannels();
  }),
);

/**
 * editPost
 * Allows an authenticated user to edit a previously posted message if they authored it.
 */
const editPost = protectedProcedure
  .input(editPostSchema)
  .mutation(async ({ ctx, input }) => {
    const userId = ctx.auth.user.id;

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

/**
 * deletePost
 * Allows an authenticated user to delete a previously posted message if they authored it or if they are an admin.
 */
const deletePost = protectedProcedure
  .input(deletePostSchema)
  .mutation(async ({ ctx, input }) => {
    const userId = ctx.auth.user.id;

    const deletedPost = await commsService.deleteMessage(
      userId,
      input.channelId,
      input.messageId,
    );

    return deletedPost;
  });

// Channel creation endpoint
const createChannel = protectedProcedure
  .input(createChannelSchema)
  .mutation(({ ctx, input }) =>
    withErrorHandling("createChannel", async () => {
      const userId = ctx.auth.user.id;

      log.debug({ userId, channelName: input.name }, "Creating channel");

      return await commsRepo.createChannel(input.name, input.metadata);
    }),
  );

// Channel members endpoint
const getChannelMembers = protectedProcedure
  .input(getChannelMembersSchema)
  .query(({ input }) => async () => {
    log.debug("getChannelMembers");
    return await commsRepo.getChannelMembers(input.channelId);
  });

// Channel subscription endpoints
const createSubscription = protectedProcedure
  .input(createSubscriptionSchema)
  .mutation(({ ctx, input }) =>
    withErrorHandling("createSubscription", async () => {
      const userId = ctx.auth.user.id;

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

const deleteSubscription = protectedProcedure
  .input(deleteSubscriptionSchema)
  .mutation(({ ctx, input }) =>
    withErrorHandling("deleteSubscription", async () => {
      const userId = ctx.auth.user.id;

      log.debug(
        { userId, subscriptionId: input.subscriptionId },
        "Deleting subscription",
      );

      return await commsRepo.deleteSubscription(input.subscriptionId, userId);
    }),
  );

const getUserSubscriptions = protectedProcedure.query(({ ctx }) =>
  withErrorHandling("getUserSubscriptions", async () => {
    const userId = ctx.auth.user.id;

    log.debug({ userId }, "Getting user subscriptions");

    return await commsRepo.getUserSubscriptions(userId);
  }),
);

export const commsRouter = router({
  registerDevice,
  createPost,
  editPost,
  deletePost,
  createChannel,
  getChannelMembers,
  createSubscription,
  deleteSubscription,
  getUserSubscriptions,
});
