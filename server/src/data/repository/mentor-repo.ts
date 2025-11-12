import { eq } from "drizzle-orm";
import { ConflictError, NotFoundError } from "../../types/errors.js";
import type {
  CreateMentorOutput,
  GetMentorOutput,
} from "../../types/mentor-types.js";
import { mentors } from "../db/schema.js";
import { db } from "../db/sql.js";

/**
 * Repository to handle database queries/communication related to mentors
 */
export class MentorRepository {
  /**
   * Create a new mentor profile for a user
   * @param userId User ID
   * @param mentorshipPreferences Optional mentorship preferences
   * @param rank Optional rank
   * @param yearsOfService Optional years of service
   * @param eligibilityData Optional eligibility data
   * @param status Mentor status (default: "requested")
   * @returns Created mentor profile
   * @throws ConflictError if profile already exists or creation fails
   */
  async createMentor(
    userId: string,
    mentorshipPreferences?: string,
    rank?: string,
    yearsOfService?: number,
    eligibilityData?: Record<string, unknown>,
    status: "requested" | "approved" | "active" = "requested",
  ): Promise<CreateMentorOutput> {
    // Check if mentor already exists for this user
    const existingMentor = await db
      .select()
      .from(mentors)
      .where(eq(mentors.userId, userId))
      .limit(1);

    if (existingMentor.length > 0) {
      throw new ConflictError("Mentor profile already exists for this user");
    }

    const [created] = await db
      .insert(mentors)
      .values({
        userId,
        mentorshipPreferences,
        rank,
        yearsOfService,
        eligibilityData,
        status,
      })
      .returning({
        mentorId: mentors.mentorId,
        userId: mentors.userId,
        mentorshipPreferences: mentors.mentorshipPreferences,
        rank: mentors.rank,
        yearsOfService: mentors.yearsOfService,
        eligibilityData: mentors.eligibilityData,
        status: mentors.status,
      });

    if (!created) {
      throw new ConflictError("Failed to create mentor profile");
    }

    // Ensure eligibilityData is typed correctly for CreateMentorOutput
    return {
      ...created,
      eligibilityData: created.eligibilityData as Record<string, unknown> | null | undefined,
    };
  }

  /**
   * Get a mentor profile by mentor ID
   * @param mentorId Mentor ID
   * @returns Mentor profile object
   * @throws NotFoundError if mentor not found
   */
  async getMentorById(mentorId: number): Promise<GetMentorOutput> {
    const [mentor] = await db
      .select({
        mentorId: mentors.mentorId,
        userId: mentors.userId,
        mentorshipPreferences: mentors.mentorshipPreferences,
        rank: mentors.rank,
        yearsOfService: mentors.yearsOfService,
        eligibilityData: mentors.eligibilityData,
        status: mentors.status,
      })
      .from(mentors)
      .where(eq(mentors.mentorId, mentorId))
      .limit(1);

    if (!mentor) {
      throw new NotFoundError(`Mentor ${mentorId} not found`);
    }

    return {
      ...mentor,
      eligibilityData: mentor.eligibilityData as
        | Record<string, unknown>
        | null
        | undefined,
    };
  }

  /**
   * Get a mentor profile by user ID
   * @param userId User ID
   * @returns Mentor profile object or null if not found
   */
  async getMentorByUserId(userId: string): Promise<GetMentorOutput | null> {
    const [mentor] = await db
      .select({
        mentorId: mentors.mentorId,
        userId: mentors.userId,
        mentorshipPreferences: mentors.mentorshipPreferences,
        rank: mentors.rank,
        yearsOfService: mentors.yearsOfService,
        eligibilityData: mentors.eligibilityData,
        status: mentors.status,
      })
      .from(mentors)
      .where(eq(mentors.userId, userId))
      .limit(1);

    if (!mentor) {
      return null;
    }

    return {
      ...mentor,
      eligibilityData: mentor.eligibilityData as
        | Record<string, unknown>
        | null
        | undefined,
    };
  }
}
