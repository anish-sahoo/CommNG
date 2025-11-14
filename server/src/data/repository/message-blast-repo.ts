import { and, eq, gt, sql } from "drizzle-orm";
import { ConflictError, NotFoundError } from "../../types/errors.js";
import type {
  ActiveMessageBlastsForUserQuery,
  CreateMessageBlastOutput,
  GetMessageBlastOutput,
  MessageBlastDbRow,
  MessageBlastInsert,
  TargetAudience,
  UpdateMessageBlastOutput,
} from "../../types/message-blast-types.js";
import { parseTargetAudience } from "../../types/message-blast-types.js";
import { messageBlasts } from "../db/schema.js";
import { db } from "../db/sql.js";

/**
 * Repository to handle database queries/communication related to message blasts.
 */
export class MessageBlastRepository {
  /**
   * Helper to convert database row to typed output
   */
  private parseMessageBlastRow(row: MessageBlastDbRow): GetMessageBlastOutput {
    return {
      ...row,
      targetAudience: parseTargetAudience(row.targetAudience),
      sentAt: row.sentAt ?? null,
    };
  }

  /**
   * Create a new message blast.
   * @param senderId Sender user ID
   * @param title Message blast title
   * @param content Message blast content
   * @param targetAudience Optional target audience
   * @param validUntil Optional valid until date
   * @param status Message blast status (default: "draft")
   * @returns Created message blast object
   * @throws ConflictError if creation fails
   */
  async createMessageBlast(
    senderId: string,
    title: string,
    content: string,
    targetAudience?: TargetAudience,
    validUntil?: Date,
    status: "draft" | "sent" | "failed" = "draft",
  ): Promise<CreateMessageBlastOutput> {
    const values: MessageBlastInsert = {
      senderId,
      title,
      content,
      targetAudience,
      status,
    };

    // Only set validUntil if explicitly provided, otherwise use DB default (24 hours)
    if (validUntil !== undefined) {
      values.validUntil = validUntil;
    }

    const [created] = await db.insert(messageBlasts).values(values).returning({
      blastId: messageBlasts.blastId,
      senderId: messageBlasts.senderId,
      title: messageBlasts.title,
      content: messageBlasts.content,
      targetAudience: messageBlasts.targetAudience,
      validUntil: messageBlasts.validUntil,
      sentAt: messageBlasts.sentAt,
      status: messageBlasts.status,
      createdAt: messageBlasts.createdAt,
      updatedAt: messageBlasts.updatedAt,
    });

    if (!created) {
      throw new ConflictError("Failed to create broadcast");
    }

    return this.parseMessageBlastRow(created);
  }

  /**
   * Get a message blast by its ID.
   * @param blastId Message blast ID
   * @returns Message blast object
   * @throws NotFoundError if not found
   */
  async getMessageBlastById(blastId: number): Promise<GetMessageBlastOutput> {
    const [blast] = await db
      .select({
        blastId: messageBlasts.blastId,
        senderId: messageBlasts.senderId,
        title: messageBlasts.title,
        content: messageBlasts.content,
        targetAudience: messageBlasts.targetAudience,
        validUntil: messageBlasts.validUntil,
        sentAt: messageBlasts.sentAt,
        status: messageBlasts.status,
        createdAt: messageBlasts.createdAt,
        updatedAt: messageBlasts.updatedAt,
      })
      .from(messageBlasts)
      .where(eq(messageBlasts.blastId, blastId))
      .limit(1);

    if (!blast) {
      throw new NotFoundError(`Broadcast ${blastId} not found`);
    }

    return this.parseMessageBlastRow(blast);
  }

