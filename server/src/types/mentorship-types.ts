import { z } from "zod";
import type { GetMenteeOutput } from "../types/mentee-types.js";
import type { GetMentorOutput } from "../types/mentor-types.js";

export type MatchStatus = "pending" | "accepted" | "declined";

export type MentorshipMatch = {
  matchId: number;
  requestorUserId: string;
  mentorUserId: string;
  status: MatchStatus;
  matchedAt: string | Date;
  message?: string; // Optional personalized message from mentee to mentor
};

// For mentee's "Your Mentor" section
export type SuggestedMentor = {
  mentor: GetMentorOutput;
  status: "active" | "pending" | "suggested"; // active means matched
  hasRequested?: boolean;
};

export type MatchedMentor = {
  mentor: GetMentorOutput;
  matchId: number;
  status: MatchStatus;
  matchedAt: string | Date;
};

// For mentor's "Your Mentee" section
export type PendingMenteeRequest = {
  mentee: GetMenteeOutput;
  matchId: number;
  status: MatchStatus;
  matchedAt: string | Date;
};

export type PendingMentorRequest = {
  mentor: GetMentorOutput;
  matchId: number;
  status: MatchStatus;
  matchedAt: string | Date;
};

export type MatchedMentee = {
  mentee: GetMenteeOutput;
  matchId: number;
  status: MatchStatus;
  matchedAt: string | Date;
};

/**
 * Aggregated mentorship data returned to the frontend.
 *
 * NOTE: `GetMentorOutput` and `GetMenteeOutput` now include selected fields
 * from the associated `users` record (name, contact, rank/position, image,
 * location). Callers can rely on those fields being present when a user
 * profile exists, without making additional user API calls.
 */
export type MentorshipDataOutput = {
  mentor: {
    activeMentees: GetMenteeOutput[];
    profile: GetMentorOutput | null;
  } | null;
  mentee: {
    mentorRecommendations: SuggestedMentor[];
    activeMentors: GetMentorOutput[];
    profile: GetMenteeOutput | null;
  } | null;
};

export const getMentorshipDataInputSchema = z.object({
  userId: z.string(),
});

export type GetMentorshipDataInput = z.infer<
  typeof getMentorshipDataInputSchema
>;
