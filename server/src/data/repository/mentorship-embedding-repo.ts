import { and, eq } from "drizzle-orm";
import { mentorshipEmbeddings } from "../../data/db/schema.js";
import { db } from "../../data/db/sql.js";
import { ConflictError, NotFoundError } from "../../types/errors.js";
import type {
  CreateMentorshipEmbeddingInput,
  CreateMentorshipEmbeddingOutput,
  GetMentorshipEmbeddingInput,
  GetMentorshipEmbeddingOutput,
  UpdateMentorshipEmbeddingInput,
  UpdateMentorshipEmbeddingOutput,
} from "../../types/mentorship-embedding-types.js";

/**
 * Repository to handle database queries/communication related to mentorship embeddings
 */
export class MentorshipEmbeddingRepository {
  /**
   * Create or update embeddings for a user
   * @param input Embedding input data
   * @returns Created or updated embedding record
   * @throws ConflictError if creation fails
   */
  async createOrUpdateEmbedding(
    input: CreateMentorshipEmbeddingInput,
  ): Promise<CreateMentorshipEmbeddingOutput> {
    // Check if embedding already exists for this user and type
    const existing = await db
      .select()
      .from(mentorshipEmbeddings)
      .where(
        and(
          eq(mentorshipEmbeddings.userId, input.userId),
          eq(mentorshipEmbeddings.userType, input.userType),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      // Update existing embedding
      const [updated] = await db
        .update(mentorshipEmbeddings)
        .set({
          whyInterestedEmbedding: input.whyInterestedEmbedding ?? undefined,
          hopeToGainEmbedding: input.hopeToGainEmbedding ?? undefined,
          profileEmbedding: input.profileEmbedding ?? undefined,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(mentorshipEmbeddings.userId, input.userId),
            eq(mentorshipEmbeddings.userType, input.userType),
          ),
        )
        .returning({
          embeddingId: mentorshipEmbeddings.embeddingId,
          userId: mentorshipEmbeddings.userId,
          userType: mentorshipEmbeddings.userType,
          whyInterestedEmbedding: mentorshipEmbeddings.whyInterestedEmbedding,
          hopeToGainEmbedding: mentorshipEmbeddings.hopeToGainEmbedding,
          profileEmbedding: mentorshipEmbeddings.profileEmbedding,
          createdAt: mentorshipEmbeddings.createdAt,
          updatedAt: mentorshipEmbeddings.updatedAt,
        });

      if (!updated) {
        throw new ConflictError("Failed to update embedding");
      }

      return updated as unknown as CreateMentorshipEmbeddingOutput;
    }

    // Create new embedding
    const [created] = await db
      .insert(mentorshipEmbeddings)
      .values({
        userId: input.userId,
        userType: input.userType,
        whyInterestedEmbedding: input.whyInterestedEmbedding ?? undefined,
        hopeToGainEmbedding: input.hopeToGainEmbedding ?? undefined,
        profileEmbedding: input.profileEmbedding ?? undefined,
      })
      .returning({
        embeddingId: mentorshipEmbeddings.embeddingId,
        userId: mentorshipEmbeddings.userId,
        userType: mentorshipEmbeddings.userType,
        whyInterestedEmbedding: mentorshipEmbeddings.whyInterestedEmbedding,
        hopeToGainEmbedding: mentorshipEmbeddings.hopeToGainEmbedding,
        profileEmbedding: mentorshipEmbeddings.profileEmbedding,
        createdAt: mentorshipEmbeddings.createdAt,
        updatedAt: mentorshipEmbeddings.updatedAt,
      });

    if (!created) {
      throw new ConflictError("Failed to create embedding");
    }

    return created as unknown as CreateMentorshipEmbeddingOutput;
  }

  /**
   * Get embeddings for a user by user ID and type
   * @param input Get embedding input (userId and userType)
   * @returns Embedding record or null if not found
   */
  async getEmbedding(
    input: GetMentorshipEmbeddingInput,
  ): Promise<GetMentorshipEmbeddingOutput | null> {
    const [embedding] = await db
      .select({
        embeddingId: mentorshipEmbeddings.embeddingId,
        userId: mentorshipEmbeddings.userId,
        userType: mentorshipEmbeddings.userType,
        whyInterestedEmbedding: mentorshipEmbeddings.whyInterestedEmbedding,
        hopeToGainEmbedding: mentorshipEmbeddings.hopeToGainEmbedding,
        profileEmbedding: mentorshipEmbeddings.profileEmbedding,
        createdAt: mentorshipEmbeddings.createdAt,
        updatedAt: mentorshipEmbeddings.updatedAt,
      })
      .from(mentorshipEmbeddings)
      .where(
        and(
          eq(mentorshipEmbeddings.userId, input.userId),
          eq(mentorshipEmbeddings.userType, input.userType),
        ),
      )
      .limit(1);

    return embedding
      ? (embedding as unknown as GetMentorshipEmbeddingOutput)
      : null;
  }

  /**
   * Update embeddings for a user
   * @param input Update embedding input data
   * @returns Updated embedding record
   * @throws NotFoundError if embedding not found
   */
  async updateEmbedding(
    input: UpdateMentorshipEmbeddingInput,
  ): Promise<UpdateMentorshipEmbeddingOutput> {
    const updateData: Partial<typeof mentorshipEmbeddings.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (input.whyInterestedEmbedding !== undefined) {
      updateData.whyInterestedEmbedding = input.whyInterestedEmbedding;
    }
    if (input.hopeToGainEmbedding !== undefined) {
      updateData.hopeToGainEmbedding = input.hopeToGainEmbedding;
    }
    if (input.profileEmbedding !== undefined) {
      updateData.profileEmbedding = input.profileEmbedding;
    }

    const [updated] = await db
      .update(mentorshipEmbeddings)
      .set(updateData)
      .where(
        and(
          eq(mentorshipEmbeddings.userId, input.userId),
          eq(mentorshipEmbeddings.userType, input.userType),
        ),
      )
      .returning({
        embeddingId: mentorshipEmbeddings.embeddingId,
        userId: mentorshipEmbeddings.userId,
        userType: mentorshipEmbeddings.userType,
        whyInterestedEmbedding: mentorshipEmbeddings.whyInterestedEmbedding,
        hopeToGainEmbedding: mentorshipEmbeddings.hopeToGainEmbedding,
        profileEmbedding: mentorshipEmbeddings.profileEmbedding,
        createdAt: mentorshipEmbeddings.createdAt,
        updatedAt: mentorshipEmbeddings.updatedAt,
      });

    if (!updated) {
      throw new NotFoundError(
        `Embedding not found for user ${input.userId} with type ${input.userType}`,
      );
    }

    return updated as unknown as UpdateMentorshipEmbeddingOutput;
  }

  /**
   * Delete embeddings for a user by user ID and type
   * @param input Get embedding input (userId and userType)
   * @throws NotFoundError if embedding not found
   */
  async deleteEmbedding(input: GetMentorshipEmbeddingInput): Promise<void> {
    const [deleted] = await db
      .delete(mentorshipEmbeddings)
      .where(
        and(
          eq(mentorshipEmbeddings.userId, input.userId),
          eq(mentorshipEmbeddings.userType, input.userType),
        ),
      )
      .returning({ embeddingId: mentorshipEmbeddings.embeddingId });

    if (!deleted) {
      throw new NotFoundError(
        `Embedding not found for user ${input.userId} with type ${input.userType}`,
      );
    }
  }

  /**
   * Get all embeddings for a user (both mentor and mentee if they exist)
   * @param userId User ID
   * @returns Array of embedding records
   */
  async getEmbeddingsByUserId(
    userId: string,
  ): Promise<GetMentorshipEmbeddingOutput[]> {
    return (await db
      .select({
        embeddingId: mentorshipEmbeddings.embeddingId,
        userId: mentorshipEmbeddings.userId,
        userType: mentorshipEmbeddings.userType,
        whyInterestedEmbedding: mentorshipEmbeddings.whyInterestedEmbedding,
        hopeToGainEmbedding: mentorshipEmbeddings.hopeToGainEmbedding,
        profileEmbedding: mentorshipEmbeddings.profileEmbedding,
        createdAt: mentorshipEmbeddings.createdAt,
        updatedAt: mentorshipEmbeddings.updatedAt,
      })
      .from(mentorshipEmbeddings)
      .where(
        eq(mentorshipEmbeddings.userId, userId),
      )) as unknown as GetMentorshipEmbeddingOutput[];
  }
}
