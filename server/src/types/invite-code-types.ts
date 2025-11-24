import { z } from "zod";
import { roleKeysArraySchema } from "../data/roles.js";

// Input schema for creating an invite code
export const createInviteCodeInputSchema = z.object({
  roleKeys: roleKeysArraySchema,
  expiresInHours: z.number().positive().optional(),
});

// Input schema for validating an invite code
export const validateInviteCodeInputSchema = z.object({
  code: z
    .string()
    .min(8, "Invite code must be at least 8 characters")
    .max(8, "Invite code must be exactly 8 characters")
    .regex(
      /^[A-Z0-9]+$/,
      "Invite code must contain only uppercase letters and numbers",
    ),
});

// Input schema for listing invite codes with filters
export const inviteCodeStatusEnum = z.enum([
  "active",
  "used",
  "expired",
  "revoked",
]);

export const listInviteCodesInputSchema = z.object({
  status: inviteCodeStatusEnum.optional(),
  limit: z.number().int().positive().max(100).optional().default(50),
  offset: z.number().int().nonnegative().optional().default(0),
});

export type InviteCodeStatus = z.infer<typeof inviteCodeStatusEnum>;

// Input schema for revoking an invite code
export const revokeInviteCodeInputSchema = z.object({
  codeId: z.number().int().positive(),
});
