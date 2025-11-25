import { eq, or } from "drizzle-orm";
import { mentorshipMatches } from "../data/db/schema.js";
import { db } from "../data/db/sql.js";
import type { MenteeRepository } from "../data/repository/mentee-repo.js";
import type { MentorRepository } from "../data/repository/mentor-repo.js";
import type { MentorshipDataOutput } from "../types/mentorship-types.js";

/**
 * Service to handle mentorship data aggregation
 */
export class MentorshipService {
  constructor(
    private mentorRepo: MentorRepository,
    private menteeRepo: MenteeRepository,
  ) {}

  /**
   * Get mentorship data for a user (mentor profile, mentee profile, and matches)
   */
  async getMentorshipData(userId: string): Promise<MentorshipDataOutput> {
    // Get mentor and mentee profiles
    const [mentor, mentee] = await Promise.all([
      this.mentorRepo.getMentorByUserId(userId),
      this.menteeRepo.getMenteeByUserId(userId),
    ]);

    // Get all matches where the user is either the mentor or the requestor (mentee)
    const matches = await db
      .select({
        matchId: mentorshipMatches.matchId,
        requestorUserId: mentorshipMatches.requestorUserId,
        mentorUserId: mentorshipMatches.mentorUserId,
        matchedAt: mentorshipMatches.matchedAt,
      })
      .from(mentorshipMatches)
      .where(
        or(
          eq(mentorshipMatches.mentorUserId, userId),
          eq(mentorshipMatches.requestorUserId, userId),
        ),
      );

    return {
      mentor,
      mentee,
      matches: matches.map((match) => ({
        matchId: match.matchId,
        requestorUserId: match.requestorUserId ?? "",
        mentorUserId: match.mentorUserId ?? "",
        matchedAt: match.matchedAt,
      })),
    };
  }
}
