import { eq } from "drizzle-orm";
import { NotFoundError } from "../../types/errors.js";
import { users } from "../db/schema/auth.js";
import { db } from "../db/sql.js";

/**
 * Repository to handle database queries/communication related to users
 */
export class UserRepository {
  async getUserData(user_id: string) {
    const [userRow] = await db
      .select({
        id: users.id,
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
      .where(eq(users.id, user_id));

    if (!userRow) {
      throw new NotFoundError(`User ${user_id} not found`);
    }
    return userRow;
  }
}
