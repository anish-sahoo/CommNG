import { eq, sql } from "drizzle-orm";
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
    log.info({ mentorUserId }, "Triggering matching process for new mentor");

    // Find a random subset of active mentees up to MAX_MATCH_REQUESTS
    const selectedMentees = await db
      .select()
      .from(mentees)
      .where(eq(mentees.status, "active"))
      .orderBy(sql`RANDOM()`)
      .limit(MatchingService.MAX_MATCH_REQUESTS);

    log.info({
      count: selectedMentees.length,
    }, "Found active mentees for matching");

    // For each selected mentee, create a matching request
    const failedMenteeUserIds: string[] = [];
    for (const mentee of selectedMentees) {
      try {
        await this.createMatchingRequest(mentee.userId, mentorUserId);
      } catch (_error) {
        failedMenteeUserIds.push(mentee.userId);
      }
    }

    if (failedMenteeUserIds.length > 0) {
      log.error({
        failedMenteeUserIds,
        mentorUserId,
      }, "Failed to create matching requests");
    }
  }

  /**
   * Trigger matching process when a mentee is created
   */
  async triggerMatchingForNewMentee(menteeUserId: string): Promise<void> {
    log.info({ menteeUserId }, "Triggering matching process for new mentee");

    // Find a random subset of available mentors up to MAX_MATCH_REQUESTS
    const selectedMentors = await db
      .select()
      .from(mentors)
      .where(eq(mentors.status, "approved"))
      .orderBy(sql`RANDOM()`)
      .limit(MatchingService.MAX_MATCH_REQUESTS);

    log.info({
      count: selectedMentors.length,
    }, "Found available mentors for matching");

    // For each selected mentor, create a matching request
    const failedMentorUserIds: string[] = [];
    for (const mentor of selectedMentors) {
      try {
        await this.createMatchingRequest(menteeUserId, mentor.userId);
      } catch (_error) {
        failedMentorUserIds.push(mentor.userId);
      }
    }

    if (failedMentorUserIds.length > 0) {
      log.error({
        menteeUserId,
        failedMentorUserIds,
      }, "Failed to create matching requests");
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
      log.debug({ menteeUserId }, "Matching request already exists for mentee");
      return;
    }

    // Create new matching request
    await db.insert(mentorMatchingRequests).values({
      userId: menteeUserId,
      requestPreferences: `Auto-generated request for mentor: ${mentorUserId}`,
    });

    log.info({ menteeUserId, mentorUserId }, "Created matching request");
  }
}
