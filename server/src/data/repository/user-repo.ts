import { and, eq, ilike, or } from "drizzle-orm";
import { users } from "../../data/db/schema.js";
import { db } from "../../data/db/sql.js";
import { NotFoundError } from "../../types/errors.js";

/**
 * Repository to handle database queries/communication related to users
 */
export class UserRepository {
  async searchUsers(name: string) {
    const searchTerm = name.trim().toLowerCase();
    if (!searchTerm) return [];

    const words = searchTerm.split(/\s+/);

    const conditions = words.map((word) =>
      or(ilike(users.name, `%${word}%`), ilike(users.email, `%${word}%`)),
    );

    const results = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        rank: users.rank,
        department: users.department,
        branch: users.branch,
      })
      .from(users)
      .where(and(...conditions))
      .limit(10);

    return results;
  }

  /**
   * Get user data by user ID
   * @param user_id User ID
   * @returns User data object
   * @throws NotFoundError if user not found
   */
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
        location: users.location,
        about: users.about,
        interests: users.interests,
        signalVisibility: users.signalVisibility,
        emailVisibility: users.emailVisibility,
      })
      .from(users)
      .where(eq(users.id, user_id));

    if (!userRow) {
      throw new NotFoundError(`User ${user_id} not found`);
    }
    return userRow;
  }

  /**
   * Check if a user exists by email
   * @param email User email
   * @returns True if user exists, false otherwise
   */
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
      location?: string | null;
      about?: string | null;
      interests?: string[] | null;
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

    if (profileData.location !== undefined) {
      updateFields.location = profileData.location;
    }

    if (profileData.about !== undefined) {
      updateFields.about = profileData.about;
    }

    if (profileData.interests !== undefined) {
      updateFields.interests = profileData.interests;
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
        location: users.location,
        about: users.about,
        interests: users.interests,
        signalVisibility: users.signalVisibility,
        emailVisibility: users.emailVisibility,
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
      location?: string | null;
      about?: string | null;
      interests?: string[] | null;
      signalVisibility?: "private" | "public";
      emailVisibility?: "private" | "public";
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
    if (updateData.location !== undefined)
      updateFields.location = updateData.location;
    if (updateData.about !== undefined) updateFields.about = updateData.about;
    if (updateData.interests !== undefined)
      updateFields.interests = updateData.interests;

    if (updateData.signalVisibility !== undefined) {
      updateFields.signalVisibility = updateData.signalVisibility;
    }
    if (updateData.emailVisibility !== undefined) {
      updateFields.emailVisibility = updateData.emailVisibility;
    }

    if (Object.keys(updateFields).length === 0) {
      throw new Error("No values to set");
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
        location: users.location,
        about: users.about,
        interests: users.interests,
        signalVisibility: users.signalVisibility,
        emailVisibility: users.emailVisibility,
      });

    if (!updated) {
      throw new NotFoundError(`User ${userId} not found`);
    }

    return updated;
  }
}
