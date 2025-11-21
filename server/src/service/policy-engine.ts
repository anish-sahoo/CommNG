import pLimit from "p-limit";
import { getRedisClientInstance } from "@/data/db/redis.js";
import type { RoleNamespace } from "@/data/db/schema.js";
import { AuthRepository } from "@/data/repository/auth-repo.js";
import { hasAnyPermission, hasPermission } from "@/data/role-hierarchy.js";
import {
  type ChannelRoleKey,
  GLOBAL_ADMIN_KEY,
  type RoleKey,
} from "@/data/roles.js";
import { BadRequestError } from "@/types/errors.js";
import log from "@/utils/logger.js";

/**
 * Policy Engine that handles everything related to access control (checking access, granting access, etc.)
 */
export class PolicyEngine {
  private DEFAULT_TTL = 60 * 60 * 8;
  private authRepository: AuthRepository;

  constructor(authRepository: AuthRepository) {
    this.authRepository = authRepository;
  }

  /**
   * Validates if a user has permission for any of the required roles.
   * Accounts for role hierarchy (e.g., channel:1:admin grants channel:1:post and channel:1:read).
   * Global admins bypass all checks.
   *
   * @param availableRoles Set of roles the user has
   * @param requiredRoles Array of roles, user needs at least one
   * @returns true if user has permission
   */
  static validateList(availableRoles: Set<RoleKey>, requiredRoles: RoleKey[]) {
    if (availableRoles.has(GLOBAL_ADMIN_KEY)) {
      return true;
    }

    // Check if user has any required role, accounting for hierarchy
    return hasAnyPermission(availableRoles, requiredRoles);
  }

  /**
   * Populate redis cache with role data for quick permission lookup
   * @param ttlSec Time to live for cache (default: 8 hours)
   * @param limit Number of items to cache (default: 5000)
   */
  async populateCache(ttlSec: number = this.DEFAULT_TTL, limit: number = 5000) {
    try {
      const roleData = await this.authRepository.getRoles(limit);
      const cacheCount = await this.cacheRoleKeys(roleData, ttlSec);
      log.info(`Cached ${cacheCount} roleKeys`);
    } catch (e) {
      log.error(e, "Failed to cache roles");
    }
  }

  /**
   * Validate if a user has permission to access a resource.
   * Accounts for role hierarchy (e.g., channel:1:admin grants channel:1:post and channel:1:read).
   * Global admins bypass all checks.
   *
   * @param userId User ID
   * @param roleKey Role key (e.g., `channel:1:read`)
   * @returns True if user has permission, false otherwise
   */
  async validate(userId: string, roleKey: RoleKey) {
    log.debug({ userId, roleKey }, "Validate perms");
    if (roleKey.length === 0) {
      return false;
    }

    const roleSet = await this.authRepository.getRolesForUser(userId);

    if (roleSet.has(GLOBAL_ADMIN_KEY)) {
      return true;
    }

    // Check if user has the required role (accounting for hierarchy)
    return hasPermission(roleSet, roleKey);
  }

  /**
   * Validates if a user has permission for ANY of the provided roles.
   * Accounts for role hierarchy (e.g., channel:1:admin grants channel:1:post and channel:1:read).
   * More efficient than calling validate() multiple times.
   * Global admins bypass all checks.
   *
   * @param userId userId
   * @param roleKeys array of roleKeys to check
   * @returns `true` if user has ANY of the roles, `false` otherwise
   */
  async validateAny(userId: string, roleKeys: RoleKey[]) {
    if (roleKeys.length === 0) {
      return false;
    }

    const roleSet = await this.authRepository.getRolesForUser(userId);

    if (roleSet.has(GLOBAL_ADMIN_KEY)) {
      return true;
    }

    // Check if user has any of the required roles (accounting for hierarchy)
    return hasAnyPermission(roleSet, roleKeys);
  }

