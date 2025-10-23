import { and, eq } from "drizzle-orm";
import { ConflictError, NotFoundError } from "../../types/errors.js";
import type {
  CreateMessageBlastOutput,
  GetMessageBlastOutput,
  UpdateMessageBlastOutput,
} from "../../types/message-blast-types.js";
import { messageBlasts } from "../db/schema.js";
import { db } from "../db/sql.js";

/**
 * Repository to handle database queries/communication related to message blasts
 */
export class MessageBlastRepository {
  async createMessageBlast(
    senderId: number,
    title: string,
    content: string,
    targetAudience?: Record<string, unknown>,
    scheduledAt?: Date,
    status: "draft" | "scheduled" | "sent" | "failed" = "draft",
  ): Promise<CreateMessageBlastOutput> {
    const [created] = await db
      .insert(messageBlasts)
      .values({
        senderId,
        title,
        content,
        targetAudience: targetAudience || null,
        scheduledAt: scheduledAt || null,
        status,
      })
      .returning({
        blastId: messageBlasts.blastId,
        senderId: messageBlasts.senderId,
        title: messageBlasts.title,
        content: messageBlasts.content,
        targetAudience: messageBlasts.targetAudience,
        scheduledAt: messageBlasts.scheduledAt,
        sentAt: messageBlasts.sentAt,
        status: messageBlasts.status,
        createdAt: messageBlasts.createdAt,
        updatedAt: messageBlasts.updatedAt,
      });

    if (!created) {
      throw new ConflictError("Failed to create message blast");
    }

    return created;
  }

  async getMessageBlastById(blastId: number): Promise<GetMessageBlastOutput> {
    const [blast] = await db
      .select({
        blastId: messageBlasts.blastId,
        senderId: messageBlasts.senderId,
        title: messageBlasts.title,
        content: messageBlasts.content,
        targetAudience: messageBlasts.targetAudience,
        scheduledAt: messageBlasts.scheduledAt,
        sentAt: messageBlasts.sentAt,
        status: messageBlasts.status,
        createdAt: messageBlasts.createdAt,
        updatedAt: messageBlasts.updatedAt,
      })
      .from(messageBlasts)
      .where(eq(messageBlasts.blastId, blastId))
      .limit(1);

    if (!blast) {
      throw new NotFoundError(`Message blast ${blastId} not found`);
    }

    return blast;
  }

  async getMessageBlastsBySender(
    senderId: number,
  ): Promise<GetMessageBlastOutput[]> {
    return await db
      .select({
        blastId: messageBlasts.blastId,
        senderId: messageBlasts.senderId,
        title: messageBlasts.title,
        content: messageBlasts.content,
        targetAudience: messageBlasts.targetAudience,
        scheduledAt: messageBlasts.scheduledAt,
        sentAt: messageBlasts.sentAt,
        status: messageBlasts.status,
        createdAt: messageBlasts.createdAt,
        updatedAt: messageBlasts.updatedAt,
      })
      .from(messageBlasts)
      .where(eq(messageBlasts.senderId, senderId));
  }

  async updateMessageBlast(
    blastId: number,
    title?: string,
    content?: string,
    targetAudience?: Record<string, unknown>,
    scheduledAt?: Date,
    status?: "draft" | "scheduled" | "sent" | "failed",
  ): Promise<UpdateMessageBlastOutput> {
    const updateData: Partial<typeof messageBlasts.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (targetAudience !== undefined)
      updateData.targetAudience = targetAudience;
    if (scheduledAt !== undefined) updateData.scheduledAt = scheduledAt;
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
        scheduledAt: messageBlasts.scheduledAt,
        sentAt: messageBlasts.sentAt,
        status: messageBlasts.status,
        createdAt: messageBlasts.createdAt,
        updatedAt: messageBlasts.updatedAt,
      });

    if (!updated) {
      throw new NotFoundError(`Message blast ${blastId} not found`);
    }

    return updated;
  }

  async scheduleMessageBlast(
    blastId: number,
    scheduledAt: Date,
  ): Promise<UpdateMessageBlastOutput> {
    const [updated] = await db
      .update(messageBlasts)
      .set({
        scheduledAt,
        status: "scheduled",
        updatedAt: new Date(),
      })
      .where(eq(messageBlasts.blastId, blastId))
      .returning({
        blastId: messageBlasts.blastId,
        senderId: messageBlasts.senderId,
        title: messageBlasts.title,
        content: messageBlasts.content,
        targetAudience: messageBlasts.targetAudience,
        scheduledAt: messageBlasts.scheduledAt,
        sentAt: messageBlasts.sentAt,
        status: messageBlasts.status,
        createdAt: messageBlasts.createdAt,
        updatedAt: messageBlasts.updatedAt,
      });

    if (!updated) {
      throw new NotFoundError(`Message blast ${blastId} not found`);
    }

    return updated;
  }

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
        scheduledAt: messageBlasts.scheduledAt,
        sentAt: messageBlasts.sentAt,
        status: messageBlasts.status,
        createdAt: messageBlasts.createdAt,
        updatedAt: messageBlasts.updatedAt,
      });

    if (!updated) {
      throw new NotFoundError(`Message blast ${blastId} not found`);
    }

    return updated;
  }

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
        scheduledAt: messageBlasts.scheduledAt,
        sentAt: messageBlasts.sentAt,
        status: messageBlasts.status,
        createdAt: messageBlasts.createdAt,
        updatedAt: messageBlasts.updatedAt,
      });

    if (!updated) {
      throw new NotFoundError(`Message blast ${blastId} not found`);
    }

    return updated;
  }

  async deleteMessageBlast(blastId: number): Promise<void> {
    const [deleted] = await db
      .delete(messageBlasts)
      .where(eq(messageBlasts.blastId, blastId))
      .returning({ blastId: messageBlasts.blastId });

    if (!deleted) {
      throw new NotFoundError(`Message blast ${blastId} not found`);
    }
  }

  async getMessageBlastsByStatus(
    status: "draft" | "scheduled" | "sent" | "failed",
  ): Promise<GetMessageBlastOutput[]> {
    return await db
      .select({
        blastId: messageBlasts.blastId,
        senderId: messageBlasts.senderId,
        title: messageBlasts.title,
        content: messageBlasts.content,
        targetAudience: messageBlasts.targetAudience,
        scheduledAt: messageBlasts.scheduledAt,
        sentAt: messageBlasts.sentAt,
        status: messageBlasts.status,
        createdAt: messageBlasts.createdAt,
        updatedAt: messageBlasts.updatedAt,
      })
      .from(messageBlasts)
      .where(eq(messageBlasts.status, status));
  }

  async getScheduledMessageBlasts(): Promise<GetMessageBlastOutput[]> {
    return await db
      .select({
        blastId: messageBlasts.blastId,
        senderId: messageBlasts.senderId,
        title: messageBlasts.title,
        content: messageBlasts.content,
        targetAudience: messageBlasts.targetAudience,
        scheduledAt: messageBlasts.scheduledAt,
        sentAt: messageBlasts.sentAt,
        status: messageBlasts.status,
        createdAt: messageBlasts.createdAt,
        updatedAt: messageBlasts.updatedAt,
      })
      .from(messageBlasts)
      .where(
        and(
          eq(messageBlasts.status, "scheduled"),
          // This would need a proper date comparison in a real implementation
          // For now, we'll get all scheduled blasts
        ),
      );
  }
}
