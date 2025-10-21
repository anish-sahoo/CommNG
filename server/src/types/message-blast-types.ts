import { z } from "zod";

export const messageBlastSchema = z.object({
  blastId: z.number().int().positive(),
  senderId: z.number().int().positive(),
  title: z.string().min(1),
  content: z.string().min(1),
  targetAudience: z.record(z.unknown()).nullable().optional(),
  scheduledAt: z.date().nullable().optional(),
  sentAt: z.date().nullable().optional(),
  status: z.enum(["draft", "scheduled", "sent", "failed"]),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type MessageBlastSchema = z.infer<typeof messageBlastSchema>;

export const createMessageBlastInputSchema = z.object({
  senderId: z.number().int().positive(),
  title: z.string().min(1),
  content: z.string().min(1),
  targetAudience: z.record(z.unknown()).optional(),
  scheduledAt: z.date().optional(),
  status: z
    .enum(["draft", "scheduled", "sent", "failed"])
    .optional()
    .default("draft"),
});

export const updateMessageBlastInputSchema = z.object({
  blastId: z.number().int().positive(),
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  targetAudience: z.record(z.unknown()).optional(),
  scheduledAt: z.date().optional(),
  status: z.enum(["draft", "scheduled", "sent", "failed"]).optional(),
});

export const getMessageBlastInputSchema = z.object({
  blastId: z.number().int().positive(),
});

export const getMessageBlastsBySenderInputSchema = z.object({
  senderId: z.number().int().positive(),
});

export const scheduleMessageBlastInputSchema = z.object({
  blastId: z.number().int().positive(),
  scheduledAt: z.date(),
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
export type ScheduleMessageBlastInput = z.infer<
  typeof scheduleMessageBlastInputSchema
>;

export type CreateMessageBlastOutput = {
  blastId: number;
  senderId: number;
  title: string;
  content: string;
  targetAudience?: Record<string, unknown> | null;
  scheduledAt?: string | Date | null;
  sentAt?: string | Date | null;
  status: "draft" | "scheduled" | "sent" | "failed";
  createdAt: string | Date;
  updatedAt: string | Date;
};

export type GetMessageBlastOutput = {
  blastId: number;
  senderId: number;
  title: string;
  content: string;
  targetAudience?: Record<string, unknown> | null;
  scheduledAt?: string | Date | null;
  sentAt?: string | Date | null;
  status: "draft" | "scheduled" | "sent" | "failed";
  createdAt: string | Date;
  updatedAt: string | Date;
};

export type UpdateMessageBlastOutput = {
  blastId: number;
  senderId: number;
  title: string;
  content: string;
  targetAudience?: Record<string, unknown> | null;
  scheduledAt?: string | Date | null;
  sentAt?: string | Date | null;
  status: "draft" | "scheduled" | "sent" | "failed";
  createdAt: string | Date;
  updatedAt: string | Date;
};
