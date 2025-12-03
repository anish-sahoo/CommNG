#!/usr/bin/env tsx
/* eslint-disable no-console */
import { eq } from "drizzle-orm";
import { auth } from "../src/auth.js";
import {
  account,
  mentees,
  mentorRecommendations,
  mentors,
  mentorshipMatches,
  users,
} from "../src/data/db/schema.js";
import { connectPostgres, db, shutdownPostgres } from "../src/data/db/sql.js";
import { MatchingService } from "../src/service/matching-service.js";

const DEFAULT_PASSWORD = "password";

type SeedUserInput = {
  id: string;
  name: string;
  email: string;
  rank?: string;
  positionType?: "active" | "part-time";
  location?: string;
  phoneNumber?: string;
};

type MentorInput = {
  yearsOfService: number;
  strengths: string[];
  personalInterests: string;
  whyInterestedResponses: string[];
  careerAdvice: string;
  preferredMenteeCareerStages: string[];
  preferredMeetingFormat: "in-person" | "virtual" | "hybrid" | "no-preference";
  hoursPerMonthCommitment: number;
};

type MenteeInput = {
  learningGoals: string;
  experienceLevel: string;
  preferredMentorType: string;
  personalInterests: string;
  roleModelInspiration: string;
  hopeToGainResponses: string[];
  mentorQualities: string[];
  preferredMeetingFormat: "in-person" | "virtual" | "hybrid" | "no-preference";
  hoursPerMonthCommitment: number;
};

async function ensureUser(input: SeedUserInput) {
  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.email, input.email))
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(users)
      .set({
        name: input.name,
        rank: input.rank,
        positionType: input.positionType,
        location: input.location,
        phoneNumber: input.phoneNumber,
        emailVerified: true,
      })
      .where(eq(users.id, existing.id))
      .returning();
    return updated as NonNullable<typeof updated>;
  }

  // Use auth.api.signUpEmail to create user with password
  const result = await auth.api.signUpEmail({
    body: {
      name: input.name,
      email: input.email,
      password: DEFAULT_PASSWORD,
      rank: input.rank ?? "",
      department: "",
      branch: "",
      positionType: input.positionType ?? "active",
    },
  });

  if (!result.user) {
    throw new Error(`Failed to create user ${input.email}`);
  }

  // Update with additional fields
  const [updated] = await db
    .update(users)
    .set({
      location: input.location,
      phoneNumber: input.phoneNumber,
      emailVerified: true,
    })
    .where(eq(users.id, result.user.id))
    .returning();

  return updated as NonNullable<typeof updated>;
}

async function ensureMentor(userId: string, input: MentorInput) {
  const [existing] = await db
    .select()
    .from(mentors)
    .where(eq(mentors.userId, userId))
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(mentors)
      .set({
        status: "active",
        ...input,
      })
      .where(eq(mentors.userId, userId))
      .returning();
    return updated as NonNullable<typeof updated>;
  }

  const [created] = await db
    .insert(mentors)
    .values({
      userId,
      status: "active",
      ...input,
    })
    .returning();
  return created as NonNullable<typeof created>;
}

async function ensureMentee(userId: string, input: MenteeInput) {
  const [existing] = await db
    .select()
    .from(mentees)
    .where(eq(mentees.userId, userId))
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(mentees)
      .set({
        status: "active",
        ...input,
      })
      .where(eq(mentees.userId, userId))
      .returning();
    return updated as NonNullable<typeof updated>;
  }

  const [created] = await db
    .insert(mentees)
    .values({
      userId,
      status: "active",
      ...input,
    })
    .returning();
  return created as NonNullable<typeof created>;
}

