import { eq } from "drizzle-orm";
import { mentees } from "../../data/db/schema.js";
import { db } from "../../data/db/sql.js";
import { ConflictError, NotFoundError } from "../../types/errors.js";
import type {
  CreateMenteeOutput,
  GetMenteeOutput,
  UpdateMenteeOutput,
} from "../../types/mentee-types.js";

/**
 * Repository to handle database queries/communication related to mentees
 */
export class MenteeRepository {
  /**
   * Create a new mentee profile for a user
   * @param userId User ID
   * @param learningGoals Optional learning goals
   * @param experienceLevel Optional experience level
   * @param preferredMentorType Optional preferred mentor type
   * @param status Mentee status (default: "active")
   * @param resumeFileId Optional resume file ID
   * @param personalInterests Optional personal interests
   * @param roleModelInspiration Optional text response to role model question
   * @param hopeToGainResponses Optional ordered responses to hope to gain question
   * @param mentorQualities Optional array of mentor qualities
   * @param preferredMeetingFormat Optional preferred meeting format
   * @param hoursPerMonthCommitment Optional hours per month commitment
   * @returns Created mentee profile
   * @throws ConflictError if profile already exists or creation fails
   */
  async createMentee(
    userId: string,
    learningGoals?: string,
    experienceLevel?: string,
    preferredMentorType?: string,
    status: "active" | "inactive" | "matched" = "active",
    resumeFileId?: string,
    personalInterests?: string,
    roleModelInspiration?: string,
    hopeToGainResponses?: string[],
    mentorQualities?: string[],
    preferredMeetingFormat?:
      | "in-person"
      | "virtual"
      | "hybrid"
      | "no-preference",
    hoursPerMonthCommitment?: number,
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
        resumeFileId,
        personalInterests,
        roleModelInspiration,
        hopeToGainResponses,
        mentorQualities,
        preferredMeetingFormat,
        hoursPerMonthCommitment,
      })
      .returning({
        menteeId: mentees.menteeId,
        userId: mentees.userId,
        learningGoals: mentees.learningGoals,
        experienceLevel: mentees.experienceLevel,
        preferredMentorType: mentees.preferredMentorType,
        status: mentees.status,
        resumeFileId: mentees.resumeFileId,
        personalInterests: mentees.personalInterests,
        roleModelInspiration: mentees.roleModelInspiration,
        hopeToGainResponses: mentees.hopeToGainResponses,
        mentorQualities: mentees.mentorQualities,
        preferredMeetingFormat: mentees.preferredMeetingFormat,
        hoursPerMonthCommitment: mentees.hoursPerMonthCommitment,
        createdAt: mentees.createdAt,
        updatedAt: mentees.updatedAt,
      });

    if (!created) {
      throw new ConflictError("Failed to create mentee profile");
    }

    return created;
  }

  /**
   * Get a mentee profile by mentee ID
   * @param menteeId Mentee ID
   * @returns Mentee profile object
   * @throws NotFoundError if mentee not found
   */
  async getMenteeById(menteeId: number): Promise<GetMenteeOutput> {
    const [mentee] = await db
      .select({
        menteeId: mentees.menteeId,
        userId: mentees.userId,
        learningGoals: mentees.learningGoals,
        experienceLevel: mentees.experienceLevel,
        preferredMentorType: mentees.preferredMentorType,
        status: mentees.status,
        resumeFileId: mentees.resumeFileId,
        personalInterests: mentees.personalInterests,
        roleModelInspiration: mentees.roleModelInspiration,
        hopeToGainResponses: mentees.hopeToGainResponses,
        mentorQualities: mentees.mentorQualities,
        preferredMeetingFormat: mentees.preferredMeetingFormat,
        hoursPerMonthCommitment: mentees.hoursPerMonthCommitment,
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

  /**
   * Get a mentee profile by user ID
   * @param userId User ID
   * @returns Mentee profile object or null if not found
   */
  async getMenteeByUserId(userId: string): Promise<GetMenteeOutput | null> {
    const [mentee] = await db
      .select({
        menteeId: mentees.menteeId,
        userId: mentees.userId,
        learningGoals: mentees.learningGoals,
        experienceLevel: mentees.experienceLevel,
        preferredMentorType: mentees.preferredMentorType,
        status: mentees.status,
        resumeFileId: mentees.resumeFileId,
        personalInterests: mentees.personalInterests,
        roleModelInspiration: mentees.roleModelInspiration,
        hopeToGainResponses: mentees.hopeToGainResponses,
        mentorQualities: mentees.mentorQualities,
        preferredMeetingFormat: mentees.preferredMeetingFormat,
        hoursPerMonthCommitment: mentees.hoursPerMonthCommitment,
        createdAt: mentees.createdAt,
        updatedAt: mentees.updatedAt,
      })
      .from(mentees)
      .where(eq(mentees.userId, userId))
      .limit(1);

    return mentee || null;
  }

  /**
   * Update a mentee profile
   * @param menteeId Mentee ID
   * @param learningGoals Optional learning goals
   * @param experienceLevel Optional experience level
   * @param preferredMentorType Optional preferred mentor type
   * @param status Optional mentee status
   * @param resumeFileId Optional resume file ID
   * @param personalInterests Optional personal interests
   * @param roleModelInspiration Optional role model inspiration
   * @param hopeToGainResponses Optional hope to gain responses
   * @param mentorQualities Optional mentor qualities
   * @param preferredMeetingFormat Optional preferred meeting format
   * @param hoursPerMonthCommitment Optional hours per month commitment
   * @returns Updated mentee profile
   * @throws NotFoundError if mentee not found
   */
  async updateMentee(
    menteeId: number,
    learningGoals?: string,
    experienceLevel?: string,
    preferredMentorType?: string,
    status?: "active" | "inactive" | "matched",
    resumeFileId?: string,
    personalInterests?: string,
    roleModelInspiration?: string,
    hopeToGainResponses?: string[],
    mentorQualities?: string[],
    preferredMeetingFormat?:
      | "in-person"
      | "virtual"
      | "hybrid"
      | "no-preference",
    hoursPerMonthCommitment?: number,
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
    if (resumeFileId !== undefined) updateData.resumeFileId = resumeFileId;
    if (personalInterests !== undefined)
      updateData.personalInterests = personalInterests;
    if (roleModelInspiration !== undefined)
      updateData.roleModelInspiration = roleModelInspiration;
    if (hopeToGainResponses !== undefined)
      updateData.hopeToGainResponses = hopeToGainResponses;
    if (mentorQualities !== undefined)
      updateData.mentorQualities = mentorQualities;
    if (preferredMeetingFormat !== undefined)
      updateData.preferredMeetingFormat = preferredMeetingFormat;
    if (hoursPerMonthCommitment !== undefined)
      updateData.hoursPerMonthCommitment = hoursPerMonthCommitment;

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
        resumeFileId: mentees.resumeFileId,
        personalInterests: mentees.personalInterests,
        roleModelInspiration: mentees.roleModelInspiration,
        hopeToGainResponses: mentees.hopeToGainResponses,
        mentorQualities: mentees.mentorQualities,
        preferredMeetingFormat: mentees.preferredMeetingFormat,
        hoursPerMonthCommitment: mentees.hoursPerMonthCommitment,
        createdAt: mentees.createdAt,
        updatedAt: mentees.updatedAt,
      });

    if (!updated) {
      throw new NotFoundError(`Mentee ${menteeId} not found`);
    }

    return updated;
  }

  /**
   * Delete a mentee profile by mentee ID
   * @param menteeId Mentee ID
   * @throws NotFoundError if mentee not found
   */
  async deleteMentee(menteeId: number): Promise<void> {
    const [deleted] = await db
      .delete(mentees)
      .where(eq(mentees.menteeId, menteeId))
      .returning({ menteeId: mentees.menteeId });

    if (!deleted) {
      throw new NotFoundError(`Mentee ${menteeId} not found`);
    }
  }

  /**
   * Get all mentees by status
   * @param status Mentee status
   * @returns Array of mentee profiles
   */
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
        resumeFileId: mentees.resumeFileId,
        personalInterests: mentees.personalInterests,
        roleModelInspiration: mentees.roleModelInspiration,
        hopeToGainResponses: mentees.hopeToGainResponses,
        mentorQualities: mentees.mentorQualities,
        preferredMeetingFormat: mentees.preferredMeetingFormat,
        hoursPerMonthCommitment: mentees.hoursPerMonthCommitment,
        createdAt: mentees.createdAt,
        updatedAt: mentees.updatedAt,
      })
      .from(mentees)
      .where(eq(mentees.status, status));
  }
}
