import type { UserRepository } from "../data/repository/user-repo.js";
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
}
