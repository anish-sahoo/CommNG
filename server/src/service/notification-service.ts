import webpush from "web-push";
import type { ActivePushSubscription } from "@/data/repository/notification-repo.js";
import { NotificationRepository } from "@/data/repository/notification-repo.js";
import type { TargetAudience } from "@/types/message-blast-types.js";
import type {
  NotificationPayload,
  SubscribeInput,
} from "@/types/notification-types.js";
import log from "@/utils/logger.js";

/**
 * Service for managing web push notifications and subscriptions
 */
export class NotificationService {
  constructor(private repo: NotificationRepository) {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const contact = process.env.VAPID_CONTACT_EMAIL ?? "admin@example.com";

    if (!publicKey || !privateKey) {
      log.warn(
        "VAPID keys not configured. Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY for web-push to work.",
      );
    } else {
      const contactStr = contact.startsWith("mailto:")
        ? contact
        : `mailto:${contact}`;
      webpush.setVapidDetails(contactStr, publicKey, privateKey);
    }
  }

  /**
   * Subscribe a user to web push notifications
   * @param userId User ID
   * @param subscription Subscription data (endpoint, keys)
   */
  async subscribe(userId: string, subscription: SubscribeInput) {
    // subscription is already validated by the router; persist it directly
    await this.repo.saveWebPushSubscription(userId, subscription);
  }

  /**
   * Send a payload to all subscribers for a topic
   * @param topic Topic name (default: "general")
   * @param payload Notification payload
   */
  async sendNotifications(
    topic: string = "general",
    payload: NotificationPayload,
  ) {
    const rows: ActivePushSubscription[] =
      await this.repo.getAllActiveWebPushSubscriptions(topic);

    for (const row of rows) {
      const subscription = {
        endpoint: row.endpoint,
        keys: {
          p256dh: row.p256dh,
          auth: row.auth,
        },
      };

      try {
        await webpush.sendNotification(subscription, JSON.stringify(payload));
      } catch (err) {
        await this.repo.removeSubscriptionByEndpoint(row.endpoint);
        log.error(err, "Error sending web-push notification");
      }
    }
  }

  /**
   * Send notifications to users matching the target audience (global broadcast if null)
   * @param targetAudience Optional targeting criteria by branch, ranks, and departments
   * @param payload Notification payload to send
   */
  async sendTargetedNotifications(
    targetAudience: TargetAudience | null,
    payload: NotificationPayload,
  ) {
    const rows: ActivePushSubscription[] =
      await this.repo.getSubscriptionsByTargetAudience(targetAudience);

    log.info(
      { targetAudience, recipientCount: rows.length },
      "Sending targeted notifications",
    );

    for (const row of rows) {
      const subscription = {
        endpoint: row.endpoint,
        keys: {
          p256dh: row.p256dh,
          auth: row.auth,
        },
      };

      try {
        await webpush.sendNotification(subscription, JSON.stringify(payload));
      } catch (err) {
        await this.repo.removeSubscriptionByEndpoint(row.endpoint);
        log.error(err, "Error sending web-push notification");
      }
    }
  }
}

// singleton instance exported for app-wide use
export const notificationService = new NotificationService(
  new NotificationRepository(),
);
export default notificationService;
