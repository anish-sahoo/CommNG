#!/usr/bin/env tsx
import { hashPassword } from "better-auth/crypto";
/* eslint-disable no-console */
import { and, eq } from "drizzle-orm";
import {
  account,
  mentees,
  mentorRecommendations,
  mentors,
  mentorshipMatches,
  users,
} from "../src/data/db/schema.js";
import { connectPostgres, db, shutdownPostgres } from "../src/data/db/sql.js";

type SeedUserInput = {
  id: string;
  name: string;
  email: string;
  rank?: string;
  positionType?: "active" | "part-time";
  location?: string;
  phoneNumber?: string;
};

const DEFAULT_PASSWORD = "password";
type UserRow = typeof users.$inferSelect;
type AccountRow = typeof account.$inferSelect;
type MentorRow = typeof mentors.$inferSelect;
type MenteeRow = typeof mentees.$inferSelect;
type MentorRecommendationRow = typeof mentorRecommendations.$inferSelect;

async function ensureUser(input: SeedUserInput): Promise<UserRow> {
  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.id, input.id))
    .limit(1);

  if (existing) {
    const needsUpdate =
      existing.name !== input.name ||
      existing.email !== input.email ||
      existing.rank !== input.rank ||
      existing.positionType !== input.positionType ||
      existing.location !== input.location ||
      existing.phoneNumber !== input.phoneNumber;

    if (!needsUpdate) {
      return existing;
    }

    const [updated] = await db
      .update(users)
      .set({
        name: input.name,
        email: input.email,
        rank: input.rank,
        positionType: input.positionType,
        location: input.location,
        phoneNumber: input.phoneNumber,
        emailVerified: true,
      })
      .where(eq(users.id, input.id))
      .returning();

    if (!updated) {
      throw new Error(`Failed to update user ${input.id}`);
    }

    return updated as UserRow;
  }

  const [created] = await db
    .insert(users)
    .values({
      id: input.id,
      name: input.name,
      email: input.email,
      rank: input.rank,
      positionType: input.positionType,
      location: input.location,
      phoneNumber: input.phoneNumber,
      emailVerified: true,
    })
    .returning();

  if (!created) {
    throw new Error(`Failed to create user ${input.id}`);
  }

  return created as UserRow;
}

async function ensurePasswordAccount(userId: string): Promise<AccountRow> {
  const [existing] = await db
    .select()
    .from(account)
    .where(
      and(eq(account.userId, userId), eq(account.providerId, "credential")),
    )
    .limit(1);

  if (existing) {
    const hashed = await hashPassword(DEFAULT_PASSWORD);
    const [updated] = await db
      .update(account)
      .set({
        providerId: "credential",
        accountId: userId,
        password: hashed,
      })
      .where(eq(account.id, existing.id))
      .returning();

    if (!updated) {
      throw new Error(`Failed to update credential account for ${userId}`);
    }

    return updated as AccountRow;
  }

  const hashed = await hashPassword(DEFAULT_PASSWORD);
  const [created] = await db
    .insert(account)
    .values({
      id: `${userId}-credential`,
      userId,
      providerId: "credential",
      accountId: userId,
      password: hashed,
    })
    .returning();

  if (!created) {
    throw new Error(`Failed to create credential account for ${userId}`);
  }

  return created as AccountRow;
}

async function ensureMentor(userId: string): Promise<MentorRow> {
  const [existing] = await db
    .select()
    .from(mentors)
    .where(eq(mentors.userId, userId))
    .limit(1);

  if (existing) {
    return existing;
  }

  const [created] = await db
    .insert(mentors)
    .values({
      userId,
      status: "approved",
      yearsOfService: 8,
      strengths: ["coaching", "career-planning"],
      personalInterests: "running, woodworking",
      whyInterestedResponses: [
        "I want to give back to junior soldiers.",
        "I enjoy mentoring one-on-one.",
      ],
      careerAdvice: "Consistency beats intensity.",
      preferredMenteeCareerStages: ["junior-ncos", "transitioning"],
      preferredMeetingFormat: "hybrid",
      hoursPerMonthCommitment: 3,
    })
    .returning();

  if (!created) {
    throw new Error(`Failed to create mentor for ${userId}`);
  }

  return created as MentorRow;
}

async function ensureMentee(userId: string): Promise<MenteeRow> {
  const [existing] = await db
    .select()
    .from(mentees)
    .where(eq(mentees.userId, userId))
    .limit(1);

  if (existing) {
    return existing;
  }

  const [created] = await db
    .insert(mentees)
    .values({
      userId,
      learningGoals: "Grow as a team lead and transition to tech ops.",
      experienceLevel: "mid-level",
      preferredMentorType: "operations",
      status: "active",
      personalInterests: "fitness, cooking",
      roleModelInspiration: "Sgt. Smith",
      hopeToGainResponses: [
        "Structured career guidance",
        "Accountability for monthly goals",
      ],
      mentorQualities: ["strong-communicator", "experienced-leader"],
      preferredMeetingFormat: "virtual",
      hoursPerMonthCommitment: 2,
    })
    .returning();

  if (!created) {
    throw new Error(`Failed to create mentee for ${userId}`);
  }

  return created as MenteeRow;
}

