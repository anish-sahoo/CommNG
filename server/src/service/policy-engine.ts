import pLimit from "p-limit";
import { redisClient } from "../data/db/redis.js";
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
    if (roleKey.length === 0) {
      return false;
    }
    const roleId = await this.authRepository.getRoleId(roleKey);
    if (roleId === -1) {
      return false;
    }

    const redisResult = await redisClient.sIsMember(
      `role:${roleKey}:users`,
      `${userId}`,
    );
    if (redisResult === 1) {
      return true;
    }

    const rolesForUser = await this.authRepository.getRolesForUser(userId);
    const roleSet = new Set(rolesForUser);

    return (
      roleSet.has("global:admin") ||
      roleSet.has(roleKey) ||
      roleSet.has(`${roleKey.substring(0, roleKey.lastIndexOf(":"))}:admin`)
    );
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
            const pipeline = redisClient.multi();

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
