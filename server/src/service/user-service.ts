import type { UserRepository } from "../data/repository/user-repo.js";
import { Cache } from "../utils/cache.js";

/**
 * Service for user data operations with caching
 */
export class UserService {
  private usersRepo: UserRepository;

  constructor(usersRepo: UserRepository) {
    this.usersRepo = usersRepo;
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
}
