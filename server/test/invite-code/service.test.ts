import { beforeEach, describe, expect, it, vi } from "vitest";
import type { InviteCode } from "../../src/data/db/schema.js";
import type { AuthRepository } from "../../src/data/repository/auth-repo.js";
import type { InviteCodeRepository } from "../../src/data/repository/invite-code-repo.js";
import type { RoleKey } from "../../src/data/roles.js";
import {
  GLOBAL_ADMIN_KEY,
  GLOBAL_CREATE_INVITE_KEY,
} from "../../src/data/roles.js";
import { InviteCodeService } from "../../src/service/invite-code-service.js";
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../../src/types/errors.js";

// Mock nanoid to return predictable codes
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

function createMockInviteCode(overrides: Partial<InviteCode> = {}): InviteCode {
  return {
    codeId: overrides.codeId ?? 1,
    code: overrides.code ?? "TEST1234",
    roleKeys: overrides.roleKeys ?? ["global:create-invite"],
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

describe("InviteCodeService", () => {
  let service: InviteCodeService;
  let mockInviteCodeRepo: InviteCodeRepository;
  let mockAuthRepo: AuthRepository;

  beforeEach(() => {
    mockInviteCodeRepo = {
      createInviteCode: vi.fn(),
      getInviteCodeByCode: vi.fn(),
      getInviteCodeById: vi.fn(),
      markCodeAsUsed: vi.fn(),
      revokeCode: vi.fn(),
      listInviteCodes: vi.fn(),
      deleteExpiredCodes: vi.fn(),
    } as unknown as InviteCodeRepository;

    mockAuthRepo = {
      getAllImpliedRolesForUser: vi.fn(),
      getRoleId: vi.fn(),
      grantAccessBulk: vi.fn(),
    } as unknown as AuthRepository;

    service = new InviteCodeService(mockInviteCodeRepo, mockAuthRepo);
  });

  describe("createInvite", () => {
    it("should create an invite code for user with global:create-invite permission", async () => {
      const mockCode = createMockInviteCode();

      vi.mocked(mockAuthRepo.getAllImpliedRolesForUser).mockResolvedValue(
        new Set([GLOBAL_CREATE_INVITE_KEY]),
      );
      vi.mocked(mockInviteCodeRepo.getInviteCodeByCode).mockResolvedValue(null);
      vi.mocked(mockInviteCodeRepo.createInviteCode).mockResolvedValue(
        mockCode,
      );

      const result = await service.createInvite(
        "admin-id",
        ["channel:1:read"],
        48,
      );

      expect(result).toEqual({
        codeId: 1,
        code: "TEST1234",
        roleKeys: ["global:create-invite"],
        expiresAt: expect.any(Date),
      });
      expect(mockInviteCodeRepo.createInviteCode).toHaveBeenCalledWith(
        "TEST1234",
        ["channel:1:read"],
        "admin-id",
        expect.any(Date),
      );
    });

    it("should create an invite code for user with global:admin permission", async () => {
      const mockCode = createMockInviteCode();

      vi.mocked(mockAuthRepo.getAllImpliedRolesForUser).mockResolvedValue(
        new Set([GLOBAL_ADMIN_KEY, GLOBAL_CREATE_INVITE_KEY]),
      );
      vi.mocked(mockInviteCodeRepo.getInviteCodeByCode).mockResolvedValue(null);
      vi.mocked(mockInviteCodeRepo.createInviteCode).mockResolvedValue(
        mockCode,
      );

      const result = await service.createInvite("admin-id", ["channel:1:read"]);

      expect(result).toBeDefined();
      expect(result.code).toBe("TEST1234");
    });

    it("should throw ForbiddenError if user lacks permission", async () => {
      vi.mocked(mockAuthRepo.getAllImpliedRolesForUser).mockResolvedValue(
        new Set(["channel:1:read"]),
      );

      await expect(
        service.createInvite("user-id", ["channel:1:read"]),
      ).rejects.toThrow(ForbiddenError);
    });

    it("should throw ValidationError if no role keys provided", async () => {
      vi.mocked(mockAuthRepo.getAllImpliedRolesForUser).mockResolvedValue(
        new Set([GLOBAL_CREATE_INVITE_KEY]),
      );

      await expect(service.createInvite("admin-id", [])).rejects.toThrow(
        ValidationError,
      );
    });

    it("should use default expiration of 24 hours if not specified", async () => {
      const mockCode = createMockInviteCode();

      vi.mocked(mockAuthRepo.getAllImpliedRolesForUser).mockResolvedValue(
        new Set([GLOBAL_CREATE_INVITE_KEY]),
      );
      vi.mocked(mockInviteCodeRepo.getInviteCodeByCode).mockResolvedValue(null);
      vi.mocked(mockInviteCodeRepo.createInviteCode).mockResolvedValue(
        mockCode,
      );

      await service.createInvite("admin-id", ["channel:1:read"]);

      const call = vi.mocked(mockInviteCodeRepo.createInviteCode).mock.calls[0];
      const expiresAt = call?.[3] as Date;
      const now = new Date();
      const diffHours =
        (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);

      expect(diffHours).toBeGreaterThanOrEqual(23.9);
      expect(diffHours).toBeLessThanOrEqual(24.1);
    });
  });

  describe("validateInviteCode", () => {
    it("should return valid for an active, unused, non-revoked code", async () => {
      const mockCode = createMockInviteCode();
      vi.mocked(mockInviteCodeRepo.getInviteCodeByCode).mockResolvedValue(
        mockCode,
      );

      const result = await service.validateInviteCode("TEST1234");

      expect(result).toEqual({
        isValid: true,
        roleKeys: ["global:create-invite"],
      });
    });

    it("should return invalid for non-existent code", async () => {
      vi.mocked(mockInviteCodeRepo.getInviteCodeByCode).mockResolvedValue(null);

      const result = await service.validateInviteCode("NOTEXIST");

      expect(result).toEqual({
        isValid: false,
        message: "Invalid invite code",
      });
    });

    it("should return invalid for revoked code", async () => {
      const mockCode = createMockInviteCode({
        revokedAt: new Date(),
        revokedBy: "admin-id",
      });
      vi.mocked(mockInviteCodeRepo.getInviteCodeByCode).mockResolvedValue(
        mockCode,
      );

      const result = await service.validateInviteCode("TEST1234");

      expect(result).toEqual({
        isValid: false,
        message: "This invite code has been revoked",
      });
    });

    it("should return invalid for already used code", async () => {
      const mockCode = createMockInviteCode({
        usedBy: "user-id",
        usedAt: new Date(),
      });
      vi.mocked(mockInviteCodeRepo.getInviteCodeByCode).mockResolvedValue(
        mockCode,
      );

      const result = await service.validateInviteCode("TEST1234");

      expect(result).toEqual({
        isValid: false,
        message: "This invite code has already been used",
      });
    });

    it("should return invalid for expired code", async () => {
      const mockCode = createMockInviteCode({
        expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
      });
      vi.mocked(mockInviteCodeRepo.getInviteCodeByCode).mockResolvedValue(
        mockCode,
      );

      const result = await service.validateInviteCode("TEST1234");

      expect(result).toEqual({
        isValid: false,
        message: "This invite code has expired",
      });
    });
  });

  describe("useInviteAndAssignRoles", () => {
    it("should mark code as used and assign roles to user", async () => {
      const mockCode = createMockInviteCode({
        roleKeys: ["channel:1:read", "channel:2:read"],
      });

      vi.mocked(mockInviteCodeRepo.getInviteCodeByCode).mockResolvedValue(
        mockCode,
      );
      vi.mocked(mockInviteCodeRepo.markCodeAsUsed).mockResolvedValue(mockCode);
      vi.mocked(mockAuthRepo.grantAccessBulk).mockResolvedValue({
        successful: ["channel:1:read", "channel:2:read"],
        failed: [],
        results: [],
      });

      const result = await service.useInviteAndAssignRoles(
        "TEST1234",
        "new-user-id",
      );

      expect(result).toEqual({
        assignedRoles: ["channel:1:read", "channel:2:read"],
        failedRoles: [],
      });
      expect(mockInviteCodeRepo.markCodeAsUsed).toHaveBeenCalledWith(
        1,
        "new-user-id",
      );
      expect(mockAuthRepo.grantAccessBulk).toHaveBeenCalledWith(
        "admin-id",
        "new-user-id",
        ["channel:1:read", "channel:2:read"],
      );
    });

    it("should throw ValidationError for invalid code", async () => {
      vi.mocked(mockInviteCodeRepo.getInviteCodeByCode).mockResolvedValue(null);

      await expect(
        service.useInviteAndAssignRoles("INVALID", "user-id"),
      ).rejects.toThrow(ValidationError);
    });

    it("should handle partial role assignment failures", async () => {
      const mockCode = createMockInviteCode({
        roleKeys: ["channel:1:read", "invalid:role" as RoleKey],
      });

      vi.mocked(mockInviteCodeRepo.getInviteCodeByCode).mockResolvedValue(
        mockCode,
      );
      vi.mocked(mockInviteCodeRepo.markCodeAsUsed).mockResolvedValue(mockCode);
      vi.mocked(mockAuthRepo.grantAccessBulk).mockResolvedValue({
        successful: ["channel:1:read"],
        failed: ["invalid:role" as RoleKey],
        results: [],
      });

      const result = await service.useInviteAndAssignRoles(
        "TEST1234",
        "new-user-id",
      );

      expect(result.assignedRoles).toHaveLength(1);
      expect(result.failedRoles).toHaveLength(1);
    });
  });

  describe("listInviteCodes", () => {
    it("should list codes for user with permission", async () => {
      const mockCodes = [
        createMockInviteCode(),
        createMockInviteCode({ codeId: 2 }),
      ];

      vi.mocked(mockAuthRepo.getAllImpliedRolesForUser).mockResolvedValue(
        new Set([GLOBAL_CREATE_INVITE_KEY]),
      );
      vi.mocked(mockInviteCodeRepo.listInviteCodes).mockResolvedValue(
        mockCodes.map((code) => ({ ...code, status: "active" as const })),
      );

      const result = await service.listInviteCodes("admin-id", "active", 50, 0);

      expect(result).toHaveLength(2);
      expect(mockInviteCodeRepo.listInviteCodes).toHaveBeenCalledWith(
        "active",
        50,
        0,
      );
    });

    it("should throw ForbiddenError if user lacks permission", async () => {
      vi.mocked(mockAuthRepo.getAllImpliedRolesForUser).mockResolvedValue(
        new Set(["channel:1:read"]),
      );

      await expect(service.listInviteCodes("user-id")).rejects.toThrow(
        ForbiddenError,
      );
    });
  });

  describe("revokeInvite", () => {
    it("should revoke an unused code", async () => {
      const mockCode = createMockInviteCode();

      vi.mocked(mockAuthRepo.getAllImpliedRolesForUser).mockResolvedValue(
        new Set([GLOBAL_CREATE_INVITE_KEY]),
      );
      vi.mocked(mockInviteCodeRepo.getInviteCodeById).mockResolvedValue(
        mockCode,
      );
      vi.mocked(mockInviteCodeRepo.revokeCode).mockResolvedValue({
        ...mockCode,
        revokedBy: "admin-id",
        revokedAt: new Date(),
      });

      await service.revokeInvite("admin-id", 1);

      expect(mockInviteCodeRepo.revokeCode).toHaveBeenCalledWith(1, "admin-id");
    });

    it("should throw ValidationError when revoking already used code", async () => {
      const mockCode = createMockInviteCode({
        usedBy: "user-id",
        usedAt: new Date(),
      });

      vi.mocked(mockAuthRepo.getAllImpliedRolesForUser).mockResolvedValue(
        new Set([GLOBAL_CREATE_INVITE_KEY]),
      );
      vi.mocked(mockInviteCodeRepo.getInviteCodeById).mockResolvedValue(
        mockCode,
      );

      await expect(service.revokeInvite("admin-id", 1)).rejects.toThrow(
        ValidationError,
      );
    });

    it("should throw ValidationError when revoking already revoked code", async () => {
      const mockCode = createMockInviteCode({
        revokedAt: new Date(),
        revokedBy: "other-admin",
      });

      vi.mocked(mockAuthRepo.getAllImpliedRolesForUser).mockResolvedValue(
        new Set([GLOBAL_CREATE_INVITE_KEY]),
      );
      vi.mocked(mockInviteCodeRepo.getInviteCodeById).mockResolvedValue(
        mockCode,
      );

      await expect(service.revokeInvite("admin-id", 1)).rejects.toThrow(
        ValidationError,
      );
    });

    it("should throw ForbiddenError if user lacks permission", async () => {
      vi.mocked(mockAuthRepo.getAllImpliedRolesForUser).mockResolvedValue(
        new Set(["channel:1:read"]),
      );

      await expect(service.revokeInvite("user-id", 1)).rejects.toThrow(
        ForbiddenError,
      );
    });

    it("should throw NotFoundError for non-existent code", async () => {
      vi.mocked(mockAuthRepo.getAllImpliedRolesForUser).mockResolvedValue(
        new Set([GLOBAL_CREATE_INVITE_KEY]),
      );
      vi.mocked(mockInviteCodeRepo.getInviteCodeById).mockRejectedValue(
        new NotFoundError("Invite code not found"),
      );

      await expect(service.revokeInvite("admin-id", 999)).rejects.toThrow(
        NotFoundError,
      );
    });
  });
});
