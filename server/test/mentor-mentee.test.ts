import { describe, expect, it, vi } from "vitest";
import { MenteeRepository } from "@/data/repository/mentee-repo.js";
import { MentorRepository } from "@/data/repository/mentor-repo.js";

// Mock the database
vi.mock("../src/data/db/sql.js", () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    }),
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([
          {
            mentorId: 1,
            userId: "test-user",
            mentorshipPreferences: "Leadership",
            rank: "Captain",
            yearsOfService: 5,
            eligibilityData: null,
            status: "requested",
          },
        ]),
      }),
    }),
  },
}));

describe("Mentor/Mentee Endpoints", () => {
  it("should create mentor successfully", async () => {
    const mentorRepo = new MentorRepository();

    const result = await mentorRepo.createMentor(
      "test-user",
      "Leadership development",
      "Captain",
      5,
      { clearance: "Secret" },
      "requested",
    );

    expect(result).toEqual({
      mentorId: 1,
      userId: "test-user",
      mentorshipPreferences: "Leadership",
      rank: "Captain",
      yearsOfService: 5,
      eligibilityData: null,
      status: "requested",
    });
  });

  it("should create mentee successfully", async () => {
    const menteeRepo = new MenteeRepository();

    const result = await menteeRepo.createMentee(
      "test-user",
      "Learn leadership skills",
      "Junior",
      "Senior Officer",
      "active",
    );

    expect(result).toBeDefined();
    expect(result.userId).toBe("test-user");
  });
});
