import { customAlphabet } from "nanoid";
import type { AuthRepository } from "../data/repository/auth-repo.js";
import type { InviteCodeRepository } from "../data/repository/invite-code-repo.js";
import { hasPermission } from "../data/role-hierarchy.js";
import type { RoleKey } from "../data/roles.js";
import { GLOBAL_CREATE_INVITE_KEY } from "../data/roles.js";
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../types/errors.js";
import type { InviteCodeStatus } from "../types/invite-code-types.js";
import log from "../utils/logger.js";

// Configuration: Default expiration time in hours
export const INVITE_CODE_EXPIRATION_HOURS = 24;

// Generate 8-character invite codes using uppercase letters and numbers
const generateNanoid = customAlphabet(
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
  8,
);

/**
 * Service for invite code operations with business logic
 */
export class InviteCodeService {
  constructor(
    private inviteCodeRepo: InviteCodeRepository,
    private authRepo: AuthRepository,
  ) {}

  /**
   * Generate a random 8-character alphanumeric invite code using nanoid
   * @returns Uppercase alphanumeric code (e.g., "XK9P2M4J")
   */
  private generateCode() {
    return generateNanoid();
  }

  /**
   * Verify user has permission to manage invite codes
   * Uses role hierarchy: global:admin automatically grants global:create-invite
   * @param userId User ID to check
   * @throws ForbiddenError if user lacks permission
   */
  private async verifyInviteManagementPermission(userId: string) {
    const roles = await this.authRepo.getAllImpliedRolesForUser(userId);

    // Check for global:create-invite permission
    // Note: global:admin users will automatically have this via role hierarchy
    if (!hasPermission(roles, GLOBAL_CREATE_INVITE_KEY)) {
      throw new ForbiddenError(
        "You do not have permission to manage invite codes",
      );
    }
  }

  /**
   * Create a new invite code with specified roles
   * @param adminUserId User ID of the admin creating the invite
   * @param roleKeys Array of role keys to assign
   * @param expiresInHours Hours until expiration (default: 24)
   * @returns Created invite code details
   */
  async createInvite(
    adminUserId: string,
    roleKeys: RoleKey[],
    expiresInHours?: number,
  ) {
    // Verify invite management permission
    await this.verifyInviteManagementPermission(adminUserId);

    // Validate role keys
    if (roleKeys.length === 0) {
      throw new ValidationError("At least one role must be provided");
    }

    // Generate unique code (retry if collision)
    let code: string;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      code = this.generateCode();
      const existing = await this.inviteCodeRepo.getInviteCodeByCode(code);
      if (!existing) break;
      attempts++;
    } while (attempts < maxAttempts);

    if (attempts >= maxAttempts) {
      throw new Error("Failed to generate unique invite code");
    }

    // Calculate expiration
    const hours = expiresInHours ?? INVITE_CODE_EXPIRATION_HOURS;
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + hours);

    // Create invite code
    const inviteCode = await this.inviteCodeRepo.createInviteCode(
      code,
      roleKeys,
      adminUserId,
      expiresAt,
    );

    log.info(
      `Admin ${adminUserId} created invite code ${code} with ${roleKeys.length} roles, expires at ${expiresAt}`,
    );

    return {
      codeId: inviteCode.codeId,
      code: inviteCode.code,
      roleKeys: inviteCode.roleKeys,
      expiresAt: inviteCode.expiresAt,
    };
  }

  /**
   * Validate an invite code
   * @param code Invite code string
   * @returns Validation result with role keys if valid
   */
  async validateInviteCode(
    code: string,
  ): Promise<
    { isValid: true; roleKeys: RoleKey[] } | { isValid: false; message: string }
  > {
    const inviteCode = await this.inviteCodeRepo.getInviteCodeByCode(code);

    if (!inviteCode) {
      return {
        isValid: false,
        message: "Invalid invite code",
      };
    }

    // Check if revoked (revokedAt is not null)
    if (inviteCode.revokedAt) {
      return {
        isValid: false,
        message: "This invite code has been revoked",
      };
    }

    // Check if already used
    if (inviteCode.usedBy) {
      return {
        isValid: false,
        message: "This invite code has already been used",
      };
    }

    // Check if expired
    const now = new Date();
    if (inviteCode.expiresAt < now) {
      return {
        isValid: false,
        message: "This invite code has expired",
      };
    }

    // Valid code
    return {
      isValid: true,
      roleKeys: inviteCode.roleKeys,
    };
  }

  /**
   * Use an invite code and assign roles to a user
   * @param code Invite code string
   * @param userId User ID to assign roles to
   * @throws ValidationError if code is invalid
   */
  async useInviteAndAssignRoles(code: string, userId: string) {
    // Validate the code
    const validation = await this.validateInviteCode(code);

    if (!validation.isValid) {
      throw new ValidationError(validation.message ?? "Invalid invite code");
    }

    // Get the full invite code
    const inviteCode = await this.inviteCodeRepo.getInviteCodeByCode(code);
    if (!inviteCode) {
      throw new NotFoundError("Invite code not found");
    }

    // Mark code as used
    await this.inviteCodeRepo.markCodeAsUsed(inviteCode.codeId, userId);

    // Bulk assign all roles to the user
    const bulkResult = await this.authRepo.grantAccessBulk(
      inviteCode.createdBy,
      userId,
      validation.roleKeys,
    );

    log.info(
      `User ${userId} used invite code ${code}, assigned ${bulkResult.successful.length}/${validation.roleKeys.length} roles`,
    );

    return {
      assignedRoles: bulkResult.successful,
      failedRoles: bulkResult.failed,
    };
  }

  /**
   * List invite codes with optional filtering
   * @param adminUserId Admin user requesting the list
   * @param status Optional status filter
   * @param limit Maximum number of results
   * @param offset Offset for pagination
   * @returns Array of invite codes
   */
  async listInviteCodes(
    adminUserId: string,
    status?: InviteCodeStatus,
    limit = 50,
    offset = 0,
  ) {
    // Verify invite management permission
    await this.verifyInviteManagementPermission(adminUserId);

    return this.inviteCodeRepo.listInviteCodes(status, limit, offset);
  }

  /**
   * Revoke an invite code
   * @param adminUserId Admin user revoking the code
   * @param codeId Invite code ID
   */
  async revokeInvite(adminUserId: string, codeId: number) {
    // Verify invite management permission
    await this.verifyInviteManagementPermission(adminUserId);

    // Check if code exists
    const inviteCode = await this.inviteCodeRepo.getInviteCodeById(codeId);

    // Check if already used
    if (inviteCode.usedBy) {
      throw new ValidationError(
        "Cannot revoke an invite code that has already been used",
      );
    }

    // Check if already revoked (revokedAt is not null)
    if (inviteCode.revokedAt) {
      throw new ValidationError("Invite code is already revoked");
    }

    // Revoke the code
    await this.inviteCodeRepo.revokeCode(codeId, adminUserId);

    log.info(`Admin ${adminUserId} revoked invite code ${codeId}`);
  }
}
