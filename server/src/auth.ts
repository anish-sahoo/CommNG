import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { account, session, users, verification } from "@/data/db/schema.js";
import { db } from "@/data/db/sql.js";

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
    },
  },
  baseURL: process.env.BACKEND_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  basePath: "/api/auth",
  trustedOrigins: [
    "http://localhost:3000",
    "http://localhost:3001",
    process.env.BACKEND_URL || "",
  ].filter(Boolean),
});
