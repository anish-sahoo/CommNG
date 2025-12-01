import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { z } from "zod";
import { allowedOrigins } from "./cors.js";
import { account, session, users, verification } from "./data/db/schema.js";
import { db } from "./data/db/sql.js";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: users,
      account: account,
      session: session,
      verification: verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      phoneNumber: {
        type: "string",
        required: false,
        fieldName: "phoneNumber",
      },
      rank: {
        type: "string",
        fieldName: "rank",
      },
      department: {
        type: "string",
      },
      branch: {
        type: "string",
      },
      positionType: {
        type: "string",
        validator: { input: z.enum(["active", "part-time"]) },
      },
      civilianCareer: {
        type: "string",
        required: false,
      },
      location: {
        type: "string",
        required: false,
      },
      about: {
        type: "string",
        required: false,
      },
      signalVisibility: {
        type: "string",
        required: false,
        validator: { input: z.enum(["private", "public"]) },
        defaultValue: "private" as const,
      },
      emailVisibility: {
        type: "string",
        required: false,
        validator: { input: z.enum(["private", "public"]) },
        defaultValue: "private" as const,
      },
    },
  },
  baseURL: process.env.BACKEND_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  basePath: "/api/auth",
  trustedOrigins: allowedOrigins,
});
