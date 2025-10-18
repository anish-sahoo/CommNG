import { UserRepository } from "../data/repository/user-repo.js";
import { BadRequestError } from "../types/errors.js";
import { Cache } from "../utils/cache.js";

export class UserService {
  private usersRepo: UserRepository;

  /**
   * @param usersRepo (optional) a reportRepository instance
   */
  constructor(usersRepo?: UserRepository) {
    this.usersRepo = usersRepo ?? new UserRepository();
  }

  @Cache((user_id: number) => `user:${user_id}:user_date`)
  async getUserData(user_id: number) {
    if (user_id !== Math.trunc(user_id)) {
      throw new BadRequestError("Cannot have decimal points in User ID");
    }
    return this.usersRepo.getUserData(user_id);
  }
}
