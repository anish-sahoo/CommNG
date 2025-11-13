import { count, eq } from "drizzle-orm";
import { Cache } from "../../utils/cache.js";
import log from "../../utils/logger.js";
import { getRedisClientInstance } from "../db/redis.js";
import { roles, userRoles, users } from "../db/schema.js";
import { db } from "../db/sql.js";

export class AuthRepository {
  async getUserIdsForRole(roleKey: string) {
    const rows = await db
      .select({ userId: userRoles.userId })
      .from(roles)
      .innerJoin(userRoles, eq(roles.roleId, userRoles.roleId))
      .where(eq(roles.roleKey, roleKey));
    return rows.map((row) => row.userId);
  }

  @Cache((userId: string) => `roles:${userId}`, 3600)
  async getRolesForUser(userId: string) {
    const rows = await db
      .selectDistinct({
        key: roles.roleKey,
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.roleId))
      .where(eq(userRoles.userId, userId));
    if (!rows) {
      return [];
    }
    return rows.map((r) => r.key);
  }

  async getRoles(limit: number = 5000) {
    const roleData = await db
      .selectDistinct({ roleKey: roles.roleKey })
      .from(roles)
      .limit(limit);
    return roleData.map((r) => r.roleKey);
  }

  @Cache((roleKey: string) => `role:id:${roleKey}`, 3600)
  async getRoleId(roleKey: string) {
    const roleData = await db
      .selectDistinct({
        roleId: roles.roleId,
      })
      .from(roles)
      .where(eq(roles.roleKey, roleKey));
    if (!roleData || roleData.length === 0) {
      log.warn(`Role ${roleKey} not found`);
      return -1;
    }
    return roleData[0]?.roleId ?? -1;
  }

  async checkIfUserExists(userId: string) {
    const ct = await db
      .select({ value: count() })
      .from(users)
      .where(eq(users.id, userId));
    return ct.length > 0;
  }

  async createRole(
    roleKey: string,
    action: string,
    namespace: "global" | "channel" | "mentor" | "feature",
    channelId?: number | null,
    subjectId?: string | null,
  ) {
    try {
      const [role] = await db
        .insert(roles)
        .values({
          roleKey,
          action,
          namespace,
          channelId: channelId ?? null,
          subjectId: subjectId ?? null,
        })
        .returning();

      // Invalidate the cache for this role key
      if (role) {
        await getRedisClientInstance().DEL(`role:id:${roleKey}`);
        log.debug(`[Cache INVALIDATED] role:id:${roleKey}`);
      }

      return role;
    } catch (e) {
      log.error(e, `Error creating role ${roleKey}`);
      return null;
    }
  }

  async grantAccess(
    userId: string,
    targetUserId: string,
    roleId: number,
    roleKey: string,
  ) {
    try {
      await db
        .insert(userRoles)
        .values({
          userId: targetUserId,
          roleId: roleId,
          assignedBy: userId,
        })
        .onConflictDoNothing();

      // Invalidate the user's roles cache
      await getRedisClientInstance().DEL(`roles:${targetUserId}`);
      log.debug(`[Cache INVALIDATED] roles:${targetUserId}`);

      return true;
    } catch (e) {
      log.error(e, `Error granting ${roleKey} to ${targetUserId}`);
    }
    return false;
  }
}
