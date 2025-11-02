import { z } from "zod";

export const userSchema = z.object({
  userId: z.number().int().positive(),
  name: z.string().min(1),
  email: z.string().email(),
  phoneNumber: z.string().nullable().optional(),
  clearanceLevel: z.string().nullable().optional(),
  department: z.string().nullable().optional(),
  branch: z.string().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type UserSchema = z.infer<typeof userSchema>;

export const getUserDataInputSchema = z.object({
  user_id: z.string(),
});

export type GetUserDataInput = z.infer<typeof getUserDataInputSchema>;

export const checkEmailExistsInputSchema = z.object({
  email: z.string().email(),
});

export type CheckEmailExistsInput = z.infer<typeof checkEmailExistsInputSchema>;

export type RoleNamespace = "global" | "channel" | "mentor" | "feature";
export type RoleSummary = {
  roleId: number;
  namespace: RoleNamespace;
  subjectId: string | null;
  action: string;
  roleKey: string;
  channelId: number | null;
  metadata: Record<string, unknown> | null;
};
