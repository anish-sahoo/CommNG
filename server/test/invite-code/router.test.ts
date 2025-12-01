import { TRPCError } from "@trpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { InviteCode } from "../../src/data/db/schema.js";
import {
  GLOBAL_ADMIN_KEY,
  GLOBAL_CREATE_INVITE_KEY,
  type RoleKey,
} from "../../src/data/roles.js";
import { inviteCodeRouter } from "../../src/routers/invite-codes.js";

const { mockInviteCodeRepo, mockAuthRepo } = vi.hoisted(() => {
  return {
    mockInviteCodeRepo: {
      createInviteCode: vi.fn(),
      getInviteCodeByCode: vi.fn(),
      getInviteCodeById: vi.fn(),
      markCodeAsUsed: vi.fn(),
      revokeCode: vi.fn(),
      listInviteCodes: vi.fn(),
      deleteExpiredCodes: vi.fn(),
    },
    mockAuthRepo: {
      getAllImpliedRolesForUser: vi.fn(),
      getRoleId: vi.fn(),
      grantAccessBulk: vi.fn(),
    },
  };
});

vi.mock("nanoid", () => ({
  customAlphabet: () => () => "TEST1234",
}));

vi.mock("../../src/utils/logger.js", () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock("../../src/data/repository/invite-code-repo.js", () => ({
  InviteCodeRepository: vi.fn(() => mockInviteCodeRepo),
}));

vi.mock("../../src/data/repository/auth-repo.js", () => ({
  AuthRepository: vi.fn(() => mockAuthRepo),
}));

function createMockContext(userId: string, roles: RoleKey[] = []) {
  return {
    auth: {
      user: {
        id: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        email: "test@example.com",
        emailVerified: true,
        name: "Test User",
        image: null,
        rank: "user",
        department: "user",
        branch: "user",
        phoneNumber: null,
        emailVisibility: "private",
        signalVisibility: "private",
        positionType: "active",
      },
      session: {
        id: "session-id",
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: userId,
        expiresAt: new Date(),
        token: "session-token",
      },
    },
    roles: new Set(roles),
  };
}

function createMockInviteCode(overrides: Partial<InviteCode> = {}): InviteCode {
  return {
    codeId: overrides.codeId ?? 1,
    code: overrides.code ?? "TEST1234",
    roleKeys: overrides.roleKeys ?? ["channel:1:read"],
    createdBy: overrides.createdBy ?? "admin-id",
    createdAt: overrides.createdAt ?? new Date(),
    expiresAt:
      overrides.expiresAt ?? new Date(Date.now() + 24 * 60 * 60 * 1000),
    usedBy: overrides.usedBy ?? null,
    usedAt: overrides.usedAt ?? null,
    revokedBy: overrides.revokedBy ?? null,
    revokedAt: overrides.revokedAt ?? null,
  };
}

describe("inviteCodeRouter", () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
  });

  describe("createInviteCode", () => {
    it("should create invite code for user with global:create-invite permission", async () => {
      const ctx = createMockContext("admin-id", [GLOBAL_CREATE_INVITE_KEY]);
      const mockCode = createMockInviteCode();

      mockAuthRepo.getAllImpliedRolesForUser.mockResolvedValue(
        new Set([GLOBAL_CREATE_INVITE_KEY]),
      );
      mockInviteCodeRepo.getInviteCodeByCode.mockResolvedValue(null);
      mockInviteCodeRepo.createInviteCode.mockResolvedValue(mockCode);

      const caller = inviteCodeRouter.createCaller(ctx);

      const result = await caller.createInviteCode({
        roleKeys: ["channel:1:read"],
        expiresInHours: 48,
      });

      expect(result.code).toBe("TEST1234");
      expect(result.roleKeys).toEqual(["channel:1:read"]);
    });

    it("should create invite code for user with global:admin permission", async () => {
      const ctx = createMockContext("admin-id", [
        GLOBAL_ADMIN_KEY,
        GLOBAL_CREATE_INVITE_KEY,
      ]);
      const mockCode = createMockInviteCode();

      mockAuthRepo.getAllImpliedRolesForUser.mockResolvedValue(
        new Set([GLOBAL_ADMIN_KEY, GLOBAL_CREATE_INVITE_KEY]),
      );
      mockInviteCodeRepo.getInviteCodeByCode.mockResolvedValue(null);
      mockInviteCodeRepo.createInviteCode.mockResolvedValue(mockCode);

      const caller = inviteCodeRouter.createCaller(ctx);

      const result = await caller.createInviteCode({
        roleKeys: ["channel:1:read"],
      });

      expect(result.code).toBe("TEST1234");
    });

    it("should throw FORBIDDEN for user without permission", async () => {
      const ctx = createMockContext("user-id", ["channel:1:read"]);
      const caller = inviteCodeRouter.createCaller(ctx);

      await expect(
        caller.createInviteCode({
          roleKeys: ["channel:1:read"],
        }),
      ).rejects.toThrow(TRPCError);
    });

    it("should throw UNAUTHORIZED for unauthenticated user", async () => {
      const ctx = { auth: null, roles: null };
      const caller = inviteCodeRouter.createCaller(ctx);

      await expect(
        caller.createInviteCode({
          roleKeys: ["channel:1:read"],
        }),
      ).rejects.toThrow(TRPCError);
    });
  });

  describe("validateInviteCode", () => {
    it("should validate a valid invite code (public endpoint)", async () => {
      const ctx = { auth: null, roles: null }; // Unauthenticated context
      const mockCode = createMockInviteCode();

      mockInviteCodeRepo.getInviteCodeByCode.mockResolvedValue(mockCode);

      const caller = inviteCodeRouter.createCaller(ctx);

      const result = await caller.validateInviteCode({
        code: "TEST1234",
      });

      expect(result.isValid).toBe(true);
      expect(
        (result as Extract<typeof result, { isValid: true }>).roleKeys,
      ).toEqual(["channel:1:read"]);
    });

    it("should return invalid for non-existent code", async () => {
      const ctx = { auth: null, roles: null };

      mockInviteCodeRepo.getInviteCodeByCode.mockResolvedValue(null);

      const caller = inviteCodeRouter.createCaller(ctx);

      const result = await caller.validateInviteCode({
        code: "NOTEXIST",
      });

      expect(result.isValid).toBe(false);
      expect(
        (result as Extract<typeof result, { isValid: false }>).message,
      ).toBe("Invalid invite code");
    });

    it("should return invalid for expired code", async () => {
      const ctx = { auth: null, roles: null };
      const mockCode = createMockInviteCode({
        expiresAt: new Date(Date.now() - 1000),
      });

      mockInviteCodeRepo.getInviteCodeByCode.mockResolvedValue(mockCode);

      const caller = inviteCodeRouter.createCaller(ctx);

      const result = await caller.validateInviteCode({
        code: "TEST1234",
      });

      expect(result.isValid).toBe(false);
      expect(
        (result as Extract<typeof result, { isValid: false }>).message,
      ).toContain("expired");
    });
  });

  describe("listInviteCodes", () => {
    it("should list codes for user with permission", async () => {
      const ctx = createMockContext("admin-id", [GLOBAL_CREATE_INVITE_KEY]);
      const mockCodes = [
        { ...createMockInviteCode(), status: "active" as const },
        { ...createMockInviteCode({ codeId: 2 }), status: "active" as const },
      ];

      mockAuthRepo.getAllImpliedRolesForUser.mockResolvedValue(
        new Set([GLOBAL_CREATE_INVITE_KEY]),
      );
      mockInviteCodeRepo.listInviteCodes.mockResolvedValue({
        data: mockCodes,
        totalCount: 2,
        hasMore: false,
        hasPrevious: false,
      });

      const caller = inviteCodeRouter.createCaller(ctx);

      const result = await caller.listInviteCodes({
        status: "active",
        limit: 50,
        offset: 0,
      });

      expect(result.data).toHaveLength(2);
      expect(result.data[0]?.status).toBe("active");
    });

    it("should throw FORBIDDEN for user without permission", async () => {
      const ctx = createMockContext("user-id", ["channel:1:read"]);
      const caller = inviteCodeRouter.createCaller(ctx);

      await expect(
        caller.listInviteCodes({
          limit: 50,
          offset: 0,
        }),
      ).rejects.toThrow(TRPCError);
    });
  });

  describe("revokeInviteCode", () => {
    it("should revoke code for user with permission", async () => {
      const ctx = createMockContext("admin-id", [GLOBAL_CREATE_INVITE_KEY]);
      const mockCode = createMockInviteCode();

      mockAuthRepo.getAllImpliedRolesForUser.mockResolvedValue(
        new Set([GLOBAL_CREATE_INVITE_KEY]),
      );
      mockInviteCodeRepo.getInviteCodeById.mockResolvedValue(mockCode);
      mockInviteCodeRepo.revokeCode.mockResolvedValue({
        ...mockCode,
        revokedBy: "admin-id",
        revokedAt: new Date(),
      });

      const caller = inviteCodeRouter.createCaller(ctx);

      await caller.revokeInviteCode({
        codeId: 1,
      });

      expect(mockInviteCodeRepo.revokeCode).toHaveBeenCalledWith(1, "admin-id");
    });

    it("should throw FORBIDDEN for user without permission", async () => {
      const ctx = createMockContext("user-id", ["channel:1:read"]);
      const caller = inviteCodeRouter.createCaller(ctx);

      await expect(
        caller.revokeInviteCode({
          codeId: 1,
        }),
      ).rejects.toThrow(TRPCError);
    });
  });
});
