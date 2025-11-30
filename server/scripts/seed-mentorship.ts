#!/usr/bin/env tsx
/* eslint-disable no-console */
import "dotenv/config";
import { and, eq } from "drizzle-orm";
import {
  mentees,
  mentors,
  mentorshipMatches,
  users,
} from "../src/data/db/schema.js";
import { db } from "../src/data/db/sql.js";

type SeedUserInput = {
  id: string;
  name: string;
  email: string;
  rank?: string;
  positionType?: "active" | "guard" | "reserve";
  serviceType?: "enlisted" | "officer";
  location?: string;
  phoneNumber?: string;
};

async function ensureUser(input: SeedUserInput) {
  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.id, input.id))
    .limit(1);

  if (existing) {
    return existing;
  }

  const [created] = await db
    .insert(users)
    .values({
      id: input.id,
      name: input.name,
      email: input.email,
      rank: input.rank,
      positionType: input.positionType,
      serviceType: input.serviceType,
      location: input.location,
      phoneNumber: input.phoneNumber,
      emailVerified: true,
    })
    .returning();

  return created;
}

async function ensureMentor(userId: string) {
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

  return created;
}

async function ensureMentee(userId: string) {
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

  return created;
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

  return created;
}

async function main() {
  console.log("Seeding mock mentorship data...");

  const mentorA = await ensureUser({
    id: "mock-mentor-1",
    name: "Captain Alice Mentor",
    email: "alice.mentor@example.com",
    rank: "O-3",
    positionType: "active",
    serviceType: "officer",
    location: "Boise, ID",
    phoneNumber: "555-0101",
  });
  const mentorB = await ensureUser({
    id: "mock-mentor-2",
    name: "Sgt. Bob Guide",
    email: "bob.guide@example.com",
    rank: "E-6",
    positionType: "guard",
    serviceType: "enlisted",
    location: "Salt Lake City, UT",
    phoneNumber: "555-0102",
  });
  const mentee = await ensureUser({
    id: "mock-mentee-1",
    name: "Spc. Casey Learner",
    email: "casey.learner@example.com",
    rank: "E-4",
    positionType: "reserve",
    serviceType: "enlisted",
    location: "Boise, ID",
    phoneNumber: "555-0103",
  });

  await ensureMentor(mentorA.id);
  await ensureMentor(mentorB.id);
  await ensureMentee(mentee.id);

  await ensureMatch(mentee.id, mentorA.id, "accepted"); // shows as active match
  await ensureMatch(mentee.id, mentorB.id, "pending"); // shows as pending request

  console.log("Seed complete.");
  console.log("Users created:");
  console.log(` Mentor A: ${mentorA.email}`);
  console.log(` Mentor B: ${mentorB.email}`);
  console.log(` Mentee : ${mentee.email}`);
  console.log("");
  console.log(
    "Use these in the UI to see: mentee sees an active mentor + a pending request; mentors see pending/active mentees.",
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => {
    void db.$client.end();
  });
