import { CommsRepository } from "../data/repository/comms-repo.js";
import { CommsService } from "../service/comms-service.js";
import { policyEngine } from "../service/policy-engine.js";
import { withErrorHandling } from "../trpc/error_handler.js";
import { protectedProcedure, router } from "../trpc/trpc.js";
import {
  createChannelSchema,
  createSubscriptionSchema,
  deleteChannelSchema,
  deletePostSchema,
  deleteSubscriptionSchema,
  editPostSchema,
  //getChannelMembersSchema,
  getChannelMessagesSchema,
  leaveChannelSchema,
  postPostSchema,
  toggleReactionSchema,
  updateChannelSchema,
} from "../types/comms-types.js";
import { ForbiddenError, InternalServerError, UnauthorizedError } from "../types/errors.js";
import log from "../utils/logger.js";
import { fileService } from "./files.js";

const commsRepo = new CommsRepository();
const commsService = new CommsService(commsRepo);

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
      input.attachmentFileIds,
    );

    return createdPost;
  });

/**
 * getAllChannels
 * Retrieves a list of all channels. (no matter if public or private?)
 */
const getAllChannels = protectedProcedure.query(({ ctx }) =>
  withErrorHandling("getAllChannels", async () => {
    const userId = ctx.auth.user.id;

    log.debug({ userId }, "Getting accessible channels");

    return await commsRepo.getAccessibleChannels(userId);
  }),
);

/**
 * getChannelMessages
 * Retrieves messages from a specific channel.
 */
const getChannelMessages = protectedProcedure
  .input(getChannelMessagesSchema)
  .query(async ({ ctx, input }) => {
    const userId = ctx.auth.user.id;

    const isInChannel = await policyEngine.validate(
      userId,
      `channel:${input.channelId}:read`,
    );

    if (!isInChannel) {
      throw new ForbiddenError(
        "You do not have permission to get messages in this channel",
      );
    }

    log.debug(
      { userId, channelId: input.channelId },
      "Getting channel messages",
    );

    return await commsRepo.getChannelMessages(input.channelId, userId);
  });

const toggleMessageReaction = protectedProcedure
  .input(toggleReactionSchema)
  .mutation(async ({ ctx, input }) => {
    const userId = ctx.auth.user.id;

    const canRead = await policyEngine.validate(
      userId,
      `channel:${input.channelId}:read`,
    );

    if (!canRead) {
      throw new ForbiddenError(
        "You do not have permission to react in this channel",
      );
    }

    const message = await commsRepo.getMessageById(input.messageId);

    if (message.channelId !== input.channelId) {
      throw new ForbiddenError(
        "Message does not belong to the specified channel",
      );
    }

    const reactions = await commsRepo.setMessageReaction({
      messageId: input.messageId,
      userId,
      emoji: input.emoji,
      active: input.active,
    });

    return {
      messageId: input.messageId,
      reactions,
    };
  });

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
      input.attachmentFileIds,
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
      fileService,
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

      const channelCreationResult = await commsRepo.createChannel(input.name, input.metadata);
      if(!channelCreationResult || !channelCreationResult.channelId) {
        throw new InternalServerError("Something went wrong creating channel")
      }
      
      // Create admin role and assign it to the channel creator
      const roleKey = `channel:${channelCreationResult.channelId}:admin`;
      await policyEngine.createRoleAndAssign(
        userId,
        userId,
        roleKey,
        "admin",
        "channel",
        channelCreationResult.channelId,
      );
      
      // Auto-subscribe the creator with notifications enabled
      await commsRepo.ensureChannelSubscription(userId, channelCreationResult.channelId);
      
      return channelCreationResult;
    }),
  );

// get channel settings
/*const getChannelSettings = protectedProcedure
  .input(updateChannelSchema)
  .query(({ input }) =>
    withErrorHandling("getChannelSettings", async () => {
      log.debug({ channelId: input.channelId }, "getChannelSettings");
      return await commsRepo.getChannelSettings(input.channelId);
    }),
  );*/

// update channel settings
const updateChannelSettings = protectedProcedure
  .input(updateChannelSchema)
  .mutation(({ ctx, input }) =>
    withErrorHandling("updateChannel", async () => {
      const userId = ctx.auth.user.id;
      const accessible = await policyEngine.validate(
        userId,
        `channel:${input.channelId}:admin`,
      );
      if (!accessible) {
        throw new UnauthorizedError("Invalid Request");
      }
      return await commsService.updateChannelSettings(
        input.channelId,
        input.metadata,
      );
    }),
  );

// Channel members endpoint
const getChannelMembers = protectedProcedure
  .input(updateChannelSchema)
  .query(({ input }) =>
    withErrorHandling("getChannelMembers", async () => {
      log.debug({ channelId: input.channelId }, "getChannelMembers");
      return await commsRepo.getChannelMembers(input.channelId);
    }),
  );

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

// Delete channel endpoint (admin only)
const deleteChannel = protectedProcedure
  .input(deleteChannelSchema)
  .mutation(({ ctx, input }) =>
    withErrorHandling("deleteChannel", async () => {
      const userId = ctx.auth.user.id;

      log.debug(
        { userId, channelId: input.channelId },
        "Deleting channel",
      );

      return await commsService.deleteChannel(userId, input.channelId);
    }),
  );

// Leave channel endpoint (non-admin only)
const leaveChannel = protectedProcedure
  .input(leaveChannelSchema)
  .mutation(({ ctx, input }) =>
    withErrorHandling("leaveChannel", async () => {
      const userId = ctx.auth.user.id;

      log.debug(
        { userId, channelId: input.channelId },
        "Leaving channel",
      );

      return await commsService.leaveChannel(userId, input.channelId);
    }),
  );

export const commsRouter = router({
  createPost,
  getAllChannels,
  getChannelMessages,
  toggleMessageReaction,
  editPost,
  deletePost,
  createChannel,
  updateChannelSettings,
  // getChannelSettings,
  getChannelMembers,
  createSubscription,
  deleteSubscription,
  getUserSubscriptions,
  deleteChannel,
  leaveChannel,
});
