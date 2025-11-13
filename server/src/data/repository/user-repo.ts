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

  async createUserProfile(
    userId: string,
    profileData: {
      name: string;
      phoneNumber?: string | null;
      rank?: string | null;
      department?: string | null;
      branch?: string | null;
      image?: string | null;
    },
  ) {
    const updateFields: Partial<typeof users.$inferInsert> = {
      name: profileData.name,
    };

    if (profileData.phoneNumber !== undefined) {
      updateFields.phoneNumber = profileData.phoneNumber;
    }

    if (profileData.rank !== undefined) {
      updateFields.rank = profileData.rank;
    }

    if (profileData.department !== undefined) {
      updateFields.department = profileData.department;
    }

    if (profileData.branch !== undefined) {
      updateFields.branch = profileData.branch;
    }

    if (profileData.image !== undefined) {
      updateFields.image = profileData.image;
    }

    const [updated] = await db
      .update(users)
      .set(updateFields)
      .where(eq(users.id, userId))
      .returning({
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
      });

    if (!updated) {
      throw new NotFoundError(`User ${userId} not found`);
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
    },
  ) {
    const updateFields: Partial<typeof users.$inferInsert> = {};

    if (updateData.name !== undefined) updateFields.name = updateData.name;
    if (updateData.phoneNumber !== undefined)
      updateFields.phoneNumber = updateData.phoneNumber;
    if (updateData.rank !== undefined) updateFields.rank = updateData.rank;
    if (updateData.department !== undefined)
      updateFields.department = updateData.department;
    if (updateData.branch !== undefined)
      updateFields.branch = updateData.branch;
    if (updateData.image !== undefined) updateFields.image = updateData.image;

    const [updated] = await db
      .update(users)
      .set(updateFields)
      .where(eq(users.id, userId))
      .returning({
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
      });

    if (!updated) {
      throw new NotFoundError(`User ${userId} not found`);
    }

    return updated;
  }
}
