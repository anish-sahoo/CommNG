import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthRepository } from "../src/data/repository/auth-repo.js";
import { PolicyEngine } from "../src/service/policy-engine.js";

vi.mock("../src/data/db/redis.js", () => {
  const mockRedisClient = {
    sIsMember: vi.fn().mockResolvedValue(0),
    multi: vi.fn(() => ({
      sAdd: vi.fn(),
      expire: vi.fn(),
      del: vi.fn(),
      exec: vi.fn().mockResolvedValue([]),
    })),
  };

  return {
    getRedisClientInstance: vi.fn(() => mockRedisClient),
  };
});

vi.mock("../src/utils/logger.js", () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

describe("PolicyEngine", () => {
  let policyEngine: PolicyEngine;
  let mockAuthRepository: AuthRepository;

  beforeEach(() => {
    mockAuthRepository = {
      getUserIdsForRole: vi.fn(async (roleKey: string) => {
        const roleUserMap: Record<string, number[]> = {
          "channel:1:read": [1, 2, 3],
          "channel:1:admin": [1],
          "channel:2:read": [2, 3],
          "feature:reporting:read": [1, 2],
          "global:admin": [1],
        };
        return roleUserMap[roleKey] || [];
      }),

      getRolesForUser: vi.fn(async (userId: number) => {
        const userRolesMap: Record<number, string[]> = {
          1: [
            "channel:1:read",
            "channel:1:admin",
            "feature:reporting:read",
            "global:admin",
          ],
          2: ["channel:1:read", "channel:2:read", "feature:reporting:read"],
          3: ["channel:1:read", "channel:2:read"],
          4: [], // User with no roles
          5: ["global:admin"], // User with ONLY global:admin
        };
        return userRolesMap[userId] || [];
      }),

      getRoles: vi.fn(async (_limit: number = 5000) => {
        return [
          "channel:1:read",
          "channel:1:admin",
          "channel:2:read",
          "feature:reporting:read",
          "feature:reporting:write",
          "global:admin",
        ];
      }),

      getRoleId: vi.fn(async (roleKey: string) => {
        const roleIdMap: Record<string, number> = {
          "channel:1:read": 1,
          "channel:1:admin": 2,
          "channel:2:read": 3,
          "feature:reporting:read": 4,
          "feature:reporting:write": 5,
          "global:admin": 6,
        };
        return roleIdMap[roleKey] ?? -1;
      }),

      checkIfUserExists: vi.fn(async (userId: number) => {
        return [1, 2, 3, 4, 5].includes(userId);
      }),

      grantAccess: vi.fn(async () => true),
    } as unknown as AuthRepository;

    policyEngine = new PolicyEngine(mockAuthRepository);

    vi.clearAllMocks();
  });

  describe("validate", () => {
    it("should return true when user has the exact role", async () => {
      const result = await policyEngine.validate("1", "channel:1:read");
      expect(result).toBe(true);
    });

    it("should return true when user has admin role for the resource", async () => {
      // User 1 has channel:1:admin, so they should have access to channel:1:post
      const result = await policyEngine.validate("1", "channel:1:post");
      expect(result).toBe(true);
    });

    it("should return false when user does not have the role", async () => {
      // User 4 has no roles
      const result = await policyEngine.validate("4", "channel:1:read");
      expect(result).toBe(false);
    });

    it("should return false when user does not have access to a specific channel", async () => {
      // User 3 does not have access to channel:3
      const result = await policyEngine.validate("3", "channel:3:read");
      expect(result).toBe(false);
    });

    it("should check admin permissions with correct namespace parsing", async () => {
      // User 1 has channel:1:admin, which should grant access to channel:1:read if it exists
      const result = await policyEngine.validate("1", "channel:1:read");
      expect(result).toBe(true);
    });

    it("should handle feature namespace roles", async () => {
      const result = await policyEngine.validate("1", "feature:reporting:read");
      expect(result).toBe(true);
    });

    it("should return true for global:admin users regardless of role existence", async () => {
      // User 1 has global:admin, should have access to any role (even non-existent)
      const result = await policyEngine.validate("1", "non:existent:role");
      expect(result).toBe(true);
    });

    it("should return false for non-global:admin users on non-existent roles", async () => {
      // User 2 does not have global:admin
      const result = await policyEngine.validate("2", "non:existent:role");
      expect(result).toBe(false);
    });

    it("should call authRepository.getRolesForUser", async () => {
      await policyEngine.validate("2", "channel:1:read");
      expect(mockAuthRepository.getRolesForUser).toHaveBeenCalledWith("2");
    });

    it("should always check if role exists via getRoleId first", async () => {
      await policyEngine.validate("1", "channel:1:read");
      expect(mockAuthRepository.getRoleId).toHaveBeenCalledWith(
        "channel:1:read",
      );
    });

    it("should grant admin access for any action in the same namespace", async () => {
      // User 1 has channel:1:admin, should have access to any channel:1:* action
      const result1 = await policyEngine.validate("1", "channel:1:write");
      const result2 = await policyEngine.validate("1", "channel:1:delete");
      const result3 = await policyEngine.validate("1", "channel:1:custom");
      
      expect(result1).toBe(true);
      expect(result2).toBe(true);
      expect(result3).toBe(true);
    });
  });

  describe("populateCache", () => {
    it("should call getRoles with default limit", async () => {
      await policyEngine.populateCache();
      expect(mockAuthRepository.getRoles).toHaveBeenCalledWith(5000);
    });

    it("should call getRoles with custom limit", async () => {
      await policyEngine.populateCache(3600, 1000);
      expect(mockAuthRepository.getRoles).toHaveBeenCalledWith(1000);
    });

    it("should call getUserIdsForRole for each role", async () => {
      await policyEngine.populateCache();

      expect(mockAuthRepository.getUserIdsForRole).toHaveBeenCalledWith(
        "channel:1:read",
      );
      expect(mockAuthRepository.getUserIdsForRole).toHaveBeenCalledWith(
        "channel:1:admin",
      );
      expect(mockAuthRepository.getUserIdsForRole).toHaveBeenCalledWith(
        "channel:2:read",
      );
      expect(mockAuthRepository.getUserIdsForRole).toHaveBeenCalledWith(
        "feature:reporting:read",
      );
    });

    it("should handle errors gracefully", async () => {
      mockAuthRepository.getRoles = vi
        .fn()
        .mockRejectedValue(new Error("Database error"));
      await expect(policyEngine.populateCache()).resolves.not.toThrow();
    });

    it("should use default TTL when not provided", async () => {
      await policyEngine.populateCache();
      expect(mockAuthRepository.getRoles).toHaveBeenCalled();
    });

    it("should accept custom TTL parameter", async () => {
      const customTTL = 7200;
      await policyEngine.populateCache(customTTL);
      expect(mockAuthRepository.getRoles).toHaveBeenCalled();
    });
  });

  describe("validate - edge cases", () => {
    it("should handle empty roleKey", async () => {
      const result = await policyEngine.validate("1", "");
      expect(result).toBe(false);
    });

    it("should handle roleKey without colons", async () => {
      // User 1 has global:admin, so will have access even to invalid role keys
      const result = await policyEngine.validate("1", "invalidrolekey");
      expect(result).toBe(true);
      
      // User without global:admin should not have access
      const result2 = await policyEngine.validate("2", "invalidrolekey");
      expect(result2).toBe(false);
    });

    it("should handle roleKey with multiple colons correctly", async () => {
      // Test that admin role parsing works with complex role keys
      // First add the role to the system
      mockAuthRepository.getRoleId = vi.fn(async (roleKey: string) => {
        if (roleKey === "namespace:subject:subsection:read") return 99;
        const roleIdMap: Record<string, number> = {
          "channel:1:read": 1,
          "channel:1:admin": 2,
          "channel:2:read": 3,
          "feature:reporting:read": 4,
          "feature:reporting:write": 5,
          "global:admin": 6,
        };
        return roleIdMap[roleKey] ?? -1;
      });

      mockAuthRepository.getRolesForUser = vi.fn(async () => [
        "namespace:subject:subsection:admin",
      ]);

      const result = await policyEngine.validate(
        "1",
        "namespace:subject:subsection:read",
      );
      expect(result).toBe(true);
    });

    it("should not grant admin access across different namespaces (unless global:admin)", async () => {
      // User 2 has channel:1:read but not channel:2:admin
      const result = await policyEngine.validate("2", "channel:2:write");
      expect(result).toBe(false);
    });

    it("should handle global admin role", async () => {
      const result = await policyEngine.validate("1", "global:admin");
      expect(result).toBe(true);
    });

    it("should grant global:admin users access to existing roles they don't explicitly have", async () => {
      // User 1 has global:admin but not channel:2:read explicitly
      const result = await policyEngine.validate("1", "channel:2:read");
      expect(result).toBe(true);
    });

    it("should grant global:admin users access to all existing feature roles", async () => {
      // User 1 has global:admin, should have access to existing feature roles
      const result1 = await policyEngine.validate(
        "1",
        "feature:reporting:write",
      );

      expect(result1).toBe(true);
    });
  });

  describe("caching behavior", () => {
    it("should check redis cache before querying database", async () => {
      const { getRedisClientInstance } = await import(
        "../src/data/db/redis.js"
      );

      await policyEngine.validate("1", "channel:1:read");

      expect(getRedisClientInstance().sIsMember).toHaveBeenCalledWith(
        "role:channel:1:read:users",
        "1",
      );
    });

    it("should query database when redis returns 0 (not found)", async () => {
      await policyEngine.validate("1", "channel:1:read");

      expect(mockAuthRepository.getRolesForUser).toHaveBeenCalledWith("1");
    });

    it("should return true immediately when redis returns 1 (found)", async () => {
      const { getRedisClientInstance } = await import(
        "../src/data/db/redis.js"
      );
      vi.mocked(getRedisClientInstance().sIsMember).mockResolvedValueOnce(1);

      const result = await policyEngine.validate("1", "channel:1:read");

      expect(result).toBe(true);
      // Should not call database when found in cache
      expect(mockAuthRepository.getRolesForUser).not.toHaveBeenCalled();
    });
  });

  describe("global:admin superuser access", () => {
    it("should grant access to any role, even non-existent ones", async () => {
      // User 5 has ONLY global:admin
      // Should have access to any role, even if it doesn't exist
      const result = await policyEngine.validate("5", "channel:2:read");
      expect(result).toBe(true);
    });

    it("should grant access to existing feature roles", async () => {
      // User 5 has ONLY global:admin
      const result = await policyEngine.validate(
        "5",
        "feature:reporting:write",
      );
      expect(result).toBe(true);
    });

    it("should grant access to completely non-existent roles", async () => {
      // User 5 has global:admin, should have access even to non-existent roles
      const result1 = await policyEngine.validate("5", "mentor:999:admin");
      const result2 = await policyEngine.validate(
        "5",
        "anything:something:somewhere",
      );

      expect(result1).toBe(true);
      expect(result2).toBe(true);
    });

    it("should work when combined with other roles", async () => {
      // User 1 has global:admin + other specific roles
      const results = await Promise.all([
        policyEngine.validate("1", "channel:2:read"),
        policyEngine.validate("1", "feature:reporting:write"),
        policyEngine.validate("1", "unknown:namespace:admin"),
      ]);

      expect(results).toEqual([true, true, true]);
    });

    it("should not grant access to users without global:admin for non-assigned roles", async () => {
      // User 2 does NOT have global:admin and doesn't have this specific role
      const result = await policyEngine.validate(
        "2",
        "feature:reporting:write",
      );
      expect(result).toBe(false);
    });

    it("should check if role exists in system via getRoleId for caching", async () => {
      await policyEngine.validate("5", "channel:2:read");

      // Should call getRoleId to check cache
      expect(mockAuthRepository.getRoleId).toHaveBeenCalledWith(
        "channel:2:read",
      );
    });
  });

  describe("multiple users and roles", () => {
    it("should validate different users correctly", async () => {
      const user1Result = await policyEngine.validate("1", "channel:1:read");
      const user2Result = await policyEngine.validate("2", "channel:1:read");
      const user3Result = await policyEngine.validate("3", "channel:1:read");
      const user4Result = await policyEngine.validate("4", "channel:1:read");

      expect(user1Result).toBe(true);
      expect(user2Result).toBe(true);
      expect(user3Result).toBe(true);
      expect(user4Result).toBe(false); // User 4 has no roles
    });

    it("should handle concurrent validation calls", async () => {
      const promises = [
        policyEngine.validate("1", "channel:1:read"),
        policyEngine.validate("2", "channel:2:read"),
        policyEngine.validate("3", "channel:1:read"),
      ];

      const results = await Promise.all(promises);

      expect(results).toEqual([true, true, true]);
    });
  });
});
