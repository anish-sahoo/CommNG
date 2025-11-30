import { and, eq, isNull, notInArray, or, sql } from "drizzle-orm";
import {
  mentorRecommendations,
  mentors,
  mentorshipMatches,
} from "../data/db/schema.js";
import { db } from "../data/db/sql.js";
import type { MenteeRepository } from "../data/repository/mentee-repo.js";
import type { MentorRepository } from "../data/repository/mentor-repo.js";
import type {
  CreateMenteeInput,
  GetMenteeOutput,
} from "../types/mentee-types.js";
import type {
  CreateMentorInput,
  GetMentorOutput,
} from "../types/mentor-types.js";
import type {
  MentorshipDataOutput,
  SuggestedMentor,
} from "../types/mentorship-types.js";
import type { MatchingService } from "./matching-service.js";

/**
 * Service to handle mentorship data aggregation
 *
 * NOTE: All mentor and mentee profiles returned from this service (including
 * active mentors, active mentees, and mentor recommendations) are backed by
 * `GetMentorOutput` and `GetMenteeOutput`, which include enriched user profile
 * fields (name, email, phoneNumber, imageFileId, rank, positionType,
 * detailedPosition, detailedRank, location). Callers can rely on those fields
 * being present when a related `users` record exists, without making additional
 * user lookups.
 */
export class MentorshipService {
  constructor(
    private mentorRepo: MentorRepository,
    private menteeRepo: MenteeRepository,
    private matchingService?: MatchingService,
  ) {}

  /**
   * Create a new mentor profile and generate embeddings
   */
  async createMentor(input: CreateMentorInput) {
    const mentor = await this.mentorRepo.createMentor(
      input.userId,
      input.mentorshipPreferences,
      input.yearsOfService,
      input.eligibilityData ?? undefined,
      input.status,
      input.resumeFileId,
      input.strengths,
      input.personalInterests,
      input.whyInterestedResponses,
      input.careerAdvice,
      input.preferredMenteeCareerStages,
      input.preferredMeetingFormat,
      input.hoursPerMonthCommitment,
    );

    if (this.matchingService) {
      await this.matchingService.createOrUpdateMentorEmbeddings({
        userId: input.userId,
        whyInterestedResponses: input.whyInterestedResponses,
        strengths: input.strengths,
        personalInterests: input.personalInterests,
        careerAdvice: input.careerAdvice,
      });
    }

    return mentor;
  }

  /**
   * Create a new mentee profile, generate embeddings, and store mentor recommendations
   */
  async createMentee(input: CreateMenteeInput) {
    await this.menteeRepo.createMentee(
      input.userId,
      input.learningGoals,
      input.experienceLevel,
      input.preferredMentorType,
      input.status,
      input.resumeFileId,
      input.personalInterests,
      input.roleModelInspiration,
      input.hopeToGainResponses,
      input.mentorQualities,
      input.preferredMeetingFormat,
      input.hoursPerMonthCommitment,
    );

    if (this.matchingService) {
      await this.matchingService.createOrUpdateMenteeEmbeddings({
        userId: input.userId,
        learningGoals: input.learningGoals,
        personalInterests: input.personalInterests,
        roleModelInspiration: input.roleModelInspiration,
        hopeToGainResponses: input.hopeToGainResponses,
        mentorQualities: input.mentorQualities,
      });

      // Generate and store recommendations
      await this.matchingService.generateMentorRecommendations(input.userId);
    }
  }

