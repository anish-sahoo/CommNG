import { z } from "zod";

export const audienceDetails = z.object({
  ranks: z.array(z.string()).default([]),
  departments: z.array(z.string()).default([]),
});

export const getActiveMessageBlastsForUserQuery = z.object({
  branch: z.string().optional(),
  rank: z.string().optional(),
  department: z.string().optional(),
});

export type ActiveMessageBlastsForUserQuery = z.infer<
  typeof getActiveMessageBlastsForUserQuery
>;

export const targetAudienceSchema = z.object({
  army: audienceDetails,
  airforce: audienceDetails,
});

export const messageBlastSchema = z.object({
  blastId: z.number().int().positive(),
  senderId: z.uuid(),
  title: z.string().min(1),
  content: z.string().min(1),
  targetAudience: targetAudienceSchema.optional(),
  sentAt: z.date().nullable().optional(),
  validUntil: z.date(),
  status: z.enum(["draft", "sent", "failed"]),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type MessageBlastSchema = z.infer<typeof messageBlastSchema>;

export const createMessageBlastInputSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  targetAudience: targetAudienceSchema.optional(),
  validUntil: z.date().optional(),
  status: z.enum(["draft", "sent", "failed"]).optional().default("draft"),
});

export const updateMessageBlastInputSchema = z.object({
  blastId: z.number().int().positive(),
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  targetAudience: targetAudienceSchema.optional(),
  validUntil: z.date().optional(),
  status: z.enum(["draft", "sent", "failed"]).optional(),
});

export const getMessageBlastInputSchema = z.object({
  blastId: z.number().int().positive(),
});

export const getMessageBlastsBySenderInputSchema = z.object({
  senderId: z.uuid(),
});

export type CreateMessageBlastInput = z.infer<
  typeof createMessageBlastInputSchema
>;
export type UpdateMessageBlastInput = z.infer<
  typeof updateMessageBlastInputSchema
>;
export type GetMessageBlastInput = z.infer<typeof getMessageBlastInputSchema>;
export type GetMessageBlastsBySenderInput = z.infer<
  typeof getMessageBlastsBySenderInputSchema
>;
export type TargetAudience = z.infer<typeof targetAudienceSchema>;

export function parseTargetAudience(jsonbData: unknown): TargetAudience | null {
  if (!jsonbData) {
    return null;
  }
  const result = targetAudienceSchema.safeParse(jsonbData);
  return result.success ? result.data : null;
}

export type MessageBlastDbRow = {
  blastId: number;
  senderId: string;
  title: string;
  content: string;
  targetAudience: unknown; // JSONB from database
  sentAt: string | Date | null;
  validUntil: string | Date;
  status: "draft" | "sent" | "failed";
  createdAt: string | Date;
  updatedAt: string | Date;
};

export type CreateMessageBlastOutput = {
  blastId: number;
  senderId: string;
  title: string;
  content: string;
  targetAudience: TargetAudience | null;
  sentAt: string | Date | null;
  validUntil: string | Date;
  status: "draft" | "sent" | "failed";
  createdAt: string | Date;
  updatedAt: string | Date;
};

export type GetMessageBlastOutput = {
  blastId: number;
  senderId: string;
  title: string;
  content: string;
  targetAudience: TargetAudience | null;
  sentAt: string | Date | null;
  validUntil: string | Date;
  status: "draft" | "sent" | "failed";
  createdAt: string | Date;
  updatedAt: string | Date;
};

export type UpdateMessageBlastOutput = {
  blastId: number;
  senderId: string;
  title: string;
  content: string;
  targetAudience: TargetAudience | null;
  sentAt: string | Date | null;
  validUntil: string | Date;
  status: "draft" | "sent" | "failed";
  createdAt: string | Date;
  updatedAt: string | Date;
};

export const messageBlastInsertSchema = z.object({
  senderId: z.uuid(),
  title: z.string().min(1),
  content: z.string().min(1),
  targetAudience: targetAudienceSchema.optional(),
  validUntil: z.date().optional(),
  status: z.enum(["draft", "sent", "failed"]).optional().default("draft"),
});

export type MessageBlastInsert = z.infer<typeof messageBlastInsertSchema>;
