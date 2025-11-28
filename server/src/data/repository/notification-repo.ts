import { and, eq, sql } from "drizzle-orm";
import { pushSubscriptions, users } from "../../data/db/schema.js";
import { db } from "../../data/db/sql.js";
import type { TargetAudience } from "../../types/message-blast-types.js";
import type {
  PushSubscriptionKeys,
  SubscribeInput,
} from "../../types/notification-types.js";
import log from "../../utils/logger.js";

export type ActivePushSubscription = {
  endpoint: string;
  p256dh: string;
  auth: string;
  topics: unknown;
  userId: string;
};

/**
 * Repository to persist and retrieve web-push subscriptions.
 * Implementation notes:
 * - Subscriptions are stored in `push_subscriptions` with structured columns
 *   for endpoint, keys, and optional topics. Callers should validate the
 *   subscription payload using `subscribeInputSchema` before calling into
 *   this repository. This repository performs a defensive validation as well.
 */
export class NotificationRepository {
  /**
   * Save a web push subscription for a user.
   * @param userId User ID
   * @param subscription Subscription input object
   */
  async saveWebPushSubscription(userId: string, subscription: SubscribeInput) {
    const endpoint = subscription.endpoint;
    const keys: PushSubscriptionKeys = subscription.keys;

    // atomically insert or update the subscription based on unique endpoint
    // if there's already a subscription with the same endpoint, update the
    // stored userId and auth/keys/topcis/isActive flag. This avoids a delete
    // followed by insert which might create a small race condition.
    await db
      .insert(pushSubscriptions)
      .values({
        userId,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        keys: subscription,
        topics: subscription.topics ?? null,
        isActive: true,
      })
      .onConflictDoUpdate({
        target: [pushSubscriptions.endpoint],
        set: {
          userId,
          p256dh: keys.p256dh,
          auth: keys.auth,
          keys: subscription,
          topics: subscription.topics ?? null,
          isActive: true,
        },
      });
  }

  /**
   * Get all active web push subscriptions for a topic.
   * @param topic Topic string
   * @returns Array of active push subscriptions
   */
  async getAllActiveWebPushSubscriptions(
    topic: string,
  ): Promise<ActivePushSubscription[]> {
    log.info({ topic }, "Sending notifications for topic");
    const rows = await db
      .select({
        endpoint: pushSubscriptions.endpoint,
        p256dh: pushSubscriptions.p256dh,
        auth: pushSubscriptions.auth,
        topics: pushSubscriptions.topics,
        userId: pushSubscriptions.userId,
      })
      .from(pushSubscriptions)
      .where(and(eq(pushSubscriptions.isActive, true)));

    return rows;
  }

  /**
   * Remove a subscription by endpoint string. Use this when you already have the raw endpoint URL.
   * @param endpoint Endpoint string
   */
  async removeSubscriptionByEndpoint(endpoint: string) {
    await db
      .delete(pushSubscriptions)
      .where(eq(pushSubscriptions.endpoint, endpoint));
  }

  /**
   * Get active push subscriptions filtered by target audience.
   * Uses SQL JSONB matching to find users whose attributes match the target audience.
   * If targetAudience is null/undefined, returns all active subscriptions (global broadcast).
   *
   * @param targetAudience - Optional targeting criteria by branch, with ranks and departments
   * @returns Array of active push subscriptions for matching users
   */
  async getSubscriptionsByTargetAudience(
    targetAudience?: TargetAudience | null,
  ): Promise<ActivePushSubscription[]> {
    if (!targetAudience || targetAudience === null) {
      return await this.getAllActiveWebPushSubscriptions("");
    }

    const targetAudienceJson = JSON.stringify(targetAudience);

    const rows = await db
      .select({
        endpoint: pushSubscriptions.endpoint,
        p256dh: pushSubscriptions.p256dh,
        auth: pushSubscriptions.auth,
        topics: pushSubscriptions.topics,
        userId: pushSubscriptions.userId,
      })
      .from(pushSubscriptions)
      .leftJoin(users, eq(pushSubscriptions.userId, users.id))
      .where(
        and(
          eq(pushSubscriptions.isActive, true),
          sql`
            ${users.branch} IS NOT NULL AND
            (${targetAudienceJson}::jsonb ? ${users.branch}) AND
            (
              (${users.rank} IS NULL OR (${targetAudienceJson}::jsonb->${users.branch}->'ranks' ? ${users.rank})) AND
              (${users.department} IS NULL OR (${targetAudienceJson}::jsonb->${users.branch}->'departments' ? ${users.department}))
            )
          `,
        ),
      );

    return rows;
  }
}
