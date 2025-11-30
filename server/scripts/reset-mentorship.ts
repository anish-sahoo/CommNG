#!/usr/bin/env tsx
/* eslint-disable no-console */
/**
 * Resets seeded mentorship data (mock users, profiles, matches, recommendations).
 *
 * Usage:
 *   cd server
 *   npx dotenv -e .env -- tsx scripts/reset-mentorship.ts
 */
import { sql } from "drizzle-orm";
import {
  account,
  mentees,
  mentorRecommendations,
  mentors,
  mentorshipMatches,
  users,
} from "../src/data/db/schema.js";
import { connectPostgres, db, shutdownPostgres } from "../src/data/db/sql.js";

async function resetMentorship() {
  console.log("Resetting mentorship data for mock users (mock-*)...");
  await connectPostgres();

  // Order matters because of FK constraints.
  await db.execute(sql`DELETE FROM ${mentorshipMatches}`);
  await db.execute(sql`DELETE FROM ${mentorRecommendations}`);
  await db.execute(
    sql`DELETE FROM ${mentors} WHERE ${mentors.userId} LIKE 'mock-%'`,
  );
  await db.execute(
    sql`DELETE FROM ${mentees} WHERE ${mentees.userId} LIKE 'mock-%'`,
  );
  await db.execute(
    sql`DELETE FROM ${account} WHERE ${account.userId} LIKE 'mock-%'`,
  );
  await db.execute(sql`DELETE FROM ${users} WHERE ${users.id} LIKE 'mock-%'`);

  console.log("Done. Mentorship seed data cleared.");
}

resetMentorship()
  .catch((error) => {
    console.error("Failed to reset mentorship data:", error);
    process.exit(1);
  })
  .finally(async () => {
    await shutdownPostgres();
  });
