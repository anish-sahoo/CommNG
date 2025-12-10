import { z } from "zod";
import { roleKeySchema } from "../data/roles.js";

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
  image: z.uuid().nullable().optional(),
  linkedin: z
    .url()
    .refine((url) => url.startsWith("https://www.linkedin.com/in/"), {
      message: "LinkedIn URL must start with https://www.linkedin.com/in/",
    })
    .nullable()
    .optional(),
});

export type UserSchema = z.infer<typeof userSchema>;

export const getUserDataInputSchema = z.object({
  user_id: z.string(),
});

export const userDataOutputSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
  phoneNumber: z.string().nullable(),
  rank: z.string().nullable(),
  department: z.string().nullable(),
  branch: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  image: z.uuid().nullable(),
  location: z.string().nullable(),
  about: z.string().nullable(),
  interests: z.array(z.string()).nullable(),
  signalVisibility: z.enum(["private", "public"]),
  emailVisibility: z.enum(["private", "public"]),
  linkedin: z
    .url()
    .refine((url) => url.startsWith("https://www.linkedin.com/in/"), {
      message: "LinkedIn URL must start with https://www.linkedin.com/in/",
    })
    .nullable(),
  linkedinVisibility: z.enum(["private", "public"]),
});

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
  linkedin: z
    .url()
    .refine((url) => url.startsWith("https://www.linkedin.com/in/"), {
      message: "LinkedIn URL must start with https://www.linkedin.com/in/",
    })
    .nullable()
    .optional(),
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
  linkedin: z
    .url()
    .refine((url) => url.startsWith("https://www.linkedin.com/in/"), {
      message: "LinkedIn URL must start with https://www.linkedin.com/in/",
    })
    .nullable()
    .optional(),
});

export type UpdateUserProfileInput = z.infer<
  typeof updateUserProfileInputSchema
>;

export const searchUsersInputSchema = z.object({
  name: z.string().min(1),
});

export const getUserRolesOutputSchema = z.array(roleKeySchema);

export const updateUserVisibilityInputSchema = z.object({
  signal_visibility: z.enum(["private", "public"]),
  email_visibility: z.enum(["private", "public"]),
  linkedin_visibility: z.enum(["private", "public"]),
});

export type UpdateUserVisibilityInput = z.infer<
  typeof updateUserVisibilityInputSchema
>;

export const getUsersByIdsInputSchema = z.object({
  user_ids: z.array(z.string()),
});

export type GetUsersByIdsInput = z.infer<typeof getUsersByIdsInputSchema>;

export const createUserInputSchema = z.object({
  userData: z.object({
    email: z.email(),
    password: z.string(),
    name: z.string(),
    rank: z.string(),
    about: z.string(),
    location: z.string(),
    positionType: z.enum(["active", "part-time"]),
    branch: z.enum(["army", "airforce"]),
    department: z.string(),
    civilianCareer: z.string().optional(),
    emailVisibility: z.enum(["private", "public"]),
    signalVisibility: z.enum(["private", "public"]),
    linkedinVisibility: z.enum(["private", "public"]),
    interests: z.array(z.string()).optional(),
    linkedin: z
      .url()
      .refine((url) => url.startsWith("https://www.linkedin.com/in/"), {
        message: "LinkedIn URL must start with https://www.linkedin.com/in/",
      })
      .optional(),
  }),
  inviteCode: z.string(),
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export const searchUsersOutputSchema = z.array(
  userSchema
    .pick({
      name: true,
      email: true,
      rank: true,
      department: true,
      branch: true,
    })
    .extend(z.object({ id: z.string() }).shape),
);

const userSessionSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  image: z.string().nullish(),
  emailVerified: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createUserOutputSchema = z.discriminatedUnion("token", [
  z
    .object({ token: z.null() })
    .extend(z.object({ user: userSessionSchema }).shape),
  z
    .object({ token: z.string() })
    .extend(z.object({ user: userSessionSchema }).shape),
]);
