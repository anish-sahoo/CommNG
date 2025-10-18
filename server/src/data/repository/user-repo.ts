import { eq } from "drizzle-orm";
import { NotFoundError } from "../../types/errors.js";
import type { GetUserDataOutput } from "../../types/user-types.js";
import { users } from "../db/schema/index.js";
import { db } from "../db/sql.js";

/**
 * Repository to handle database queries/communication related to users
 */
export class UserRepository {
  async getUserData(user_id: number): Promise<GetUserDataOutput> {
    const [userRow] = await db
      .select({
        userId: users.userId,
        name: users.name,
        email: users.email,
        phoneNumber: users.phoneNumber,
        clearanceLevel: users.clearanceLevel,
        department: users.department,
        branch: users.branch,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.userId, user_id));

    if (!userRow) {
      throw new NotFoundError(`User ${user_id} not found`);
    }
    return userRow;
  }
}
