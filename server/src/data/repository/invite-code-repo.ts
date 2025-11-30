import {
  and,
  count,
  eq,
  gt,
  isNotNull,
  isNull,
  lt,
  type SQL,
} from "drizzle-orm";
import { type InviteCode, inviteCodes } from "../../data/db/schema.js";
import { db } from "../../data/db/sql.js";
import type { RoleKey } from "../../data/roles.js";
import { NotFoundError } from "../../types/errors.js";
import type { InviteCodeStatus } from "../../types/invite-code-types.js";
import log from "../../utils/logger.js";

/**
 * Repository to handle database queries for invite codes
 */
export class InviteCodeRepository {
  /**
   * Create a new invite code
   * @param code Generated invite code string
   * @param roleKeys Array of role keys to assign
   * @param createdBy User ID of the admin creating the code
   * @param expiresAt Expiration timestamp
   * @returns Created invite code
   */
  async createInviteCode(
    code: string,
    roleKeys: RoleKey[],
    createdBy: string,
    expiresAt: Date,
  ) {
    const [inviteCode] = await db
      .insert(inviteCodes)
      .values({
        code,
        roleKeys,
        createdBy,
        expiresAt,
      })
      .returning();

    if (!inviteCode) {
      throw new Error("Failed to create invite code");
    }

    log.info(
      `Invite code created: ${code} by ${createdBy}, expires at ${expiresAt}`,
    );
    return inviteCode;
  }

  /**
   * Get invite code by code string
   * @param code Invite code string
   * @returns Invite code object or null if not found
   */
  async getInviteCodeByCode(code: string) {
    const [inviteCode] = await db
      .select()
      .from(inviteCodes)
      .where(eq(inviteCodes.code, code));

    return inviteCode ?? null;
  }

  /**
   * Get invite code by ID
   * @param codeId Invite code ID
   * @returns Invite code object
   * @throws NotFoundError if code not found
   */
  async getInviteCodeById(codeId: number) {
    const [inviteCode] = await db
      .select()
      .from(inviteCodes)
      .where(eq(inviteCodes.codeId, codeId));

    if (!inviteCode) {
      throw new NotFoundError(`Invite code ${codeId} not found`);
    }

    return inviteCode;
  }

  /**
   * Mark invite code as used
   * @param codeId Invite code ID
   * @param userId User ID who used the code
   * @returns Updated invite code
   */
  async markCodeAsUsed(codeId: number, userId: string) {
    const [updated] = await db
      .update(inviteCodes)
      .set({
        usedBy: userId,
        usedAt: new Date(),
      })
      .where(eq(inviteCodes.codeId, codeId))
      .returning();

    if (!updated) {
      throw new NotFoundError(`Invite code ${codeId} not found`);
    }

    log.info(`Invite code ${codeId} marked as used by ${userId}`);
    return updated;
  }

  /**
   * Revoke an invite code
   * @param codeId Invite code ID
   * @param revokedBy User ID of admin revoking the code
   * @returns Updated invite code
   */
  async revokeCode(codeId: number, revokedBy: string) {
    const [updated] = await db
      .update(inviteCodes)
      .set({
        revokedBy,
        revokedAt: new Date(),
      })
      .where(eq(inviteCodes.codeId, codeId))
      .returning();

    if (!updated) {
      throw new NotFoundError(`Invite code ${codeId} not found`);
    }

    log.info(`Invite code ${codeId} revoked by ${revokedBy}`);
    return updated;
  }

  /**
   * List invite codes with optional filtering
   * @param status Optional status filter
   * @param limit Maximum number of results
   * @param offset Offset for pagination
   * @returns Paginated invite codes with metadata
   */
  async listInviteCodes(status?: InviteCodeStatus, limit = 50, offset = 0) {
    // Build where condition
    const now = new Date();
    let whereCondition: SQL | undefined;

    if (status === "active") {
      whereCondition = and(
        isNull(inviteCodes.revokedAt),
        isNull(inviteCodes.usedBy),
        gt(inviteCodes.expiresAt, now),
      );
    } else if (status === "used") {
      whereCondition = isNotNull(inviteCodes.usedBy);
    } else if (status === "expired") {
      whereCondition = and(
        isNull(inviteCodes.revokedAt),
        isNull(inviteCodes.usedBy),
        lt(inviteCodes.expiresAt, now),
      );
    } else if (status === "revoked") {
      whereCondition = isNotNull(inviteCodes.revokedAt);
    }

    // Get total count
    const countQuery = whereCondition
      ? db.select({ count: count() }).from(inviteCodes).where(whereCondition)
      : db.select({ count: count() }).from(inviteCodes);

    const countRes = await countQuery;

    const totalCount = countRes[0]?.count ?? 0;

    // Get paginated data
    let dataQuery = db.select().from(inviteCodes);
    if (whereCondition) {
      dataQuery = dataQuery.where(whereCondition) as typeof dataQuery;
    }

    const codes = await dataQuery.limit(limit).offset(offset);

    // Add computed status to each code
    const data = codes.map((code) => this.addStatusToCode(code));

    // Calculate pagination metadata
    const hasMore = offset + limit < totalCount;
    const hasPrevious = offset > 0;

    return {
      data,
      totalCount,
      hasMore,
      hasPrevious,
    };
  }

  /**
   * Delete expired invite codes (cleanup utility)
   * @returns Number of deleted codes
   */
  async deleteExpiredCodes() {
    const now = new Date();
    const result = await db
      .delete(inviteCodes)
      .where(
        and(
          lt(inviteCodes.expiresAt, now),
          isNull(inviteCodes.usedBy),
          isNull(inviteCodes.revokedAt),
        ),
      );

    log.info(`Deleted ${result.rowCount ?? 0} expired invite codes`);
    return result.rowCount ?? 0;
  }

  /**
   * Add computed status to an invite code
   * @param code Invite code from database
   * @returns Invite code with status
   */
  private addStatusToCode(code: InviteCode) {
    const now = new Date();
    let status: InviteCodeStatus;

    if (code.revokedAt) {
      status = "revoked";
    } else if (code.usedBy) {
      status = "used";
    } else if (code.expiresAt < now) {
      status = "expired";
    } else {
      status = "active";
    }

    return {
      ...code,
      status,
    };
  }
}
