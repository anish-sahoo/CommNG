import { z } from "zod";

export const mentorSchema = z.object({
  mentorId: z.number().int().positive(),
  userId: z.string(),
  mentorshipPreferences: z.string().nullable().optional(),
  rank: z.string().nullable().optional(),
  yearsOfService: z.number().int().nullable().optional(),
  eligibilityData: z.any().nullable().optional(),
  status: z.enum(["requested", "approved", "active"]),
});

export type MentorSchema = z.infer<typeof mentorSchema>;

export type GetMentorOutput = {
  mentorId: number;
  userId: string;
  mentorshipPreferences?: string | null;
  rank?: string | null;
  yearsOfService?: number | null;
  eligibilityData?: Record<string, unknown> | null;
  status: "requested" | "approved" | "active";
};