// 15 diverse mentors with different profiles
const MENTOR_DATA: Array<{ user: SeedUserInput; mentor: MentorInput }> = [
  {
    user: {
      id: "test-mentor-01",
      name: "Sarah Chen",
      email: "sarah.chen@test.com",
      rank: "Major",
      positionType: "active",
      location: "Fort Bragg, NC",
    },
    mentor: {
      yearsOfService: 12,
      strengths: ["leadership", "strategic-planning", "team-building"],
      personalInterests: "running, chess, reading military history",
      whyInterestedResponses: [
        "I want to develop the next generation of leaders.",
        "Mentoring helped me grow, and I want to pay it forward.",
      ],
      careerAdvice: "Focus on building relationships, not just skills.",
      preferredMenteeCareerStages: ["junior-officers", "senior-ncos"],
      preferredMeetingFormat: "hybrid",
      hoursPerMonthCommitment: 4,
    },
  },
  {
    user: {
      id: "test-mentor-02",
      name: "Marcus Johnson",
      email: "marcus.johnson@test.com",
      rank: "Sergeant First Class",
      positionType: "active",
      location: "Fort Campbell, KY",
    },
    mentor: {
      yearsOfService: 15,
      strengths: ["coaching", "technical-skills", "problem-solving"],
      personalInterests: "woodworking, fishing, coaching youth sports",
      whyInterestedResponses: [
        "I enjoy watching soldiers develop their potential.",
        "Technical mentorship is crucial for mission success.",
      ],
      careerAdvice: "Master your craft before seeking promotion.",
      preferredMenteeCareerStages: ["new-soldiers", "junior-ncos"],
      preferredMeetingFormat: "in-person",
      hoursPerMonthCommitment: 3,
    },
  },
  {
    user: {
      id: "test-mentor-03",
      name: "Jennifer Williams",
      email: "jennifer.williams@test.com",
      rank: "Lieutenant Colonel",
      positionType: "part-time",
      location: "Washington, DC",
    },
    mentor: {
      yearsOfService: 18,
      strengths: ["career-planning", "networking", "executive-presence"],
      personalInterests: "traveling, wine tasting, public speaking",
      whyInterestedResponses: [
        "I want to help officers navigate career transitions.",
        "Leadership development is my passion.",
      ],
      careerAdvice: "Build your network before you need it.",
      preferredMenteeCareerStages: ["senior-officers", "transitioning"],
      preferredMeetingFormat: "virtual",
      hoursPerMonthCommitment: 2,
    },
  },
  {
    user: {
      id: "test-mentor-04",
      name: "David Kim",
      email: "david.kim@test.com",
      rank: "Captain",
      positionType: "active",
      location: "Joint Base Lewis-McChord, WA",
    },
    mentor: {
      yearsOfService: 8,
      strengths: ["technology", "innovation", "project-management"],
      personalInterests: "coding, gaming, hiking in the Pacific Northwest",
      whyInterestedResponses: [
        "I want to bring tech skills to the military.",
        "Innovation requires mentorship and collaboration.",
      ],
      careerAdvice: "Embrace change and continuous learning.",
      preferredMenteeCareerStages: ["junior-officers", "junior-ncos"],
      preferredMeetingFormat: "virtual",
      hoursPerMonthCommitment: 5,
    },
  },
  {
    user: {
      id: "test-mentor-05",
      name: "Maria Rodriguez",
      email: "maria.rodriguez@test.com",
      rank: "Master Sergeant",
      positionType: "active",
      location: "Fort Hood, TX",
    },
    mentor: {
      yearsOfService: 20,
      strengths: ["resilience", "communication", "cultural-awareness"],
      personalInterests: "salsa dancing, cooking, community volunteering",
      whyInterestedResponses: [
        "I overcame many challenges and want to help others do the same.",
        "Diversity makes our force stronger.",
      ],
      careerAdvice: "Your background is your strength, not a limitation.",
      preferredMenteeCareerStages: [
        "new-soldiers",
        "junior-ncos",
        "transitioning",
      ],
      preferredMeetingFormat: "hybrid",
      hoursPerMonthCommitment: 4,
    },
  },
  {
    user: {
      id: "test-mentor-06",
      name: "Robert Thompson",
      email: "robert.thompson@test.com",
      rank: "Colonel",
      positionType: "part-time",
      location: "Pentagon, VA",
    },
    mentor: {
      yearsOfService: 25,
      strengths: ["strategic-vision", "policy", "organizational-change"],
      personalInterests: "golf, reading biographies, mentoring veterans",
      whyInterestedResponses: [
        "Senior leaders must invest in the next generation.",
        "The Guard needs strategic thinkers.",
      ],
      careerAdvice: "Think two levels up, act one level down.",
      preferredMenteeCareerStages: ["senior-officers"],
      preferredMeetingFormat: "virtual",
      hoursPerMonthCommitment: 2,
    },
  },
  {
    user: {
      id: "test-mentor-07",
      name: "Ashley Brown",
      email: "ashley.brown@test.com",
      rank: "Staff Sergeant",
      positionType: "active",
      location: "Fort Benning, GA",
    },
    mentor: {
      yearsOfService: 10,
      strengths: ["fitness", "mental-toughness", "team-motivation"],
      personalInterests: "CrossFit, mountain biking, nutrition coaching",
      whyInterestedResponses: [
        "Physical and mental readiness go hand in hand.",
        "I want to help soldiers build holistic wellness.",
      ],
      careerAdvice: "Take care of your body and mind first.",
      preferredMenteeCareerStages: ["new-soldiers", "junior-ncos"],
      preferredMeetingFormat: "in-person",
      hoursPerMonthCommitment: 6,
    },
  },
  {
    user: {
      id: "test-mentor-08",
      name: "Michael Lee",
      email: "michael.lee@test.com",
      rank: "Chief Warrant Officer 3",
      positionType: "active",
      location: "Fort Rucker, AL",
    },
    mentor: {
      yearsOfService: 16,
      strengths: ["technical-expertise", "aviation", "safety-culture"],
      personalInterests: "flying drones, photography, home brewing",
      whyInterestedResponses: [
        "Warrant officers have unique perspectives to share.",
        "Technical excellence requires dedicated mentorship.",
      ],
      careerAdvice: "Become the expert everyone turns to.",
      preferredMenteeCareerStages: ["junior-ncos", "senior-ncos"],
      preferredMeetingFormat: "hybrid",
      hoursPerMonthCommitment: 3,
    },
  },
  {
    user: {
      id: "test-mentor-09",
      name: "Emily Davis",
      email: "emily.davis@test.com",
      rank: "First Lieutenant",
      positionType: "part-time",
      location: "Boston, MA",
    },
    mentor: {
      yearsOfService: 4,
      strengths: [
        "work-life-balance",
        "civilian-military-integration",
        "education",
      ],
      personalInterests: "yoga, graduate school, startup culture",
      whyInterestedResponses: [
        "Balancing civilian career and Guard service is challenging but rewarding.",
        "I want to help others navigate dual careers.",
      ],
      careerAdvice: "Your civilian skills enhance your military value.",
      preferredMenteeCareerStages: ["new-soldiers", "junior-officers"],
      preferredMeetingFormat: "virtual",
      hoursPerMonthCommitment: 2,
    },
  },
  {
    user: {
      id: "test-mentor-10",
      name: "James Wilson",
      email: "james.wilson@test.com",
      rank: "Sergeant Major",
      positionType: "active",
      location: "Fort Sill, OK",
    },
    mentor: {
      yearsOfService: 28,
      strengths: ["tradition", "discipline", "institutional-knowledge"],
      personalInterests: "hunting, restoring classic cars, history",
      whyInterestedResponses: [
        "The NCO corps is the backbone of the Army.",
        "I want to preserve our traditions while embracing change.",
      ],
      careerAdvice: "Standards are non-negotiable.",
      preferredMenteeCareerStages: ["junior-ncos", "senior-ncos"],
      preferredMeetingFormat: "in-person",
      hoursPerMonthCommitment: 4,
    },
  },
  {
    user: {
      id: "test-mentor-11",
      name: "Nicole Martinez",
      email: "nicole.martinez@test.com",
      rank: "Major",
      positionType: "part-time",
      location: "San Antonio, TX",
    },
    mentor: {
      yearsOfService: 11,
      strengths: ["healthcare", "logistics", "crisis-management"],
      personalInterests: "marathon running, medical volunteering, gardening",
      whyInterestedResponses: [
        "Medical readiness is mission critical.",
        "I want to mentor future medical leaders.",
      ],
      careerAdvice: "Healthcare in the military is uniquely rewarding.",
      preferredMenteeCareerStages: ["junior-officers", "transitioning"],
      preferredMeetingFormat: "virtual",
      hoursPerMonthCommitment: 3,
    },
  },
  {
    user: {
      id: "test-mentor-12",
      name: "Christopher Anderson",
      email: "chris.anderson@test.com",
      rank: "Sergeant",
      positionType: "active",
      location: "Fort Carson, CO",
    },
    mentor: {
      yearsOfService: 6,
      strengths: ["peer-mentoring", "combat-skills", "adaptability"],
      personalInterests: "snowboarding, rock climbing, video games",
      whyInterestedResponses: [
        "I recently went through the challenges new soldiers face.",
        "Peer mentoring is often more relatable.",
      ],
      careerAdvice: "Ask questions and seek feedback constantly.",
      preferredMenteeCareerStages: ["new-soldiers"],
      preferredMeetingFormat: "in-person",
      hoursPerMonthCommitment: 5,
    },
  },
  {
    user: {
      id: "test-mentor-13",
      name: "Patricia Taylor",
      email: "patricia.taylor@test.com",
      rank: "Lieutenant Colonel",
      positionType: "active",
      location: "Fort Leavenworth, KS",
    },
    mentor: {
      yearsOfService: 19,
      strengths: ["education", "doctrine", "writing"],
      personalInterests: "writing, teaching, book clubs",
      whyInterestedResponses: [
        "Professional military education shapes leaders.",
        "I want to help officers develop their intellectual edge.",
      ],
      careerAdvice: "Read widely and write clearly.",
      preferredMenteeCareerStages: ["junior-officers", "senior-officers"],
      preferredMeetingFormat: "hybrid",
      hoursPerMonthCommitment: 3,
    },
  },
  {
    user: {
      id: "test-mentor-14",
      name: "Daniel Garcia",
      email: "daniel.garcia@test.com",
      rank: "First Sergeant",
      positionType: "active",
      location: "Fort Bliss, TX",
    },
    mentor: {
      yearsOfService: 22,
      strengths: ["unit-leadership", "soldier-care", "administration"],
      personalInterests: "BBQ competitions, family activities, coaching",
      whyInterestedResponses: [
        "First Sergeants shape unit culture.",
        "I want to develop future senior NCOs.",
      ],
      careerAdvice:
        "Take care of your soldiers and they will take care of the mission.",
      preferredMenteeCareerStages: ["junior-ncos", "senior-ncos"],
      preferredMeetingFormat: "in-person",
      hoursPerMonthCommitment: 4,
    },
  },
  {
    user: {
      id: "test-mentor-15",
      name: "Stephanie White",
      email: "stephanie.white@test.com",
      rank: "Captain",
      positionType: "part-time",
      location: "Chicago, IL",
    },
    mentor: {
      yearsOfService: 7,
      strengths: ["finance", "entrepreneurship", "transition-planning"],
      personalInterests: "investing, startups, traveling",
      whyInterestedResponses: [
        "Financial literacy is crucial for soldiers.",
        "I want to help with civilian career transitions.",
      ],
      careerAdvice: "Start planning your transition on day one.",
      preferredMenteeCareerStages: ["transitioning", "senior-ncos"],
      preferredMeetingFormat: "virtual",
      hoursPerMonthCommitment: 2,
    },
  },
];

