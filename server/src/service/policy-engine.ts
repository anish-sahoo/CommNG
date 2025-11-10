import pLimit from "p-limit";
import { getRedisClientInstance } from "../data/db/redis.js";
import { AuthRepository } from "../data/repository/auth-repo.js";
import { BadRequestError } from "../types/errors.js";
import log from "../utils/logger.js";

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
   * Populates redis with `limit` amount of role data for quick permission lookup
   * @param ttlSec time to live for cache
   * @param limit number of items to cache, adjust according to system memory
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
   * Validates if a user has permission to access a resource or not
   * @param userId userId
   * @param roleKey roleKey, for example `channel:1:read`
   * @returns `true` or `false`
   */
  async validate(userId: string, roleKey: string) {
    log.debug({userId, roleKey}, "Validate perms")
    if (roleKey.length === 0) {
      return false;
    }
    
    const roleId = await this.authRepository.getRoleId(roleKey);
    
    // Check Redis cache first if the role exists
    if (roleId !== -1) {
      const redisResult = await getRedisClientInstance().sIsMember(
        `role:${roleKey}:users`,
        `${userId}`,
      );
      if (redisResult === 1) {
        return true;
      }
    }

    // Get all roles for the user from the database
    const rolesForUser = await this.authRepository.getRolesForUser(userId);
    const roleSet = new Set(rolesForUser);

    const adminRoleKey = `${roleKey.substring(0, roleKey.lastIndexOf(":"))}:admin`;
    const hasPermission = (
      roleSet.has("global:admin") ||
      roleSet.has(roleKey) ||
      roleSet.has(adminRoleKey)
    );

    log.debug({ 
      userId, 
      roleKey, 
      roleId,
      rolesForUser: Array.from(roleSet), 
      adminRoleKey,
      hasPermission 
    }, "Permission validation");

    return hasPermission;
  }

  /**
   * Grant new permission to `targetUserId`. Someone with admin permissions would call this role to grant permissions.
   * @param userId userId of the granter
   * @param targetUserId userId that is getting assigned the permission
   * @param roleKey roleKey getting assigned
   * @param ttlSec time to live, optional
   * @returns
   */
  async addNewPermission(
    userId: string,
    targetUserId: string,
    roleKey: string,
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
   * @param userId userId creating/assigning the role
   * @param targetUserId userId that will receive the role
   * @param roleKey roleKey to create (e.g., 'channel:1:admin')
   * @param action action for the role (e.g., 'admin', 'post', 'read')
   * @param namespace namespace for the role ('channel', 'global', etc.)
   * @param channelId optional channelId for channel-scoped roles
   * @param ttlSec time to live for cache, optional
   * @returns
   */
  async createRoleAndAssign(
    userId: string,
    targetUserId: string,
    roleKey: string,
    action: string,
    namespace: "global" | "channel" | "mentor" | "feature",
    channelId?: number | null,
    ttlSec: number = this.DEFAULT_TTL,
  ) {
    // Check if role already exists
    let roleId = await this.authRepository.getRoleId(roleKey);
    
    // If role doesn't exist, create it
    if (roleId === -1) {
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
        if (roleId === -1) {
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
      userId,
      targetUserId,
      roleId,
      roleKey,
    );

    if (result) {
      await this.cacheRoleKeys([roleKey], ttlSec);
      log.debug({ userId, targetUserId, roleKey, roleId }, "Successfully created and assigned role");
      return true;
    }
    log.warn({ userId, targetUserId, roleKey, roleId }, "Failed to assign role");
    return false;
  }

  private async cacheRoleKeys(
    roleKeys: string[],
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
