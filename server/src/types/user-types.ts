import { z } from "zod";
import type { RoleNamespace } from "../data/db/schema.js";

export const userSchema = z.object({
  userId: z.number().int().positive(),
  name: z.string().min(1),
  email: z.email(),
  phoneNumber: z.string().nullable().optional(),
  rank: z.string().nullable().optional(),
  department: z.string().nullable().optional(),
  branch: z.string().nullable().optional(),
  positionType: z.enum(["active", "guard", "reserve"]).nullable().optional(),
  serviceType: z.enum(["enlisted", "officer"]).nullable().optional(),
  detailedPosition: z.string().nullable().optional(),
  detailedRank: z.string().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  location: z.string().nullable().optional(),
  about: z.string().nullable().optional(),
  interests: z.array(z.string()).nullable().optional(),
  image: z.string().uuid().nullable().optional(),
});

export type UserSchema = z.infer<typeof userSchema>;

export const getUserDataInputSchema = z.object({
  user_id: z.string(),
});

export type GetUserDataInput = z.infer<typeof getUserDataInputSchema>;

export const checkEmailExistsInputSchema = z.object({
  email: z.email(),
});

export type CheckEmailExistsInput = z.infer<typeof checkEmailExistsInputSchema>;

export const createUserProfileInputSchema = z.object({
  name: z.string().min(1),
  phoneNumber: z.string().nullable().optional(),
  rank: z.string().nullable().optional(),
  department: z.string().nullable().optional(),
  branch: z.string().nullable().optional(),
  positionType: z.enum(["active", "guard", "reserve"]).nullable().optional(),
  serviceType: z.enum(["enlisted", "officer"]).nullable().optional(),
  detailedPosition: z.string().nullable().optional(),
  detailedRank: z.string().nullable().optional(),
  imageFileId: z.string().uuid().nullable().optional(),
  location: z.string().nullable().optional(),
  about: z.string().nullable().optional(),
  interests: z.array(z.string()).nullable().optional(),
});

export type CreateUserProfileInput = z.infer<
  typeof createUserProfileInputSchema
>;

export const updateUserProfileInputSchema = z.object({
  name: z.string().min(1).optional(),
  phoneNumber: z.string().nullable().optional(),
  rank: z.string().nullable().optional(),
  department: z.string().nullable().optional(),
  branch: z.string().nullable().optional(),
  positionType: z.enum(["active", "guard", "reserve"]).nullable().optional(),
  serviceType: z.enum(["enlisted", "officer"]).nullable().optional(),
  detailedPosition: z.string().nullable().optional(),
  detailedRank: z.string().nullable().optional(),
  image: z.string().uuid().nullable().optional(),
  location: z.string().nullable().optional(),
  about: z.string().nullable().optional(),
  interests: z.array(z.string()).nullable().optional(),
});

export type UpdateUserProfileInput = z.infer<
  typeof updateUserProfileInputSchema
>;

export const searchUsersInputSchema = z.object({
  name: z.string().min(1),
});

export type SearchUsersInput = z.infer<typeof searchUsersInputSchema>;

export type RoleSummary = {
  roleId: number;
  namespace: RoleNamespace;
  subjectId: string | null;
  action: string;
  roleKey: string;
  channelId: number | null;
  metadata: Record<string, unknown> | null;
};

export const updateUserVisibilityInputSchema = z.object({
  signal_visibility: z.enum(["private", "public"]),
  email_visibility: z.enum(["private", "public"]),
});

export type UpdateUserVisibilityInput = z.infer<
  typeof updateUserVisibilityInputSchema
>;

export const getUsersByIdsInputSchema = z.object({
  user_ids: z.array(z.string()),
});

export type GetUsersByIdsInput = z.infer<typeof getUsersByIdsInputSchema>;
