import {
  HYBRID_ALGORITHM_CTES,
  HYBRID_ALGORITHM_SELECT,
  recommendationQueryWithCTEs,
} from "../data/db/recommendation-queries.js";
import { db } from "../data/db/sql.js";
import { MentorshipEmbeddingRepository } from "../data/repository/mentorship-embedding-repo.js";
import type { CreateMentorshipEmbeddingInput } from "../types/mentorship-embedding-types.js";
import type { SuggestedMentor } from "../types/mentorship-types.js";
import { buildText } from "../utils/embedding.js";
import log from "../utils/logger.js";
import { embeddingService } from "./embedding-service.js";

/**
 * Service to handle mentorship matching logic
 */
export class MatchingService {
  // Maximum number of match requests to fan out per trigger
  static readonly MAX_MATCH_REQUESTS = 10;
  private readonly embeddingRepo = new MentorshipEmbeddingRepository();

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
      log.info(
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

  async generateMentorRecommendations(
    userId: string,
  ): Promise<void> {
    log.info({ userId }, "generate recommendation");
    await db.execute(
      recommendationQueryWithCTEs(
        userId,
        HYBRID_ALGORITHM_CTES,
        HYBRID_ALGORITHM_SELECT,
        MatchingService.MAX_MATCH_REQUESTS,
      ),
    );
  }
}