// Test mentee who wants career guidance and leadership development
const TEST_MENTEE: { user: SeedUserInput; mentee: MenteeInput } = {
  user: {
    id: "test-mentee-main",
    name: "Alex Turner",
    email: "alex.turner@test.com",
    rank: "Specialist",
    positionType: "active",
    location: "Fort Bragg, NC",
  },
  mentee: {
    learningGoals:
      "I want to develop my leadership skills and prepare for NCO responsibilities. Looking for guidance on career progression and work-life balance.",
    experienceLevel: "mid-level",
    preferredMentorType: "leadership",
    personalInterests: "fitness, reading, technology, team sports",
    roleModelInspiration:
      "My squad leader who always puts soldiers first while maintaining high standards.",
    hopeToGainResponses: [
      "Leadership development and communication skills",
      "Career planning and progression guidance",
      "Work-life balance strategies",
      "Networking within the Guard",
    ],
    mentorQualities: [
      "strong-communicator",
      "experienced-leader",
      "encouraging-and-empathetic",
    ],
    preferredMeetingFormat: "hybrid",
    hoursPerMonthCommitment: 3,
  },
};

// Second test mentee focused on tech/transition
const TEST_MENTEE_TECH: { user: SeedUserInput; mentee: MenteeInput } = {
  user: {
    id: "test-mentee-tech",
    name: "Jordan Rivera",
    email: "jordan.rivera@test.com",
    rank: "Sergeant",
    positionType: "part-time",
    location: "Seattle, WA",
  },
  mentee: {
    learningGoals:
      "Transitioning to a tech career while maintaining Guard service. Need help balancing civilian tech job with military duties.",
    experienceLevel: "experienced",
    preferredMentorType: "technology",
    personalInterests: "coding, gaming, hiking, startup culture",
    roleModelInspiration:
      "Tech leaders who successfully balance civilian careers with military service.",
    hopeToGainResponses: [
      "Tech career guidance",
      "Civilian-military balance",
      "Networking in tech industry",
      "Education opportunities",
    ],
    mentorQualities: [
      "creative-problem-solver",
      "open-minded-and-approachable",
      "motivated-and-ambitious",
    ],
    preferredMeetingFormat: "virtual",
    hoursPerMonthCommitment: 2,
  },
};