  /**
   * Get all message blasts sent by a user.
   * @param senderId Sender user ID
   * @returns Array of message blast objects
   */
  async getMessageBlastsBySender(
    senderId: string,
  ): Promise<GetMessageBlastOutput[]> {
    const rows = await db
      .select({
        blastId: messageBlasts.blastId,
        senderId: messageBlasts.senderId,
        title: messageBlasts.title,
        content: messageBlasts.content,
        targetAudience: messageBlasts.targetAudience,
        validUntil: messageBlasts.validUntil,
        sentAt: messageBlasts.sentAt,
        status: messageBlasts.status,
        createdAt: messageBlasts.createdAt,
        updatedAt: messageBlasts.updatedAt,
      })
      .from(messageBlasts)
      .where(eq(messageBlasts.senderId, senderId));

    return rows.map((row) => this.parseMessageBlastRow(row));
  }

  /**
   * Update a message blast.
   * @param blastId Message blast ID
   * @param title Optional new title
   * @param content Optional new content
   * @param targetAudience Optional new target audience
   * @param validUntil Optional new valid until date
   * @param status Optional new status
   * @returns Updated message blast object
   * @throws NotFoundError if not found
   */
  async updateMessageBlast(
    blastId: number,
    title?: string,
    content?: string,
    targetAudience?: TargetAudience,
    validUntil?: Date,
    status?: "draft" | "sent" | "failed",
  ): Promise<UpdateMessageBlastOutput> {
    const updateData: Partial<typeof messageBlasts.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (targetAudience !== undefined)
      updateData.targetAudience = targetAudience;
    if (validUntil !== undefined) updateData.validUntil = validUntil;
    if (status !== undefined) updateData.status = status;

    const [updated] = await db
      .update(messageBlasts)
      .set(updateData)
      .where(eq(messageBlasts.blastId, blastId))
      .returning({
        blastId: messageBlasts.blastId,
        senderId: messageBlasts.senderId,
        title: messageBlasts.title,
        content: messageBlasts.content,
        targetAudience: messageBlasts.targetAudience,
        validUntil: messageBlasts.validUntil,
        sentAt: messageBlasts.sentAt,
        status: messageBlasts.status,
        createdAt: messageBlasts.createdAt,
        updatedAt: messageBlasts.updatedAt,
      });

    if (!updated) {
      throw new NotFoundError(`Broadcast ${blastId} not found`);
    }

    return this.parseMessageBlastRow(updated);
  }

  /**
   * Mark a message blast as sent.
   * @param blastId Message blast ID
   * @returns Updated message blast object
   * @throws NotFoundError if not found
   */
  async markAsSent(blastId: number): Promise<UpdateMessageBlastOutput> {
    const [updated] = await db
      .update(messageBlasts)
      .set({
        sentAt: new Date(),
        status: "sent",
        updatedAt: new Date(),
      })
      .where(eq(messageBlasts.blastId, blastId))
      .returning({
        blastId: messageBlasts.blastId,
        senderId: messageBlasts.senderId,
        title: messageBlasts.title,
        content: messageBlasts.content,
        targetAudience: messageBlasts.targetAudience,
        validUntil: messageBlasts.validUntil,
        sentAt: messageBlasts.sentAt,
        status: messageBlasts.status,
        createdAt: messageBlasts.createdAt,
        updatedAt: messageBlasts.updatedAt,
      });

    if (!updated) {
      throw new NotFoundError(`Broadcast ${blastId} not found`);
    }

    return this.parseMessageBlastRow(updated);
  }

  /**
   * Mark a message blast as failed.
   * @param blastId Message blast ID
   * @returns Updated message blast object
   * @throws NotFoundError if not found
   */
  async markAsFailed(blastId: number): Promise<UpdateMessageBlastOutput> {
    const [updated] = await db
      .update(messageBlasts)
      .set({
        status: "failed",
        updatedAt: new Date(),
      })
      .where(eq(messageBlasts.blastId, blastId))
      .returning({
        blastId: messageBlasts.blastId,
        senderId: messageBlasts.senderId,
        title: messageBlasts.title,
        content: messageBlasts.content,
        targetAudience: messageBlasts.targetAudience,
        validUntil: messageBlasts.validUntil,
        sentAt: messageBlasts.sentAt,
        status: messageBlasts.status,
        createdAt: messageBlasts.createdAt,
        updatedAt: messageBlasts.updatedAt,
      });

    if (!updated) {
      throw new NotFoundError(`Broadcast ${blastId} not found`);
    }

    return this.parseMessageBlastRow(updated);
  }

