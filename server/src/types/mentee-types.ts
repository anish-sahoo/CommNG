import { z } from "zod";

export const menteeSchema = z.object({
  menteeId: z.number().int().positive(),
  userId: z.string(),
  learningGoals: z.string().nullable().optional(),
  experienceLevel: z.string().nullable().optional(),
  preferredMentorType: z.string().nullable().optional(),
  status: z.enum(["active", "inactive", "matched"]),
  positionType: z.enum(["active", "guard", "reserve"]).nullable().optional(),
  serviceType: z.enum(["enlisted", "officer"]).nullable().optional(),
  detailedPosition: z.string().nullable().optional(),
  detailedRank: z.string().nullable().optional(),
  resumeFileId: z.string().uuid().nullable().optional(),
  personalInterests: z.string().nullable().optional(),
  roleModelInspiration: z.string().nullable().optional(),
  hopeToGainResponses: z.array(z.string()).nullable().optional(),
  mentorQualities: z.array(z.string()).nullable().optional(),
  preferredMeetingFormat: z
    .enum(["in-person", "virtual", "hybrid", "no-preference"])
    .nullable()
    .optional(),
  hoursPerMonthCommitment: z.number().int().positive().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type MenteeSchema = z.infer<typeof menteeSchema>;

export const createMenteeInputSchema = z.object({
  userId: z.string(),
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
  userId: z.string(),
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
