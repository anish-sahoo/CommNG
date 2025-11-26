import { z } from "zod";
import type { GetMenteeOutput } from "@/types/mentee-types.js";
import type { GetMentorOutput } from "@/types/mentor-types.js";

export type MatchStatus = "pending" | "accepted" | "declined";

export type MentorshipMatch = {
  matchId: number;
  requestorUserId: string;
  mentorUserId: string;
  status: MatchStatus;
  matchedAt: string | Date;
};

// For mentee's "Your Mentor" section
export type SuggestedMentor = {
  mentor: GetMentorOutput;
  hasRequested: boolean; // Whether the mentee has requested this mentor
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

export type MatchedMentee = {
  mentee: GetMenteeOutput;
  matchId: number;
  status: MatchStatus;
  matchedAt: string | Date;
};

export type MentorshipDataOutput = {
  // User's own profiles
  mentor: GetMentorOutput | null;
  mentee: GetMenteeOutput | null;
  
  // Legacy matches array (all matches user is involved in)
  matches: MentorshipMatch[];
  
  // MENTEE VIEW: "Your Mentor" section
  suggestedMentors?: SuggestedMentor[]; // Case 2: Suggested mentors with request status
  matchedMentors?: MatchedMentor[]; // Case 3: Accepted matches with full mentor info
  
  // MENTOR VIEW: "Your Mentee" section
  pendingMenteeRequests?: PendingMenteeRequest[]; // Case 2: Mentees who requested this mentor (status: pending)
  matchedMentees?: MatchedMentee[]; // Case 3: Accepted mentees (status: accepted, can coexist with pending)
};

export const getMentorshipDataInputSchema = z.object({
  userId: z.string(),
});

export type GetMentorshipDataInput = z.infer<
  typeof getMentorshipDataInputSchema
>;