async function clearTestData() {
  console.log("Clearing existing test data...");

  // Get all test user IDs
  const testUserIds = [
    ...MENTOR_DATA.map((m) => m.user.id),
    TEST_MENTEE.user.id,
    TEST_MENTEE_TECH.user.id,
  ];

  // Delete in order due to foreign key constraints
  for (const userId of testUserIds) {
    await db
      .delete(mentorRecommendations)
      .where(eq(mentorRecommendations.userId, userId));
    await db
      .delete(mentorshipMatches)
      .where(eq(mentorshipMatches.requestorUserId, userId));
    await db
      .delete(mentorshipMatches)
      .where(eq(mentorshipMatches.mentorUserId, userId));
    await db.delete(mentees).where(eq(mentees.userId, userId));
    await db.delete(mentors).where(eq(mentors.userId, userId));
    await db.delete(account).where(eq(account.userId, userId));
    await db.delete(users).where(eq(users.id, userId));
  }
}

async function seedMentors() {
  console.log("\nCreating 15 mentors with diverse profiles...");
  const matchingService = new MatchingService();

  for (const data of MENTOR_DATA) {
    const user = await ensureUser(data.user);
    await ensureMentor(user.id, data.mentor);

    // Generate embeddings for this mentor
    await matchingService.createOrUpdateMentorEmbeddings({
      userId: user.id,
      whyInterestedResponses: data.mentor.whyInterestedResponses,
      strengths: data.mentor.strengths,
      personalInterests: data.mentor.personalInterests,
      careerAdvice: data.mentor.careerAdvice,
    });

    console.log(
      `  ✓ ${data.user.name} (${data.user.rank}) - ${data.mentor.preferredMeetingFormat}, ${data.mentor.hoursPerMonthCommitment}h/mo`,
    );
  }
}

