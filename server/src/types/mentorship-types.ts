import { z } from "zod";
import type { GetMenteeOutput } from "./mentee-types.js";
import type { GetMentorOutput } from "./mentor-types.js";

export type MentorshipMatch = {
  matchId: number;
  requestorUserId: string;
  mentorUserId: string;
  matchedAt: string | Date;
};

export type MentorshipDataOutput = {
  mentor: GetMentorOutput | null;
  mentee: GetMenteeOutput | null;
  matches: MentorshipMatch[];
};

export const getMentorshipDataInputSchema = z.object({
  userId: z.string(),
});

export type GetMentorshipDataInput = z.infer<
  typeof getMentorshipDataInputSchema
>;
