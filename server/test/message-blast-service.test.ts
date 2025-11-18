import { describe, expect, it } from "vitest";
import type { MessageBlastRepository } from "@/data/repository/message-blast-repo.js";
import type { UserRepository } from "@/data/repository/user-repo.js";
import { MessageBlastService } from "@/service/message-blast-service.js";
import type { TargetAudience } from "@/types/message-blast-types.js";

function createMockBlast(
  overrides: Partial<{
    blastId: number;
    senderId: string;
    status: "draft" | "sent" | "failed";
    validUntil: Date;
    targetAudience: TargetAudience | null;
  }> = {},
) {
  return {
    blastId: overrides.blastId ?? 1,
    senderId: overrides.senderId ?? "creator-id",
    title: "A broadcast",
    content: "Message content",
    targetAudience: overrides.targetAudience ?? null,
    sentAt: overrides.status === "sent" ? new Date() : null,
    validUntil:
      overrides.validUntil ?? new Date(Date.now() + 24 * 60 * 60 * 1000),
    status: overrides.status ?? "sent",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe("MessageBlastService.getActiveBlastsForUser", () => {
  it("always returns blasts created by the current user", async () => {
    const mockRepo: Pick<MessageBlastRepository, "getMessageBlastsForUser"> = {
      async getMessageBlastsForUser(_query, userId) {
        return [
          createMockBlast({
            blastId: 1,
            senderId: userId ?? "creator-id",
            status: "sent",
            targetAudience: {
              army: { ranks: [], departments: [] },
              airforce: { ranks: [], departments: [] },
            },
          }),
        ];
      },
    };

    const mockUserRepo: Pick<UserRepository, "getUserData"> = {
      async getUserData() {
        return {
          id: "creator-id",
          name: "Creator",
          email: "creator@example.com",
          phoneNumber: null,
          branch: "army",
          rank: "Private",
          department: "Logistics",
          createdAt: new Date(),
          updatedAt: new Date(),
          image: null,
        };
      },
    };

    const service = new MessageBlastService(
      mockRepo as MessageBlastRepository,
      mockUserRepo as UserRepository,
    );

    const blasts = await service.getActiveBlastsForUser("creator-id");

    expect(blasts).toHaveLength(1);
    expect(blasts[0]?.blastId).toBe(1);
  });
});
