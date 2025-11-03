import { eq } from "drizzle-orm";
import { NotFoundError } from "../../types/errors.js";
import type { GetMentorOutput } from "../../types/mentor-types.js";
import { mentors } from "../db/schema.js";
import { db } from "../db/sql.js";

/**
 * Repository to handle database queries related to mentors
 */
export class MentorRepository {
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
