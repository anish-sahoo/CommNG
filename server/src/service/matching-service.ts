import { recommendationQuery } from "../data/db/recommendation-queries.js";
import { db } from "../data/db/sql.js";
import { MentorshipEmbeddingRepository } from "../data/repository/mentorship-embedding-repo.js";
import type { CreateMentorshipEmbeddingInput } from "../types/mentorship-embedding-types.js";
import { buildText } from "../utils/embedding.js";
import log from "../utils/logger.js";
import { embeddingService } from "./embedding-service.js";

/**
 * Service to handle mentorship matching logic
 */
export class MatchingService {
  /** Maximum number of match requests to fan out per trigger */
  static readonly MAX_MATCH_REQUESTS = 10;
  private readonly embeddingRepo = new MentorshipEmbeddingRepository();

  /**
   * Embeds the given texts and saves the embeddings for the user.
   * @param userId - The ID of the user.
   * @param userType - The type of the user ('mentor' or 'mentee').
   * @param texts - The texts to embed.
   * @returns A promise that resolves when the embeddings are saved.
   */
  private async embedAndSave(
    userId: string,
    userType: "mentor" | "mentee",
    texts: string[],
  ): Promise<void> {
    const embeddings = await embeddingService.embedBatch(texts);
    const data: CreateMentorshipEmbeddingInput = {
      userId,
      userType,
      whyInterestedEmbedding: embeddings[0],
      ...(userType === "mentor"
        ? { profileEmbedding: embeddings[1] }
        : {
            hopeToGainEmbedding: embeddings[1],
            profileEmbedding: embeddings[2],
          }),
    };
    await this.embeddingRepo.createOrUpdateEmbedding(data);
  }

  /**
   * Creates or updates embeddings for a mentor based on the provided input.
   * @param input - The input data for the mentor.
   * @param input.userId - The ID of the mentor.
   * @param input.whyInterestedResponses - Responses about why interested.
   * @param input.strengths - Strengths of the mentor.
   * @param input.personalInterests - Personal interests.
   * @param input.careerAdvice - Career advice.
   * @returns A promise that resolves when the embeddings are created or updated.
   */
  async createOrUpdateMentorEmbeddings(input: {
    userId: string;
    whyInterestedResponses?: string[] | string | undefined;
    strengths?: string[] | undefined;
    personalInterests?: string | string[] | undefined;
    careerAdvice?: string | undefined;
  }): Promise<void> {
    try {
      const { userId } = input;
      const whyInterestedText = buildText(input.whyInterestedResponses, "");
      const strengthsText = buildText(input.strengths);
      const personalInterestsText = buildText(input.personalInterests);
      const profileText =
        [strengthsText, personalInterestsText, input.careerAdvice]
          .filter(Boolean)
          .join(" ") || "mentor-profile";
      const texts = [whyInterestedText, profileText];
      await this.embedAndSave(userId, "mentor", texts);
      log.info(
        { userId },
        "Created or updated mentor embeddings (match service)",
      );
    } catch (error) {
      log.error(
        { error: error instanceof Error ? error.message : String(error) },
        "Failed to create/update mentor embeddings (match service)",
      );
      throw error;
    }
  }

  /**
   * Creates or updates embeddings for a mentee based on the provided input.
   * @param input - The input data for the mentee.
   * @param input.userId - The ID of the mentee.
   * @param input.learningGoals - Learning goals.
   * @param input.personalInterests - Personal interests.
   * @param input.roleModelInspiration - Role model inspiration.
   * @param input.hopeToGainResponses - Responses about hope to gain.
   * @param input.mentorQualities - Qualities looked for in a mentor.
   * @returns A promise that resolves when the embeddings are created or updated.
   */
  async createOrUpdateMenteeEmbeddings(input: {
    userId: string;
    learningGoals?: string | undefined;
    personalInterests?: string | undefined;
    roleModelInspiration?: string | undefined;
    hopeToGainResponses?: string[] | undefined;
    mentorQualities?: string[] | undefined;
  }): Promise<void> {
    try {
      const { userId } = input;
      const whyInterestedText =
        [input.learningGoals, input.roleModelInspiration]
          .filter(Boolean)
          .join(" ") || "mentee-why-interested";
      const hopeText = buildText(input.hopeToGainResponses, "");
      const profileParts = [
        input.personalInterests,
        input.roleModelInspiration,
        buildText(input.mentorQualities),
      ].filter(Boolean);
      const profileText = profileParts.join(" ") || "mentee-profile";
      const texts = [whyInterestedText, hopeText, profileText];
      await this.embedAndSave(userId, "mentee", texts);
      log.debug(
        { userId },
        "Created or updated mentee embeddings (match service)",
      );
    } catch (error) {
      log.error(
        { error: error instanceof Error ? error.message : String(error) },
        "Failed to create/update mentee embeddings (match service)",
      );
      throw error;
    }
  }

  /**
   * Generates and stores mentor recommendations for the given user.
   * @param userId - The ID of the user to generate recommendations for.
   * @returns A promise that resolves when the recommendations are generated + stored.
   */
  async generateMentorRecommendations(userId: string): Promise<void> {
    log.debug({ userId }, "generate recommendation");
    await db.execute(
      recommendationQuery(userId, MatchingService.MAX_MATCH_REQUESTS),
    );
  }
}