  /**
   * Request mentorship from a specific mentor
   */
  async requestMentorship(
    menteeUserId: string,
    mentorUserId: string,
    message?: string,
  ) {
    // Check if request already exists
    const existing = await db
      .select()
      .from(mentorshipMatches)
      .where(
        and(
          eq(mentorshipMatches.requestorUserId, menteeUserId),
          eq(mentorshipMatches.mentorUserId, mentorUserId),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      throw new Error("Mentorship request already exists");
    }

    await db.insert(mentorshipMatches).values({
      requestorUserId: menteeUserId,
      mentorUserId,
      status: "pending",
      message,
    });
  }

  /**
   * Decline a mentorship request (mentor action)
   */
  async declineMentorshipRequest(matchId: number, mentorUserId: string) {
    // Verify the mentor owns this match
    const match = await db
      .select()
      .from(mentorshipMatches)
      .where(
        and(
          eq(mentorshipMatches.matchId, matchId),
          eq(mentorshipMatches.mentorUserId, mentorUserId),
          eq(mentorshipMatches.status, "pending"),
        ),
      )
      .limit(1);

    if (match.length === 0) {
      throw new Error(
        "Mentorship request not found or not authorized to decline",
      );
    }

    await db
      .update(mentorshipMatches)
      .set({ status: "declined" })
      .where(eq(mentorshipMatches.matchId, matchId));
  }

  /**
   * Accept a mentorship request (mentor action)
   */
  async acceptMentorshipRequest(matchId: number, mentorUserId: string) {
    // Verify the mentor owns this match and it's pending
    const match = await db
      .select()
      .from(mentorshipMatches)
      .where(
        and(
          eq(mentorshipMatches.matchId, matchId),
          eq(mentorshipMatches.mentorUserId, mentorUserId),
          eq(mentorshipMatches.status, "pending"),
        ),
      )
      .limit(1);

    if (match.length === 0) {
      throw new Error(
        "Mentorship request not found or not authorized to accept",
      );
    }

    await db
      .update(mentorshipMatches)
      .set({ status: "accepted", matchedAt: new Date() })
      .where(eq(mentorshipMatches.matchId, matchId));
  }

  /**
   * Build mentee data including recommendations
   */
  private async buildMenteeData(
    userId: string,
    menteeData: {
      mentee: GetMenteeOutput | null;
      activeMentors: GetMentorOutput[];
    },
  ): Promise<{
    profile: GetMenteeOutput | null;
    activeMentors: GetMentorOutput[];
    mentorRecommendations: SuggestedMentor[];
  } | null> {
    if (!menteeData.mentee) return null;

    const allMatches = await db
      .select({
        matchId: mentorshipMatches.matchId,
        requestorUserId: mentorshipMatches.requestorUserId,
        mentorUserId: mentorshipMatches.mentorUserId,
        status: mentorshipMatches.status,
        matchedAt: mentorshipMatches.matchedAt,
        message: mentorshipMatches.message,
      })
      .from(mentorshipMatches)
      .where(
        or(
          eq(mentorshipMatches.mentorUserId, userId),
          eq(mentorshipMatches.requestorUserId, userId),
        ),
      );

    const userRecommendations = await db
      .select()
      .from(mentorRecommendations)
      .where(
        and(
          eq(mentorRecommendations.userId, userId),
          or(
            isNull(mentorRecommendations.expiresAt),
            sql`${mentorRecommendations.expiresAt} > NOW()`,
          ),
        ),
      )
      .limit(1);
    const pendingMentorIds = allMatches
      .filter(
        (match) =>
          match.requestorUserId === userId && match.status === "pending",
      )
      .map((match) => match.mentorUserId)
      .filter((id): id is string => id !== null);

    const requestedMentorIds = new Set(
      allMatches
        .filter((match) => match.requestorUserId === userId)
        .map((match) => match.mentorUserId)
        .filter((id): id is string => id !== null),
    );

    const suggestedMentorRecords = await db
      .select({ userId: mentors.userId })
      .from(mentors)
      .where(
        and(
          eq(mentors.status, "approved"),
          requestedMentorIds.size > 0
            ? notInArray(mentors.userId, Array.from(requestedMentorIds))
            : undefined,
        ),
      )
      .limit(10);

    const suggestedMentorIds = suggestedMentorRecords.map((r) => r.userId);
    let recommendedMentorIds: string[] = [];
    if (userRecommendations.length > 0) {
      const rec = userRecommendations[0];
      if (rec) {
        recommendedMentorIds = rec.recommendedMentorIds.filter(
          (id) => !requestedMentorIds.has(id),
        );
      }
    }

    const allMentorIds = Array.from(
      new Set([
        ...pendingMentorIds,
        ...suggestedMentorIds,
        ...recommendedMentorIds,
      ]),
    );
    const mentorsMap = new Map(
      (await this.mentorRepo.getMentorsByUserIds(allMentorIds)).map((m) => [
        m.userId,
        m,
      ]),
    );

    const mentorRecs: SuggestedMentor[] = [];
    for (const mentor of menteeData.activeMentors) {
      mentorRecs.push({
        mentor,
        status: "active",
      });
    }
    for (const mentorId of pendingMentorIds) {
      const mentor = mentorsMap.get(mentorId);
      if (mentor) {
        mentorRecs.push({
          mentor,
          status: "pending",
        });
      }
    }
    for (const mentorId of suggestedMentorIds) {
      const mentor = mentorsMap.get(mentorId);
      if (mentor) {
        mentorRecs.push({
          mentor,
          status: "suggested",
        });
      }
    }
    for (const mentorId of recommendedMentorIds) {
      const mentor = mentorsMap.get(mentorId);
      if (mentor) {
        mentorRecs.push({
          mentor,
          status: "suggested",
        });
      }
    }

    return {
      profile: menteeData.mentee,
      // Note: activeMentors from getMenteeWithActiveMentors include enriched user profile fields
      // (name, email, phoneNumber, imageFileId, rank, positionType, etc.)
      activeMentors: menteeData.activeMentors.map((m) => ({
        ...m,
        strengths: m.strengths ?? [],
      })),
      // Note: mentorRecommendations use mentors from getMentorsByUserIds which include enriched fields
      mentorRecommendations: mentorRecs,
    };
  }

  async getMentorshipData(userId: string): Promise<MentorshipDataOutput> {
    // Get mentor and mentee profiles with their active matches
    const [mentorData, menteeData] = await Promise.all([
      this.mentorRepo.getMentorWithActiveMentees(userId),
      this.menteeRepo.getMenteeWithActiveMentors(userId),
    ]);

    const result: MentorshipDataOutput = {
      mentor: null,
      mentee: null,
    };

    if (mentorData.mentor) {
      result.mentor = {
        profile: mentorData.mentor,
        activeMentees: mentorData.activeMentees,
      };
    }

    const menteeResult = await this.buildMenteeData(userId, menteeData);
    if (menteeResult) {
      result.mentee = menteeResult;
    }

    return result;
  }
}