async function seedMentees() {
  console.log("\nCreating test mentees...");
  const matchingService = new MatchingService();

  // Main test mentee
  const mentee1 = await ensureUser(TEST_MENTEE.user);
  await ensureMentee(mentee1.id, TEST_MENTEE.mentee);
  await matchingService.createOrUpdateMenteeEmbeddings({
    userId: mentee1.id,
    learningGoals: TEST_MENTEE.mentee.learningGoals,
    personalInterests: TEST_MENTEE.mentee.personalInterests,
    roleModelInspiration: TEST_MENTEE.mentee.roleModelInspiration,
    hopeToGainResponses: TEST_MENTEE.mentee.hopeToGainResponses,
    mentorQualities: TEST_MENTEE.mentee.mentorQualities,
  });
  console.log(`  ✓ ${TEST_MENTEE.user.name} (leadership-focused mentee)`);

  // Tech-focused test mentee
  const mentee2 = await ensureUser(TEST_MENTEE_TECH.user);
  await ensureMentee(mentee2.id, TEST_MENTEE_TECH.mentee);
  await matchingService.createOrUpdateMenteeEmbeddings({
    userId: mentee2.id,
    learningGoals: TEST_MENTEE_TECH.mentee.learningGoals,
    personalInterests: TEST_MENTEE_TECH.mentee.personalInterests,
    roleModelInspiration: TEST_MENTEE_TECH.mentee.roleModelInspiration,
    hopeToGainResponses: TEST_MENTEE_TECH.mentee.hopeToGainResponses,
    mentorQualities: TEST_MENTEE_TECH.mentee.mentorQualities,
  });
  console.log(`  ✓ ${TEST_MENTEE_TECH.user.name} (tech-focused mentee)`);
}

