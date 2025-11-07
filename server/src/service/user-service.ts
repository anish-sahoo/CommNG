import type { UserRepository } from "../data/repository/user-repo.js";
import { getRedisClientInstance } from "../data/db/redis.js";
import { Cache } from "../utils/cache.js";

export class UserService {
  private usersRepo: UserRepository;

  /**
   * @param usersRepo (optional) a reportRepository instance
   */
  constructor(usersRepo: UserRepository) {
    this.usersRepo = usersRepo;
  }

  @Cache((user_id: string) => `user:${user_id}:data`)
  async getUserData(user_id: string) {
    return this.usersRepo.getUserData(user_id);
  }

  async doesUserExistByEmail(email: string) {
    return this.usersRepo.doesUserExistByEmail(email);
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
    },
  ) {
    const updated = await this.usersRepo.updateUserProfile(userId, updateData);

    // Invalidate cache for this user
    const cacheKey = `user:${userId}:data`;
    await getRedisClientInstance().DEL(cacheKey);

    return updated;
  }
}
