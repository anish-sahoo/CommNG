import { getRedisClientInstance } from "../data/db/redis.js";
import { FileRepository } from "../data/repository/file-repo.js";
import type { UserRepository } from "../data/repository/user-repo.js";
import { NotFoundError } from "../types/errors.js";
import { Cache } from "../utils/cache.js";

export class UserService {
  private usersRepo: UserRepository;
  private fileRepo: FileRepository;

  /**
   * @param usersRepo (optional) a reportRepository instance
   */
  constructor(usersRepo: UserRepository, fileRepo?: FileRepository) {
    this.usersRepo = usersRepo;
    this.fileRepo = fileRepo ?? new FileRepository();
  }

  @Cache((user_id: string) => `user:${user_id}:data`)
  async getUserData(user_id: string) {
    return this.usersRepo.getUserData(user_id);
  }

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
    });

    // Invalidate cache for this user
    const cacheKey = `user:${userId}:data`;
    await getRedisClientInstance().DEL(cacheKey);

    return updated;
  }
}
