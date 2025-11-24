import { getRedisClientInstance } from "@/data/db/redis.js";
import { FileRepository } from "@/data/repository/file-repo.js";
import type { UserRepository } from "@/data/repository/user-repo.js";
import { NotFoundError } from "@/types/errors.js";
import { Cache } from "@/utils/cache.js";
import log from "@/utils/logger.js";

const USER_CACHE_TTL_SECONDS = 60 * 60; // keep in sync with Cache decorator default

/**
 * Service for user data operations with caching
 */
export class UserService {
  private usersRepo: UserRepository;
  private fileRepo: FileRepository;

  /**
   * @param usersRepo a reportRepository instance
   */
  constructor(usersRepo: UserRepository, fileRepo?: FileRepository) {
    this.usersRepo = usersRepo;
    this.fileRepo = fileRepo ?? new FileRepository();
  }

  /**
   * Get user data by ID (cached)
   * @param user_id User ID
   * @returns User data object
   */
  @Cache((user_id: string) => `user:${user_id}:data`)
  async getUserData(user_id: string) {
    return this.usersRepo.getUserData(user_id);
  }

  /**
   * Check if a user exists by email
   * @param email User email
   * @returns True if user exists, false otherwise
   */
  async doesUserExistByEmail(email: string) {
    return this.usersRepo.doesUserExistByEmail(email);
  }

  async createUserProfile(
    userId: string,
    profileData: {
      name: string;
      phoneNumber?: string | null;
      rank?: string | null;
      department?: string | null;
      branch?: string | null;
      imageFileId?: string | null;
      location?: string | null;
      about?: string | null;
      interests?: string[] | null;
    },
  ) {
    // Validate file exists if imageFileId is provided
    if (profileData.imageFileId) {
      try {
        await this.fileRepo.getFile(profileData.imageFileId);
      } catch (error) {
        if (error instanceof NotFoundError) {
          throw new NotFoundError(
            `File ${profileData.imageFileId} not found for profile picture`,
          );
        }
        throw error;
      }
    }

    const updated = await this.usersRepo.createUserProfile(userId, {
      name: profileData.name,
      phoneNumber: profileData.phoneNumber,
      rank: profileData.rank,
      department: profileData.department,
      branch: profileData.branch,
      image: profileData.imageFileId ?? null,
      location: profileData.location ?? null,
      about: profileData.about ?? null,
      interests: profileData.interests ?? null,
    });

    // Refresh cache for this user (best effort - don't fail if Redis is unavailable)
    const cacheKey = `user:${userId}:data`;
    try {
      await getRedisClientInstance().set(cacheKey, JSON.stringify(updated), {
        EX: USER_CACHE_TTL_SECONDS,
      });
    } catch (error) {
      log.warn(
        { error, cacheKey, userId },
        "Failed to refresh user cache after profile creation",
      );
    }

    return updated;
  }

  async updateUserProfile(
    userId: string,
    updateData: {
      name?: string;
      phoneNumber?: string | null;
      rank?: string | null;
      department?: string | null;
      branch?: string | null;
      image?: string | null;
      location?: string | null;
      about?: string | null;
      interests?: string[] | null;
    },
  ) {
    const updated = await this.usersRepo.updateUserProfile(userId, updateData);

    // Update cache with new data (best effort - don't fail if Redis is unavailable)
    const cacheKey = `user:${userId}:data`;
    try {
      await getRedisClientInstance().set(cacheKey, JSON.stringify(updated), {
        EX: USER_CACHE_TTL_SECONDS,
      });
    } catch (error) {
      // Log but don't fail the operation if cache update fails
      log.warn(
        { error, cacheKey, userId },
        "Failed to update user cache after profile update",
      );
    }

    return updated;
  }
}
