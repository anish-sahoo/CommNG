import { z } from "zod";

export const mentorshipEmbeddingSchema = z.object({
  embeddingId: z.number().int().positive(),
  userId: z.string(),
  userType: z.enum(["mentor", "mentee"]),
  whyInterestedEmbedding: z.array(z.number()).nullable().optional(), // 1536-dimensional vector
  hopeToGainEmbedding: z.array(z.number()).nullable().optional(), // 1536-dimensional vector
  profileEmbedding: z.array(z.number()).nullable().optional(), // 1536-dimensional vector
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type MentorshipEmbeddingSchema = z.infer<
  typeof mentorshipEmbeddingSchema
>;

export const createMentorshipEmbeddingInputSchema = z.object({
  userId: z.string(),
  userType: z.enum(["mentor", "mentee"]),
  whyInterestedEmbedding: z.array(z.number()).length(1536).optional(),
  hopeToGainEmbedding: z.array(z.number()).length(1536).optional(),
  profileEmbedding: z.array(z.number()).length(1536).optional(),
});

export type CreateMentorshipEmbeddingInput = z.infer<
  typeof createMentorshipEmbeddingInputSchema
>;

export const updateMentorshipEmbeddingInputSchema = z.object({
  userId: z.string(),
  userType: z.enum(["mentor", "mentee"]),
  whyInterestedEmbedding: z.array(z.number()).length(1536).optional(),
  hopeToGainEmbedding: z.array(z.number()).length(1536).optional(),
  profileEmbedding: z.array(z.number()).length(1536).optional(),
});

export type UpdateMentorshipEmbeddingInput = z.infer<
  typeof updateMentorshipEmbeddingInputSchema
>;

export const getMentorshipEmbeddingInputSchema = z.object({
  userId: z.string(),
  userType: z.enum(["mentor", "mentee"]),
});

export type GetMentorshipEmbeddingInput = z.infer<
  typeof getMentorshipEmbeddingInputSchema
>;

export type CreateMentorshipEmbeddingOutput = {
  embeddingId: number;
  userId: string;
  userType: "mentor" | "mentee";
  whyInterestedEmbedding?: number[] | null;
  hopeToGainEmbedding?: number[] | null;
  profileEmbedding?: number[] | null;
  createdAt: Date;
  updatedAt: Date;
};

export type GetMentorshipEmbeddingOutput = {
  embeddingId: number;
  userId: string;
  userType: "mentor" | "mentee";
  whyInterestedEmbedding?: number[] | null;
  hopeToGainEmbedding?: number[] | null;
  profileEmbedding?: number[] | null;
  createdAt: Date;
  updatedAt: Date;
};

export type UpdateMentorshipEmbeddingOutput = {
  embeddingId: number;
  userId: string;
  userType: "mentor" | "mentee";
  whyInterestedEmbedding?: number[] | null;
  hopeToGainEmbedding?: number[] | null;
  profileEmbedding?: number[] | null;
  createdAt: Date;
  updatedAt: Date;
};
