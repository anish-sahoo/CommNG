import { eq } from "drizzle-orm";
import { NotFoundError } from "../../types/errors.js";
import { users } from "../db/schema.js";
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
        rank: users.rank,
        department: users.department,
        branch: users.branch,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        image: users.image,
      })
      .from(users)
      .where(eq(users.id, user_id));

    if (!userRow) {
      throw new NotFoundError(`User ${user_id} not found`);
    }
    return userRow;
  }

  async doesUserExistByEmail(email: string) {
    const [userRow] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email));
    return Boolean(userRow);
  }
}
