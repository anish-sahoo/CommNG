import { count, eq } from "drizzle-orm";
import { Cache } from "../../utils/cache.js";
import log from "../../utils/logger.js";
import { getRedisClientInstance } from "../db/redis.js";
import { type RoleNamespace, roles, userRoles, users } from "../db/schema.js";
import { db } from "../db/sql.js";
import { getImpliedRoles } from "../role-hierarchy.js";
import type { RoleKey } from "../roles.js";

/**
 * Normalizes cached role data (plain arrays, serialized sets, etc.) into a Set<RoleKey>.
 * This protects us from legacy cache entries while keeping the runtime API consistent.
 */
function hydrateRoleSet(value: unknown): Set<RoleKey> {
  if (value instanceof Set) {
    return value as Set<RoleKey>;
  }

  if (Array.isArray(value)) {
    return new Set(
      value.filter((role): role is RoleKey => typeof role === "string"),
    );
  }

  if (
    value &&
    typeof value === "object" &&
    Array.isArray((value as { values?: unknown[] }).values)
  ) {
    const entries = (value as { values: unknown[] }).values;
    return new Set(
      entries.filter((role): role is RoleKey => typeof role === "string"),
    );
  }

  return new Set();
}

/**
 * Repository for authentication and role management operations
 */
export class AuthRepository {
  /**
   * Get all user IDs assigned to a specific role
   * @param roleKey Role key
   * @returns Array of user IDs
   */
  async getUserIdsForRole(roleKey: RoleKey) {
    const rows = await db
      .select({ userId: userRoles.userId })
      .from(roles)
      .innerJoin(userRoles, eq(roles.roleId, userRoles.roleId))
      .where(eq(roles.roleKey, roleKey));
    return rows.map((row) => row.userId);
  }

  @Cache((userId: string) => `roles:${userId}`, 3600, {
    hydrate: hydrateRoleSet,
  })
  /**
   * Get all role keys assigned to a user
   * @param userId User ID
   * @returns Array of role keys
   */
  async getRolesForUser(userId: string) {
    const rows = await db
      .selectDistinct({
        key: roles.roleKey,
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.roleId))
      .where(eq(userRoles.userId, userId));

    return new Set(rows.map((r) => r.key));
  }

  @Cache((userId: string) => `roles:implied:${userId}`, 3600, {
    hydrate: hydrateRoleSet,
  })
  /**
   * Get all role keys assigned to a user, including implied roles from hierarchy
   * @param userId User ID
   * @returns Set of role keys including all implied permissions
   */
  async getAllImpliedRolesForUser(userId: string) {
    const assignedRoles = await this.getRolesForUser(userId);
    const allRoles = new Set<RoleKey>();

    for (const role of assignedRoles) {
      const implied = getImpliedRoles(role);
      for (const impliedRole of implied) {
        allRoles.add(impliedRole);
      }
    }

    return allRoles;
  }

  /**
   * Get all available role keys (limited)
   * @param limit Maximum number of roles to return (default: 5000)
   * @returns Array of role keys
   */
  async getRoles(limit: number = 5000) {
    const roleData = await db
      .selectDistinct({ roleKey: roles.roleKey })
      .from(roles)
      .limit(limit);
    return roleData.map((r) => r.roleKey);
  }

  @Cache((roleKey: string) => `role:id:${roleKey}`, 3600)
  /**
   * Get the role ID for a given role key
   * @param roleKey Role key
   * @returns Role ID or null if not found
   */
  async getRoleId(roleKey: RoleKey) {
    const roleData = await db
      .selectDistinct({
        roleId: roles.roleId,
      })
      .from(roles)
      .where(eq(roles.roleKey, roleKey));
    if (!roleData || roleData.length === 0) {
      log.warn(`Role ${roleKey} not found`);
      return null;
    }
    return roleData[0]?.roleId ?? null;
  }

  /**
   * Check if a user exists by user ID
   * @param userId User ID
   * @returns True if user exists, false otherwise
   */
  async checkIfUserExists(userId: string) {
    const ct = await db
      .select({ value: count() })
      .from(users)
      .where(eq(users.id, userId));
    return ct.length > 0;
  }

  /**
   * Create a new role
   * @param roleKey Role key
   * @param action Action string
   * @param namespace Role namespace
   * @param channelId Optional channel ID
   * @param subjectId Optional subject ID
   * @returns Created role object or null on error
   */
  async createRole(
    roleKey: RoleKey,
    action: string,
    namespace: RoleNamespace,
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

  /**
   * Grant a role to a user
   * @param userId User ID granting the role
   * @param targetUserId Target user ID to receive the role
   * @param roleId Role ID
   * @param roleKey Role key
   * @returns True if granted, false otherwise
   */
  async grantAccess(
    userId: string,
    targetUserId: string,
    roleId: number,
    roleKey: RoleKey,
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
      const redis = getRedisClientInstance();
      await redis.DEL(`roles:${targetUserId}`);
      await redis.DEL(`roles:implied:${targetUserId}`);
      log.debug(
        `[Cache INVALIDATED] roles:${targetUserId}, roles:implied:${targetUserId}`,
      );

      return true;
    } catch (e) {
      log.error(e, `Error granting ${roleKey} to ${targetUserId}`);
    }
    return false;
  }
}
