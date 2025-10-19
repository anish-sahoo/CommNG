import { TRPCError } from "@trpc/server";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import {
  channelSubscriptions,
  channels,
  messages,
  roles,
  userRoles,
} from "../data/db/schema/index.js";
import { db } from "../data/db/sql.js";
import { procedure, router } from "../trpc/trpc.js";
import log from "../utils/logger.js";

const ping = procedure.query(() => {
  log.debug("ping");
  return "pong from comms";
});

/**
 * createPost
 * Allows an authenticated user to post a message in a channel if they have write permissions.
 */
const createPost = procedure
  .input(
    z.object({
      channelId: z.coerce.number().int().positive(),
      content: z.string().min(1, "Post content cannot be empty"),
      attachmentUrl: z.string().url().optional(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const userId = ctx.userId ?? ctx.user?.userId ?? null;
    if (!userId) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Sign in required",
      });
    }

    const [chan] = await db
      .select({ id: channels.channelId })
      .from(channels)
      .where(eq(channels.channelId, input.channelId))
      .limit(1);

    if (!chan) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Channel not found" });
    }

    let canPost = false;
    const [sub] = await db
      .select({ permission: channelSubscriptions.permission })
      .from(channelSubscriptions)
      .where(
        and(
          eq(channelSubscriptions.channelId, input.channelId),
          eq(channelSubscriptions.userId, userId),
        ),
      )
      .limit(1);

    if (sub && (sub.permission === "write" || sub.permission === "both")) {
      canPost = true;
    }

    if (!canPost) {
      const roleActionsAllowed = ["post", "write", "manage"];

      const roleRows = await db
        .select({
          roleId: roles.roleId,
          action: roles.action,
          subjectId: roles.subjectId,
        })
        .from(userRoles)
        .innerJoin(roles, eq(userRoles.roleId, roles.roleId))
        .where(
          and(
            eq(userRoles.userId, userId),
            eq(roles.namespace, "channel"),
            eq(roles.channelId, input.channelId),
            inArray(roles.action, roleActionsAllowed as [string, ...string[]]),
          ),
        );

      if (roleRows.length > 0) {
        canPost = true;
      } else {
        const msgRoleRows = await db
          .select({ roleId: roles.roleId })
          .from(userRoles)
          .innerJoin(roles, eq(userRoles.roleId, roles.roleId))
          .where(
            and(
              eq(userRoles.userId, userId),
              eq(roles.namespace, "channel"),
              eq(roles.channelId, input.channelId),
              eq(roles.subjectId, "messages"),
              inArray(
                roles.action,
                roleActionsAllowed as [string, ...string[]],
              ),
            ),
          );
        if (msgRoleRows.length > 0) canPost = true;
      }
    }

    if (!canPost) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You do not have permission to post in this channel",
      });
    }

    const [created] = await db
      .insert(messages)
      .values({
        channelId: input.channelId,
        senderId: userId,
        message: input.content,
        attachmentUrl: input.attachmentUrl,
      })
      .returning({
        messageId: messages.messageId,
        channelId: messages.channelId,
        senderId: messages.senderId,
        message: messages.message,
        attachmentUrl: messages.attachmentUrl,
        createdAt: messages.createdAt,
      });

    return created;
  });

export const commsRouter = router({
  ping,
  createPost,
});
