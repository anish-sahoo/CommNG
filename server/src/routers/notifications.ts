import notificationService from "../service/notification-service.js";
import { withErrorHandling } from "../trpc/error_handler.js";
import { protectedProcedure, router } from "../trpc/trpc.js";
import {
  type NotificationPayload,
  subscribeInputSchema,
} from "../types/notification-types.js";
import log from "../utils/logger.js";

const subscribe = protectedProcedure
  .input(subscribeInputSchema)
  .meta({ description: "Subscribe current user to web-push notifications" })
  .mutation(async ({ input, ctx }) => {
    return withErrorHandling("subscribeToNotifications", async () => {
      const userId = ctx.auth.user.id;
      log.info(ctx.auth.user, "User Data");
      if (!userId) {
        throw new Error("Unauthorized");
      }
      await notificationService.subscribe(userId, input);
      return { success: true };
    });
  });

const testNotifications = protectedProcedure
  .meta({ description: "Test by sending a sample notification" })
  .mutation(async ({ ctx }) => {
    return withErrorHandling("testNotification", async () => {
      const userId = ctx.auth.user.id;
      if (!userId) {
        throw new Error("Unauthorized");
      }
      const payload: NotificationPayload = {
        title: "Test Notification",
        body: "This is a test and should go to every single subscriber",
      };
      await notificationService.sendNotifications("general", payload);
      return { success: true };
    });
  });

export const notificationsRouter = router({
  subscribe,
  testNotifications,
});