  /**
   * Delete a message blast by its ID.
   * @param blastId Message blast ID
   * @throws NotFoundError if not found
   */
  async deleteMessageBlast(blastId: number): Promise<void> {
    const [deleted] = await db
      .delete(messageBlasts)
      .where(eq(messageBlasts.blastId, blastId))
      .returning({ blastId: messageBlasts.blastId });

    if (!deleted) {
      throw new NotFoundError(`Message blast ${blastId} not found`);
    }
  }

  /**
   * Get all message blasts by status.
   * @param status Message blast status
   * @returns Array of message blast objects
   */
  async getMessageBlastsByStatus(
    status: "draft" | "sent" | "failed",
  ): Promise<GetMessageBlastOutput[]> {
    const rows = await db
      .select({
        blastId: messageBlasts.blastId,
        senderId: messageBlasts.senderId,
        title: messageBlasts.title,
        content: messageBlasts.content,
        targetAudience: messageBlasts.targetAudience,
        validUntil: messageBlasts.validUntil,
        sentAt: messageBlasts.sentAt,
        status: messageBlasts.status,
        createdAt: messageBlasts.createdAt,
        updatedAt: messageBlasts.updatedAt,
      })
      .from(messageBlasts)
      .where(eq(messageBlasts.status, status));

    return rows.map((row) => this.parseMessageBlastRow(row));
  }

  private buildTargetAudienceCondition(query: ActiveMessageBlastsForUserQuery) {
    if (!query.branch) {
      return sql`${messageBlasts.targetAudience} IS NULL`;
    }

    const branchPath = sql`${messageBlasts.targetAudience}->${query.branch}`;

    const rankCondition = query.rank
      ? sql`${branchPath}->'ranks' ? ${query.rank}`
      : null;
    const departmentCondition = query.department
      ? sql`${branchPath}->'departments' ? ${query.department}`
      : null;

    if (!rankCondition && !departmentCondition) {
      return sql`(${messageBlasts.targetAudience} IS NULL OR ${branchPath} IS NOT NULL)`;
    }

    const applicableConditions = [rankCondition, departmentCondition].filter(
      Boolean,
    ) as ReturnType<typeof sql>[];

    return sql`(${messageBlasts.targetAudience} IS NULL OR ${sql.join(
      applicableConditions,
      sql` OR `,
    )})`;
  }

  /**
   * Get all active message blasts for a user based on audience query.
   * @param query Audience query object
   * @param userId Optional user ID for visibility
   * @returns Array of message blast objects
   */
  async getMessageBlastsForUser(
    query: ActiveMessageBlastsForUserQuery,
    userId?: string,
  ): Promise<GetMessageBlastOutput[]> {
    const now = new Date();
    const audienceCondition = this.buildTargetAudienceCondition(query);
    const visibilityCondition = userId
      ? sql`(${messageBlasts.senderId} = ${userId} OR ${audienceCondition})`
      : audienceCondition;
    const rows = await db
      .select({
        blastId: messageBlasts.blastId,
        senderId: messageBlasts.senderId,
        title: messageBlasts.title,
        content: messageBlasts.content,
        targetAudience: messageBlasts.targetAudience,
        validUntil: messageBlasts.validUntil,
        sentAt: messageBlasts.sentAt,
        status: messageBlasts.status,
        createdAt: messageBlasts.createdAt,
        updatedAt: messageBlasts.updatedAt,
      })
      .from(messageBlasts)
      .where(
        and(
          eq(messageBlasts.status, "sent"),
          gt(messageBlasts.validUntil, now),
          visibilityCondition,
        ),
      );
    return rows.map((row) => this.parseMessageBlastRow(row));
  }
}
