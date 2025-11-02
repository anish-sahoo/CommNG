import { and, eq, sql } from "drizzle-orm";
import { pushSubscriptions, users } from "../db/schema.js";
import { db } from "../db/sql.js";
import type { TargetAudience } from "../../types/message-blast-types.js";

export type ActivePushSubscription = {
  endpoint: string;
  p256dh: string;
  auth: string;
  topics: unknown;
  userId: string;
};

import type {
  PushSubscriptionKeys,
  SubscribeInput,
} from "../../types/notification-types.js";
import log from "../../utils/logger.js";

/**
 * Repository to persist and retrieve web-push subscriptions.
 * Implementation notes:
 * - Subscriptions are stored in `push_subscriptions` with structured columns
 *   for endpoint, keys, and optional topics. Callers should validate the
 *   subscription payload using `subscribeInputSchema` before calling into
 *   this repository. This repository performs a defensive validation as well.
 */
export class NotificationRepository {
  async saveWebPushSubscription(userId: string, subscription: SubscribeInput) {
    const endpoint = subscription.endpoint;
    const keys: PushSubscriptionKeys = subscription.keys;

    // remove any existing subscription with same endpoint
    await db
      .delete(pushSubscriptions)
      .where(eq(pushSubscriptions.endpoint, endpoint));

    await db.insert(pushSubscriptions).values({
      userId,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      keys: subscription,
      topics: subscription.topics ?? null,
      isActive: true,
    });
  }

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
   * Remove a subscription by endpoint string.
   * Use this when you already have the raw endpoint URL.
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
    const targetAudienceJson = targetAudience
      ? JSON.stringify(targetAudience)
      : null;

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
          targetAudienceJson
            ? sql`
                ${users.branch} IS NOT NULL AND
                (${targetAudienceJson}::jsonb ? ${users.branch}) AND
                (
                  (${users.rank} IS NULL OR (${targetAudienceJson}::jsonb->${users.branch}->'ranks' ? ${users.rank})) AND
                  (${users.department} IS NULL OR (${targetAudienceJson}::jsonb->${users.branch}->'departments' ? ${users.department}))
                )
              `
            : sql`TRUE`,
        ),
      );

    return rows;
  }
}
