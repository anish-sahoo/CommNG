import { z } from "zod";

export const menteeSchema = z.object({
  menteeId: z.number().int().positive(),
  userId: z.number().int().positive(),
  learningGoals: z.string().nullable().optional(),
  experienceLevel: z.string().nullable().optional(),
  preferredMentorType: z.string().nullable().optional(),
  status: z.enum(["active", "inactive", "matched"]),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type MenteeSchema = z.infer<typeof menteeSchema>;

export const createMenteeInputSchema = z.object({
  userId: z.number().int().positive(),
  learningGoals: z.string().optional(),
  experienceLevel: z.string().optional(),
  preferredMentorType: z.string().optional(),
  status: z
    .enum(["active", "inactive", "matched"])
    .optional()
    .default("active"),
});

export const updateMenteeInputSchema = z.object({
  menteeId: z.number().int().positive(),
  learningGoals: z.string().optional(),
  experienceLevel: z.string().optional(),
  preferredMentorType: z.string().optional(),
  status: z.enum(["active", "inactive", "matched"]).optional(),
});

export const getMenteeInputSchema = z.object({
  menteeId: z.number().int().positive(),
});

export const getMenteesByUserInputSchema = z.object({
  userId: z.number().int().positive(),
});

export type CreateMenteeInput = z.infer<typeof createMenteeInputSchema>;
export type UpdateMenteeInput = z.infer<typeof updateMenteeInputSchema>;
export type GetMenteeInput = z.infer<typeof getMenteeInputSchema>;
export type GetMenteesByUserInput = z.infer<typeof getMenteesByUserInputSchema>;

export type CreateMenteeOutput = {
  menteeId: number;
  userId: string;
  learningGoals?: string | null;
  experienceLevel?: string | null;
  preferredMentorType?: string | null;
  status: "active" | "inactive" | "matched";
  createdAt: string | Date;
  updatedAt: string | Date;
};

export type GetMenteeOutput = {
  menteeId: number;
  userId: string;
  learningGoals?: string | null;
  experienceLevel?: string | null;
  preferredMentorType?: string | null;
  status: "active" | "inactive" | "matched";
  createdAt: string | Date;
  updatedAt: string | Date;
};

export type UpdateMenteeOutput = {
  menteeId: number;
  userId: string;
  learningGoals?: string | null;
  experienceLevel?: string | null;
  preferredMentorType?: string | null;
  status: "active" | "inactive" | "matched";
  createdAt: string | Date;
  updatedAt: string | Date;
};
