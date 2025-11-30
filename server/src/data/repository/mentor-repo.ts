import { and, eq, inArray } from "drizzle-orm";
import {
  mentees,
  mentors,
  mentorshipMatches,
  users,
} from "../../data/db/schema.js";
import { db } from "../../data/db/sql.js";
import { ConflictError, NotFoundError } from "../../types/errors.js";
import type { GetMenteeOutput } from "../../types/mentee-types.js";
import type {
  CreateMentorOutput,
  GetMentorOutput,
} from "../../types/mentor-types.js";
import type { PendingMenteeRequest } from "../../types/mentorship-types.js";

/**
 * Repository to handle database queries/communication related to mentors
 */
export class MentorRepository {
  /**
   * Create a new mentor profile for a user
   * @param userId User ID
   * @param mentorshipPreferences Optional mentorship preferences
   * @param yearsOfService Optional years of service
   * @param eligibilityData Optional eligibility data
   * @param status Mentor status (default: "requested")
   * @param resumeFileId Optional resume file ID
   * @param strengths Optional array of up to 5 strengths
   * @param personalInterests Optional personal interests
   * @param whyInterestedResponses Optional ordered responses to why interested
   * @param careerAdvice Optional text response to career advice question
   * @param preferredMenteeCareerStages Optional preferred mentee career stages
   * @param preferredMeetingFormat Optional preferred meeting format
   * @param hoursPerMonthCommitment Optional hours per month commitment
   * @returns Created mentor profile
   * @throws ConflictError if profile already exists or creation fails
   */
  async createMentor(
    userId: string,
    mentorshipPreferences?: string,
    yearsOfService?: number,
    eligibilityData?: Record<string, unknown>,
    status: "requested" | "approved" | "active" = "requested",
    resumeFileId?: string,
    strengths?: string[],
    personalInterests?: string,
    whyInterestedResponses?: string[],
    careerAdvice?: string,
    preferredMenteeCareerStages?: string[],
    preferredMeetingFormat?:
      | "in-person"
      | "virtual"
      | "hybrid"
      | "no-preference",
    hoursPerMonthCommitment?: number,
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
        yearsOfService,
        eligibilityData,
        status,
        resumeFileId,
        strengths,
        personalInterests,
        whyInterestedResponses,
        careerAdvice,
        preferredMenteeCareerStages,
        preferredMeetingFormat,
        hoursPerMonthCommitment,
      })
      .returning({
        mentorId: mentors.mentorId,
        userId: mentors.userId,
        mentorshipPreferences: mentors.mentorshipPreferences,
        yearsOfService: mentors.yearsOfService,
        eligibilityData: mentors.eligibilityData,
        status: mentors.status,
        resumeFileId: mentors.resumeFileId,
        strengths: mentors.strengths,
        personalInterests: mentors.personalInterests,
        whyInterestedResponses: mentors.whyInterestedResponses,
        careerAdvice: mentors.careerAdvice,
        preferredMenteeCareerStages: mentors.preferredMenteeCareerStages,
        preferredMeetingFormat: mentors.preferredMeetingFormat,
        hoursPerMonthCommitment: mentors.hoursPerMonthCommitment,
        createdAt: mentors.createdAt,
        updatedAt: mentors.updatedAt,
      });

    if (!created) {
      throw new ConflictError("Failed to create mentor profile");
    }

    return created;
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
        // Mentor profile fields
        mentorshipPreferences: mentors.mentorshipPreferences,
        yearsOfService: mentors.yearsOfService,
        eligibilityData: mentors.eligibilityData,
        status: mentors.status,
        resumeFileId: mentors.resumeFileId,
        strengths: mentors.strengths,
        personalInterests: mentors.personalInterests,
        whyInterestedResponses: mentors.whyInterestedResponses,
        careerAdvice: mentors.careerAdvice,
        preferredMenteeCareerStages: mentors.preferredMenteeCareerStages,
        preferredMeetingFormat: mentors.preferredMeetingFormat,
        hoursPerMonthCommitment: mentors.hoursPerMonthCommitment,
        createdAt: mentors.createdAt,
        updatedAt: mentors.updatedAt,
        // Enriched user profile fields
        name: users.name,
        email: users.email,
        phoneNumber: users.phoneNumber,
        imageFileId: users.image,
        rank: users.rank,
        positionType: users.positionType,
        detailedPosition: users.detailedPosition,
        detailedRank: users.detailedRank,
        location: users.location,
      })
      .from(mentors)
      .innerJoin(users, eq(users.id, mentors.userId))
      .where(eq(mentors.mentorId, mentorId))
      .limit(1);

    if (!mentor) {
      throw new NotFoundError(`Mentor ${mentorId} not found`);
    }

    return mentor;
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
        // Mentor profile fields
        mentorshipPreferences: mentors.mentorshipPreferences,
        yearsOfService: mentors.yearsOfService,
        eligibilityData: mentors.eligibilityData,
        status: mentors.status,
        resumeFileId: mentors.resumeFileId,
        strengths: mentors.strengths,
        personalInterests: mentors.personalInterests,
        whyInterestedResponses: mentors.whyInterestedResponses,
        careerAdvice: mentors.careerAdvice,
        preferredMenteeCareerStages: mentors.preferredMenteeCareerStages,
        preferredMeetingFormat: mentors.preferredMeetingFormat,
        hoursPerMonthCommitment: mentors.hoursPerMonthCommitment,
        createdAt: mentors.createdAt,
        updatedAt: mentors.updatedAt,
        // Enriched user profile fields
        name: users.name,
        email: users.email,
        phoneNumber: users.phoneNumber,
        imageFileId: users.image,
        rank: users.rank,
        positionType: users.positionType,
        detailedPosition: users.detailedPosition,
        detailedRank: users.detailedRank,
        location: users.location,
      })
      .from(mentors)
      .innerJoin(users, eq(users.id, mentors.userId))
      .where(eq(mentors.userId, userId))
      .limit(1);

    if (!mentor) {
      return null;
    }

    return mentor;
  }

  /**
   * Get pending mentee requests for a mentor
   */
  async getPendingMenteeRequests(
    userId: string,
  ): Promise<PendingMenteeRequest[]> {
    const pendingRows = await db
      .select({
        matchId: mentorshipMatches.matchId,
        status: mentorshipMatches.status,
        matchedAt: mentorshipMatches.matchedAt,
        // Mentee profile fields
        menteeId: mentees.menteeId,
        menteeUserId: mentees.userId,
        learningGoals: mentees.learningGoals,
        experienceLevel: mentees.experienceLevel,
        preferredMentorType: mentees.preferredMentorType,
        menteeStatus: mentees.status,
        resumeFileId: mentees.resumeFileId,
        personalInterests: mentees.personalInterests,
        roleModelInspiration: mentees.roleModelInspiration,
        hopeToGainResponses: mentees.hopeToGainResponses,
        mentorQualities: mentees.mentorQualities,
        preferredMeetingFormat: mentees.preferredMeetingFormat,
        hoursPerMonthCommitment: mentees.hoursPerMonthCommitment,
        menteeCreatedAt: mentees.createdAt,
        menteeUpdatedAt: mentees.updatedAt,
        // Enriched user profile fields
        name: users.name,
        email: users.email,
        phoneNumber: users.phoneNumber,
        imageFileId: users.image,
        rank: users.rank,
        positionType: users.positionType,
        detailedPosition: users.detailedPosition,
        detailedRank: users.detailedRank,
        location: users.location,
      })
      .from(mentorshipMatches)
      .innerJoin(mentees, eq(mentees.userId, mentorshipMatches.requestorUserId))
      .innerJoin(users, eq(users.id, mentees.userId))
      .where(
        and(
          eq(mentorshipMatches.mentorUserId, userId),
          eq(mentorshipMatches.status, "pending"),
        ),
      );

    return pendingRows.map((row) => ({
      matchId: row.matchId,
      status: row.status,
      matchedAt: row.matchedAt,
      mentee: {
        menteeId: row.menteeId,
        userId: row.menteeUserId,
        learningGoals: row.learningGoals,
        experienceLevel: row.experienceLevel,
        preferredMentorType: row.preferredMentorType,
        status: row.menteeStatus,
        resumeFileId: row.resumeFileId,
        personalInterests: row.personalInterests,
        roleModelInspiration: row.roleModelInspiration,
        hopeToGainResponses: row.hopeToGainResponses,
        mentorQualities: row.mentorQualities,
        preferredMeetingFormat: row.preferredMeetingFormat,
        hoursPerMonthCommitment: row.hoursPerMonthCommitment,
        createdAt: row.menteeCreatedAt,
        updatedAt: row.menteeUpdatedAt,
        name: row.name,
        email: row.email,
        phoneNumber: row.phoneNumber,
        imageFileId: row.imageFileId,
        rank: row.rank,
        positionType: row.positionType,
        detailedPosition: row.detailedPosition,
        detailedRank: row.detailedRank,
        location: row.location,
      },
    }));
  }

  /**
   * Get mentors by a list of user IDs
   * @param userIds Array of user IDs
   * @returns Array of mentor profiles
   */
  async getMentorsByUserIds(userIds: string[]): Promise<GetMentorOutput[]> {
    if (userIds.length === 0) return [];

    return await db
      .select({
        mentorId: mentors.mentorId,
        userId: mentors.userId,
        // Mentor profile fields
        mentorshipPreferences: mentors.mentorshipPreferences,
        yearsOfService: mentors.yearsOfService,
        eligibilityData: mentors.eligibilityData,
        status: mentors.status,
        resumeFileId: mentors.resumeFileId,
        strengths: mentors.strengths,
        personalInterests: mentors.personalInterests,
        whyInterestedResponses: mentors.whyInterestedResponses,
        careerAdvice: mentors.careerAdvice,
        preferredMenteeCareerStages: mentors.preferredMenteeCareerStages,
        preferredMeetingFormat: mentors.preferredMeetingFormat,
        hoursPerMonthCommitment: mentors.hoursPerMonthCommitment,
        createdAt: mentors.createdAt,
        updatedAt: mentors.updatedAt,
        // Enriched user profile fields
        name: users.name,
        email: users.email,
        phoneNumber: users.phoneNumber,
        imageFileId: users.image,
        rank: users.rank,
        positionType: users.positionType,
        detailedPosition: users.detailedPosition,
        detailedRank: users.detailedRank,
        location: users.location,
      })
      .from(mentors)
      .innerJoin(users, eq(users.id, mentors.userId))
      .where(inArray(mentors.userId, userIds));
  }

  /**
   * Get mentor profile with their active (matched) mentees
   * @param userId Mentor user ID
   * @returns Object with mentor profile and array of active mentees
   */
  async getMentorWithActiveMentees(userId: string): Promise<{
    mentor: GetMentorOutput | null;
    activeMentees: GetMenteeOutput[];
  }> {
    // Get mentor profile
    const mentor = await this.getMentorByUserId(userId);

    // Get active mentees via join
    const activeMentees = await db
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
        // Enriched user profile fields
        name: users.name,
        email: users.email,
        phoneNumber: users.phoneNumber,
        imageFileId: users.image,
        rank: users.rank,
        positionType: users.positionType,
        detailedPosition: users.detailedPosition,
        detailedRank: users.detailedRank,
        location: users.location,
      })
      .from(mentorshipMatches)
      .innerJoin(mentees, eq(mentees.userId, mentorshipMatches.requestorUserId))
      .innerJoin(users, eq(users.id, mentees.userId))
      .where(
        and(
          eq(mentorshipMatches.mentorUserId, userId),
          eq(mentorshipMatches.status, "accepted"),
        ),
      );

    return { mentor, activeMentees };
  }
}
