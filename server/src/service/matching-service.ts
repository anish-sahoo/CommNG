import { eq } from "drizzle-orm";
import { mentees, mentorMatchingRequests, mentors } from "../data/db/schema.js";
import { db } from "../data/db/sql.js";
import log from "../utils/logger.js";

/**
 * Service to handle mentorship matching logic
 */
export class MatchingService {
  // Maximum number of match requests to fan out per trigger
  private static readonly MAX_MATCH_REQUESTS = 10;
  /**
   * Trigger matching process when a mentor is created
   */
  async triggerMatchingForNewMentor(mentorUserId: string): Promise<void> {
    log.info("Triggering matching process for new mentor", { mentorUserId });

    // Find all active mentees who could be matched
    const activeMentees = await db
      .select()
      .from(mentees)
      .where(eq(mentees.status, "active"));

    log.info("Found active mentees for matching", {
      count: activeMentees.length,
    });

    // Pick a random subset of active mentees up to MAX_MATCH_REQUESTS
    const selectedMentees = [...activeMentees]
      .sort(() => Math.random() - 0.5)
      .slice(0, MatchingService.MAX_MATCH_REQUESTS);

    // For each selected mentee, create a matching request
    for (const mentee of selectedMentees) {
      try {
        await this.createMatchingRequest(mentee.userId, mentorUserId);
      } catch (error) {
        log.error("Failed to create matching request", {
          menteeUserId: mentee.userId,
          mentorUserId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  /**
   * Trigger matching process when a mentee is created
   */
  async triggerMatchingForNewMentee(menteeUserId: string): Promise<void> {
    log.info("Triggering matching process for new mentee", { menteeUserId });

    // Find all approved/active mentors who could be matched
    const availableMentors = await db
      .select()
      .from(mentors)
      .where(eq(mentors.status, "approved"));

    log.info("Found available mentors for matching", {
      count: availableMentors.length,
    });

    // Pick a random subset of available mentors up to MAX_MATCH_REQUESTS
    const selectedMentors = [...availableMentors]
      .sort(() => Math.random() - 0.5)
      .slice(0, MatchingService.MAX_MATCH_REQUESTS);

    // For each selected mentor, create a matching request
    for (const mentor of selectedMentors) {
      try {
        await this.createMatchingRequest(menteeUserId, mentor.userId);
      } catch (error) {
        log.error("Failed to create matching request", {
          menteeUserId,
          mentorUserId: mentor.userId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  /**
   * Create a matching request between a mentee and mentor
   */
  private async createMatchingRequest(
    menteeUserId: string,
    mentorUserId: string,
  ): Promise<void> {
    // Check if matching request already exists
    const existingRequest = await db
      .select()
      .from(mentorMatchingRequests)
      .where(eq(mentorMatchingRequests.userId, menteeUserId))
      .limit(1);

    if (existingRequest.length > 0) {
      log.debug("Matching request already exists for mentee", { menteeUserId });
      return;
    }

    // Create new matching request
    await db.insert(mentorMatchingRequests).values({
      userId: menteeUserId,
      requestPreferences: `Auto-generated request for mentor: ${mentorUserId}`,
    });

    log.info("Created matching request", { menteeUserId, mentorUserId });
  }
}