async function generateRecommendations() {
  console.log("\nGenerating mentor recommendations...");
  const matchingService = new MatchingService();

  // Find the actual user IDs by email
  const [mentee1User] = await db
    .select()
    .from(users)
    .where(eq(users.email, TEST_MENTEE.user.email))
    .limit(1);

  const [mentee2User] = await db
    .select()
    .from(users)
    .where(eq(users.email, TEST_MENTEE_TECH.user.email))
    .limit(1);

  if (!mentee1User || !mentee2User) {
    throw new Error("Test mentees not found - run seedMentees first");
  }

  // Generate for main mentee
  console.log(`  Generating for ${TEST_MENTEE.user.name}...`);
  await matchingService.generateMentorRecommendations(mentee1User.id);

  // Generate for tech mentee
  console.log(`  Generating for ${TEST_MENTEE_TECH.user.name}...`);
  await matchingService.generateMentorRecommendations(mentee2User.id);

  // Fetch and display results
  const [recs1] = await db
    .select()
    .from(mentorRecommendations)
    .where(eq(mentorRecommendations.userId, mentee1User.id))
    .limit(1);

  const [recs2] = await db
    .select()
    .from(mentorRecommendations)
    .where(eq(mentorRecommendations.userId, mentee2User.id))
    .limit(1);

  console.log(
    `\n  ${TEST_MENTEE.user.name}'s recommendations: ${recs1?.recommendedMentorIds?.length ?? 0} mentors`,
  );
  console.log(
    `  ${TEST_MENTEE_TECH.user.name}'s recommendations: ${recs2?.recommendedMentorIds?.length ?? 0} mentors`,
  );
}

/**
 * Seeds test data for mentor recommendations.
 * Creates 15 mentors with diverse profiles and 2 test mentees.
 * Generates embeddings and recommendations to test the hybrid algorithm.
 *
 * Usage:
 *   cd server
 *   npx tsx --env-file=.env scripts/test-recommendations.ts
 *
 * To clear and reseed:
 *   npx tsx --env-file=.env scripts/test-recommendations.ts --clear
 */
async function main() {
  const shouldClear = process.argv.includes("--clear");

  console.log("=".repeat(60));
  console.log("Mentor Recommendation Test Data Seeder");
  console.log("=".repeat(60));

  await connectPostgres();

  if (shouldClear) {
    await clearTestData();
  }

  await seedMentors();
  await seedMentees();
  await generateRecommendations();

  console.log(`\n${"=".repeat(60)}`);
  console.log("SEED COMPLETE!");
  console.log("=".repeat(60));
  console.log("\nTest accounts created:");
  console.log(`  Mentee 1: ${TEST_MENTEE.user.email} (leadership-focused)`);
  console.log(`  Mentee 2: ${TEST_MENTEE_TECH.user.email} (tech-focused)`);
  console.log(`\nPassword for all accounts: ${DEFAULT_PASSWORD}`);
  console.log(
    "\nLog in as a mentee to see their personalized mentor recommendations.",
  );
  console.log("The algorithm should rank mentors based on:");
  console.log("  - Vector similarity (embeddings match)");
  console.log("  - Meeting format compatibility");
  console.log("  - Hours commitment compatibility");
  console.log("  - Mentor load balancing");
}

main()
  .catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await shutdownPostgres();
  });
