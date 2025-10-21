import { eq } from "drizzle-orm";
import { ConflictError, NotFoundError } from "../../types/errors.js";
import type {
  CreateMenteeOutput,
  GetMenteeOutput,
  UpdateMenteeOutput,
} from "../../types/mentee-types.js";
import { mentees } from "../db/schema/index.js";
import { db } from "../db/sql.js";

/**
 * Repository to handle database queries/communication related to mentees
 */
export class MenteeRepository {
  async createMentee(
    userId: number,
    learningGoals?: string,
    experienceLevel?: string,
    preferredMentorType?: string,
    status: "active" | "inactive" | "matched" = "active",
  ): Promise<CreateMenteeOutput> {
    // Check if mentee already exists for this user
    const existingMentee = await db
      .select()
      .from(mentees)
      .where(eq(mentees.userId, userId))
      .limit(1);

    if (existingMentee.length > 0) {
      throw new ConflictError("Mentee profile already exists for this user");
    }

    const [created] = await db
      .insert(mentees)
      .values({
        userId,
        learningGoals,
        experienceLevel,
        preferredMentorType,
        status,
      })
      .returning({
        menteeId: mentees.menteeId,
        userId: mentees.userId,
        learningGoals: mentees.learningGoals,
        experienceLevel: mentees.experienceLevel,
        preferredMentorType: mentees.preferredMentorType,
        status: mentees.status,
        createdAt: mentees.createdAt,
        updatedAt: mentees.updatedAt,
      });

    if (!created) {
      throw new ConflictError("Failed to create mentee profile");
    }

    return created;
  }

  async getMenteeById(menteeId: number): Promise<GetMenteeOutput> {
    const [mentee] = await db
      .select({
        menteeId: mentees.menteeId,
        userId: mentees.userId,
        learningGoals: mentees.learningGoals,
        experienceLevel: mentees.experienceLevel,
        preferredMentorType: mentees.preferredMentorType,
        status: mentees.status,
        createdAt: mentees.createdAt,
        updatedAt: mentees.updatedAt,
      })
      .from(mentees)
      .where(eq(mentees.menteeId, menteeId))
      .limit(1);

    if (!mentee) {
      throw new NotFoundError(`Mentee ${menteeId} not found`);
    }

    return mentee;
  }

  async getMenteeByUserId(userId: number): Promise<GetMenteeOutput | null> {
    const [mentee] = await db
      .select({
        menteeId: mentees.menteeId,
        userId: mentees.userId,
        learningGoals: mentees.learningGoals,
        experienceLevel: mentees.experienceLevel,
        preferredMentorType: mentees.preferredMentorType,
        status: mentees.status,
        createdAt: mentees.createdAt,
        updatedAt: mentees.updatedAt,
      })
      .from(mentees)
      .where(eq(mentees.userId, userId))
      .limit(1);

    return mentee || null;
  }

  async updateMentee(
    menteeId: number,
    learningGoals?: string,
    experienceLevel?: string,
    preferredMentorType?: string,
    status?: "active" | "inactive" | "matched",
  ): Promise<UpdateMenteeOutput> {
    const updateData: Partial<typeof mentees.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (learningGoals !== undefined) updateData.learningGoals = learningGoals;
    if (experienceLevel !== undefined)
      updateData.experienceLevel = experienceLevel;
    if (preferredMentorType !== undefined)
      updateData.preferredMentorType = preferredMentorType;
    if (status !== undefined) updateData.status = status;

    const [updated] = await db
      .update(mentees)
      .set(updateData)
      .where(eq(mentees.menteeId, menteeId))
      .returning({
        menteeId: mentees.menteeId,
        userId: mentees.userId,
        learningGoals: mentees.learningGoals,
        experienceLevel: mentees.experienceLevel,
        preferredMentorType: mentees.preferredMentorType,
        status: mentees.status,
        createdAt: mentees.createdAt,
        updatedAt: mentees.updatedAt,
      });

    if (!updated) {
      throw new NotFoundError(`Mentee ${menteeId} not found`);
    }

    return updated;
  }

  async deleteMentee(menteeId: number): Promise<void> {
    const [deleted] = await db
      .delete(mentees)
      .where(eq(mentees.menteeId, menteeId))
      .returning({ menteeId: mentees.menteeId });

    if (!deleted) {
      throw new NotFoundError(`Mentee ${menteeId} not found`);
    }
  }

  async getMenteesByStatus(
    status: "active" | "inactive" | "matched",
  ): Promise<GetMenteeOutput[]> {
    return await db
      .select({
        menteeId: mentees.menteeId,
        userId: mentees.userId,
        learningGoals: mentees.learningGoals,
        experienceLevel: mentees.experienceLevel,
        preferredMentorType: mentees.preferredMentorType,
        status: mentees.status,
        createdAt: mentees.createdAt,
        updatedAt: mentees.updatedAt,
      })
      .from(mentees)
      .where(eq(mentees.status, status));
  }
}
