import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./data/db/sql.js";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      phoneNumber: {
        type: "string",
        required: false,
        fieldName: "phone_number",
      },
      clearanceLevel: {
        type: "string",
        fieldName: "clearance_level",
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
});