  /**
   * Grant new permission to a target user
   * @param userId User ID of the granter (must have admin permissions)
   * @param targetUserId User ID receiving the permission
   * @param roleKey Role key to assign
   * @param ttlSec Time to live for cache (default: 8 hours)
   * @returns True if successful, false otherwise
   * @throws BadRequestError if role or user not found
   */
  async addNewPermission(
    userId: string,
    targetUserId: string,
    roleKey: RoleKey,
    ttlSec: number = this.DEFAULT_TTL,
  ) {
    const roleId = await this.authRepository.getRoleId(roleKey);
    if (!roleId || roleId === -1) {
      throw new BadRequestError("Role ID not found");
    }
    const userExists =
      await this.authRepository.checkIfUserExists(targetUserId);
    if (!userExists) {
      throw new BadRequestError("Role ID not found");
    }
    const result = await this.authRepository.grantAccess(
      userId,
      targetUserId,
      roleId,
      roleKey,
    );
    if (result) {
      await this.cacheRoleKeys([roleKey], ttlSec);
      return true;
    }
    return false;
  }

  /**
   * Create a role and assign it to a user in one transaction
   * @param assigningUserId User ID creating/assigning the role
   * @param targetUserId User ID that will receive the role
   * @param roleKey Role key to create (e.g., 'channel:1:admin')
   * @param action Action for the role (e.g., 'admin', 'post', 'read')
   * @param namespace Namespace for the role ('channel', 'global', etc.)
   * @param channelId Optional channel ID for channel-scoped roles
   * @param ttlSec Time to live for cache (default: 8 hours)
   * @returns True if successful, false otherwise
   * @throws BadRequestError if role creation fails or user not found
   */
  async createAndAssignChannelRole(
    assigningUserId: string,
    targetUserId: string,
    roleKey: ChannelRoleKey,
    action: string,
    namespace: RoleNamespace,
    channelId: number,
  ) {
    // Check if role already exists
    let roleId = await this.authRepository.getRoleId(roleKey);

    // If role doesn't exist, create it
    if (roleId === null) {
      const subjectId = channelId ? channelId.toString() : null;
      const newRole = await this.authRepository.createRole(
        roleKey,
        action,
        namespace,
        channelId,
        subjectId,
      );

      if (!newRole) {
        // Role creation failed, possibly due to race condition
        // Try to get the role ID again in case it was created by another process
        roleId = await this.authRepository.getRoleId(roleKey);
        if (roleId === null) {
          throw new BadRequestError("Failed to create role");
        }
      } else {
        roleId = newRole.roleId;
      }
    }

    const userExists =
      await this.authRepository.checkIfUserExists(targetUserId);
    if (!userExists) {
      throw new BadRequestError("User not found");
    }

    const result = await this.authRepository.grantAccess(
      assigningUserId,
      targetUserId,
      roleId,
      roleKey,
    );

    if (result) {
      await this.cacheRoleKeys([roleKey], this.DEFAULT_TTL);
      log.debug(
        { userId: assigningUserId, targetUserId, roleKey, roleId },
        "Successfully created and assigned role",
      );
      return true;
    }
    log.warn(
      { userId: assigningUserId, targetUserId, roleKey, roleId },
      "Failed to assign role",
    );
    return false;
  }

  private async cacheRoleKeys(
    roleKeys: RoleKey[],
    ttlSec: number = this.DEFAULT_TTL,
  ) {
    const threadLimit = pLimit(10);
    try {
      const results = await Promise.all(
        roleKeys.map((roleKey) =>
          threadLimit(async () => {
            const userIds =
              await this.authRepository.getUserIdsForRole(roleKey);
            const cacheKey = `role:${roleKey}:users`;
            const pipeline = getRedisClientInstance().multi();

            if (userIds.length > 0) {
              pipeline.sAdd(cacheKey, userIds.map(String));
              if (ttlSec > 0) pipeline.expire(cacheKey, ttlSec);
              await pipeline.exec();
              return true;
            }

            pipeline.del(cacheKey);
            await pipeline.exec();
            return false;
          }),
        ),
      );
      return results.filter(Boolean).length;
    } catch (e) {
      log.error(e, "Error caching role keys");
    }
  }
}

export const policyEngine = new PolicyEngine(new AuthRepository());