async function upsertRecommendation(
  userId: string,
  recommendedMentorIds: string[],
): Promise<MentorRecommendationRow> {
  const [existing] = await db
    .select()
    .from(mentorRecommendations)
    .where(eq(mentorRecommendations.userId, userId))
    .limit(1);

  if (existing) {
    const merged = Array.from(
      new Set([
        ...(existing.recommendedMentorIds ?? []),
        ...recommendedMentorIds,
      ]),
    );
    const [updated] = await db
      .update(mentorRecommendations)
      .set({ recommendedMentorIds: merged })
      .where(eq(mentorRecommendations.userId, userId))
      .returning();

    if (!updated) {
      throw new Error(`Failed to update mentor recommendations for ${userId}`);
    }

    return updated as MentorRecommendationRow;
  }

  const [created] = await db
    .insert(mentorRecommendations)
    .values({
      userId,
      recommendedMentorIds,
    })
    .returning();

  if (!created) {
    throw new Error(`Failed to create mentor recommendations for ${userId}`);
  }

  return created as MentorRecommendationRow;
}

async function ensureMatch(
  menteeUserId: string,
  mentorUserId: string,
  status: "pending" | "accepted" | "declined",
) {
  const [existing] = await db
    .select()
    .from(mentorshipMatches)
    .where(
      and(
        eq(mentorshipMatches.requestorUserId, menteeUserId),
        eq(mentorshipMatches.mentorUserId, mentorUserId),
      ),
    )
    .limit(1);

  if (existing) {
    return existing;
  }

  const [created] = await db
    .insert(mentorshipMatches)
    .values({
      requestorUserId: menteeUserId,
      mentorUserId,
      status,
      matchedAt: new Date(),
      message:
        status === "pending"
          ? "Looking forward to learning from you!"
          : "Thanks for accepting!",
    })
    .returning();

  if (!created) {
    throw new Error(
      `Failed to create match between mentee ${menteeUserId} and mentor ${mentorUserId}`,
    );
  }

  return created;
}

/**
 * Seeds mock mentorship data (one mentee, three mentors: accepted, pending, suggested).
 *
 * Usage:
 *   cd server
 *   npx dotenv -e .env -- tsx scripts/seed-mentorship.ts
 */
async function main() {
  console.log("Seeding mock mentorship data...");
  await connectPostgres();

  const mentorA = await ensureUser({
    id: "mock-mentor-1",
    name: "Caroline Pham",
    email: "caroline@example.com",
    rank: "Frontend",
    positionType: "part-time",
    location: "Boise, ID",
    phoneNumber: "123-4567",
  });
  const mentorB = await ensureUser({
    id: "mock-mentor-2",
    name: "Anish Sahoo",
    email: "anish@example.com",
    rank: "Tech Lead",
    positionType: "part-time",
    location: "Boston, MA",
    phoneNumber: "555-0102",
  });
  const menteeA = await ensureUser({
    id: "mock-mentee-1",
    name: "Olivia Sedarski",
    email: "olivia@example.com",
    rank: "PM/Frontend",
    positionType: "part-time",
    location: "Boston, MA",
    phoneNumber: "890-123",
  });
  const menteeB = await ensureUser({
    id: "mock-mentee-2",
    name: "Natasha Sun",
    email: "natasha@example.com",
    rank: "PM/Frontend",
    positionType: "part-time",
    location: "Boston, MA",
    phoneNumber: "555-0104",
  });

  await ensureMentor(mentorA.id);
  await ensureMentor(mentorB.id);
  await ensureMentee(menteeA.id);
  await ensureMentee(menteeB.id);
  await ensurePasswordAccount(mentorA.id);
  await ensurePasswordAccount(mentorB.id);
  await ensurePasswordAccount(menteeA.id);
  await ensurePasswordAccount(menteeB.id);

  // Only pending requests (no accepted matches yet), plus suggestions.
  // Keep Caroline (mentorA) unrequested so you can test sending a new request.
  await ensureMatch(menteeA.id, mentorB.id, "pending");
  await ensureMatch(menteeB.id, mentorB.id, "pending");
  await upsertRecommendation(menteeA.id, [mentorA.id, mentorB.id]);
  await upsertRecommendation(menteeB.id, [mentorA.id, mentorB.id]);

  console.log("Seed complete.");
  console.log("Users created:");
  console.log(` Mentor A: ${mentorA.email}`);
  console.log(` Mentor B: ${mentorB.email}`);
  console.log(` Mentee A: ${menteeA.email}`);
  console.log(` Mentee B: ${menteeB.email}`);
  console.log("");
  console.log(`Default password for all: ${DEFAULT_PASSWORD}`);
  console.log(
    "Use these in the UI to see: mentee sees an active mentor + a pending request; mentors see pending/active mentees.",
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await shutdownPostgres();
  });
