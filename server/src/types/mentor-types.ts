import { z } from "zod";

export const mentorSchema = z.object({
  mentorId: z.number().int().positive(),
  userId: z.string(),
  mentorshipPreferences: z.string().nullable().optional(),
  rank: z.string().nullable().optional(),
  yearsOfService: z.number().int().nonnegative().nullable().optional(),
  eligibilityData: z.record(z.string(), z.unknown()).nullable().nullish(),
  status: z.enum(["requested", "approved", "active"]),
});

export type MentorSchema = z.infer<typeof mentorSchema>;

export const createMentorInputSchema = z.object({
  userId: z.string(),
  mentorshipPreferences: z.string().optional(),
  rank: z.string().optional(),
  yearsOfService: z.number().int().nonnegative().optional(),
  eligibilityData: z.record(z.string(), z.unknown()).nullish(),
  status: z
    .enum(["requested", "approved", "active"])
    .optional()
    .default("requested"),
});

export type CreateMentorInput = z.infer<typeof createMentorInputSchema>;

export type CreateMentorOutput = {
  mentorId: number;
  userId: string;
  mentorshipPreferences?: string | null;
  rank?: string | null;
  yearsOfService?: number | null;
  eligibilityData?: Record<string, unknown> | null;
  status: "requested" | "approved" | "active";
};

export type GetMentorOutput = {
  mentorId: number;
  userId: string;
  mentorshipPreferences?: string | null;
  rank?: string | null;
  yearsOfService?: number | null;
  eligibilityData?: Record<string, unknown> | null;
  status: "requested" | "approved" | "active";
};
