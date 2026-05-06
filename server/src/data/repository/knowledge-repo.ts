import { and, asc, eq, inArray, isNull } from "drizzle-orm";
import {
  files,
  knowledgeAttachments,
  knowledgeFolders,
  knowledgeItems,
} from "../../data/db/schema.js";
import { db } from "../../data/db/sql.js";
import { ConflictError, NotFoundError } from "../../types/errors.js";

type CreateFolderInput = {
  title: string;
  createdBy?: string | null;
  parentFolderId?: string | null;
};

type CreateItemInput = {
  folderId?: string | null;
  name: string;
  description?: string | null;
  body?: string | null;
  createdBy?: string | null;
};

type UpdateItemInput = {
  folderId?: string | null;
  name?: string;
  description?: string | null;
  body?: string | null;
};

/**
 * Repository for knowledge-base data operations.
 * Handles folders, items, and one optional attachment per item.
 */
export class KnowledgeRepository {
  /**
   * Get top-level folders (folders with no parent).
   */
  async getRootFolders() {
    return await db
      .select()
      .from(knowledgeFolders)
      .where(
        and(
          isNull(knowledgeFolders.parentFolderId),
          isNull(knowledgeFolders.deletedAt),
        ),
      )
      .orderBy(asc(knowledgeFolders.title));
  }

  /**
   * Get a folder by id plus all its ancestors up to the root.
   * Returns an array starting from the given folder up to the root.
   */
  async getFolderWithAncestors(folderId: string) {
    const chain: (typeof knowledgeFolders.$inferSelect)[] = [];
    let cursor: string | null = folderId;
    const seen = new Set<string>();

    while (cursor && !seen.has(cursor)) {
      seen.add(cursor);
      const [folder] = await db
        .select()
        .from(knowledgeFolders)
        .where(
          and(
            eq(knowledgeFolders.folderId, cursor),
            isNull(knowledgeFolders.deletedAt),
          ),
        )
        .limit(1);
      if (!folder) break;
      chain.push(folder);
      cursor = folder.parentFolderId;
    }

    return chain;
  }

  /**
   * Get child folders for a parent folder.
   */
  async getChildFolders(parentFolderId: string) {
    return await db
      .select()
      .from(knowledgeFolders)
      .where(
        and(
          eq(knowledgeFolders.parentFolderId, parentFolderId),
          isNull(knowledgeFolders.deletedAt),
        ),
      )
      .orderBy(asc(knowledgeFolders.title));
  }

  /**
   * Get items directly inside a folder.
   */
  async getItemsByFolder(folderId: string) {
    return await db
      .select()
      .from(knowledgeItems)
      .where(
        and(
          eq(knowledgeItems.folderId, folderId),
          isNull(knowledgeItems.deletedAt),
        ),
      )
      .orderBy(asc(knowledgeItems.name));
  }

  /**
   * Get a single item by id.
   * @throws NotFoundError if item does not exist
   */
  async getItemById(itemId: string) {
    const [item] = await db
      .select()
      .from(knowledgeItems)
      .where(
        and(
          eq(knowledgeItems.itemId, itemId),
          isNull(knowledgeItems.deletedAt),
        ),
      )
      .limit(1);

    if (!item) {
      throw new NotFoundError("Knowledge item not found");
    }

    return item;
  }

  /**
   * Get the attachment (if any) for a knowledge item, with file details.
   */
  async getItemAttachment(itemId: string) {
    const [attachment] = await db
      .select({
        attachmentId: knowledgeAttachments.attachmentId,
        itemId: knowledgeAttachments.itemId,
        fileId: knowledgeAttachments.fileId,
        createdAt: knowledgeAttachments.createdAt,
        fileName: files.fileName,
        location: files.location,
        metadata: files.metadata,
      })
      .from(knowledgeAttachments)
      .innerJoin(files, eq(knowledgeAttachments.fileId, files.fileId))
      .where(eq(knowledgeAttachments.itemId, itemId))
      .limit(1);

    return attachment ?? null;
  }

  /**
   * Create a root folder (no parent).
   */
  async createFolder(input: CreateFolderInput) {
    if (input.parentFolderId) {
      await this.ensureFolderExists(input.parentFolderId);
    }

    const [folder] = await db
      .insert(knowledgeFolders)
      .values({
        title: input.title,
        createdBy: input.createdBy ?? null,
        parentFolderId: input.parentFolderId ?? null,
      })
      .returning();

    if (!folder) {
      throw new ConflictError("Failed to create folder");
    }

    return folder;
  }

  /**
   * Convenience helper for creating a folder inside an existing folder.
   */
  async createFolderInFolder(
    parentFolderId: string,
    title: string,
    createdBy?: string | null,
  ) {
    return await this.createFolder({ parentFolderId, title, createdBy });
  }

  /**
   * Rename an existing folder.
   * @throws NotFoundError if folder does not exist
   */
  async renameFolder(folderId: string, title: string) {
    const [folder] = await db
      .update(knowledgeFolders)
      .set({ title, updatedAt: new Date() })
      .where(eq(knowledgeFolders.folderId, folderId))
      .returning();

    if (!folder) {
      throw new NotFoundError("Knowledge folder not found");
    }

    return folder;
  }

  /**
   * Create a knowledge item.
   */
  async createItem(input: CreateItemInput) {
    if (input.folderId) {
      await this.ensureFolderExists(input.folderId);
    }

    const [item] = await db
      .insert(knowledgeItems)
      .values({
        folderId: input.folderId ?? null,
        name: input.name,
        description: input.description ?? null,
        body: input.body ?? null,
        createdBy: input.createdBy ?? null,
      })
      .returning();

    if (!item) {
      throw new ConflictError("Failed to create knowledge item");
    }

    return item;
  }

  /**
   * Update mutable item fields.
   * @throws NotFoundError if item does not exist
   */
  async updateItem(itemId: string, input: UpdateItemInput) {
    if (input.folderId) {
      await this.ensureFolderExists(input.folderId);
    }

    const updateData: Partial<typeof knowledgeItems.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (input.folderId !== undefined) {
      updateData.folderId = input.folderId;
    }
    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    if (input.description !== undefined) {
      updateData.description = input.description;
    }
    if (input.body !== undefined) {
      updateData.body = input.body;
    }

    const [item] = await db
      .update(knowledgeItems)
      .set(updateData)
      .where(eq(knowledgeItems.itemId, itemId))
      .returning();

    if (!item) {
      throw new NotFoundError("Knowledge item not found");
    }

    return item;
  }

  /**
   * Create the first attachment for an item.
   * Fails if the item already has an attachment.
   */
  async createItemAttachment(itemId: string, fileId: string) {
    await this.ensureItemExists(itemId);

    const [existing] = await db
      .select({
        attachmentId: knowledgeAttachments.attachmentId,
      })
      .from(knowledgeAttachments)
      .where(eq(knowledgeAttachments.itemId, itemId))
      .limit(1);

    if (existing) {
      throw new ConflictError("Knowledge item already has an attachment");
    }

    const [attachment] = await db
      .insert(knowledgeAttachments)
      .values({ itemId, fileId })
      .returning();

    if (!attachment) {
      throw new ConflictError("Failed to create knowledge attachment");
    }

    return attachment;
  }

  /**
   * Replace an item's attachment and return the old fileId when changed.
   * Caller can use oldFileId to delete stale physical/object storage.
   */
  async replaceItemAttachment(itemId: string, newFileId: string) {
    await this.ensureItemExists(itemId);

    return await db.transaction(async (tx) => {
      const [existing] = await tx
        .select()
        .from(knowledgeAttachments)
        .where(eq(knowledgeAttachments.itemId, itemId))
        .limit(1);

      if (!existing) {
        const [created] = await tx
          .insert(knowledgeAttachments)
          .values({ itemId, fileId: newFileId })
          .returning();

        if (!created) {
          throw new ConflictError("Failed to create knowledge attachment");
        }

        return { attachment: created, oldFileId: null as string | null };
      }

      const oldFileId = existing.fileId;
      if (oldFileId === newFileId) {
        return { attachment: existing, oldFileId: null as string | null };
      }

      const [updated] = await tx
        .update(knowledgeAttachments)
        .set({ fileId: newFileId })
        .where(eq(knowledgeAttachments.attachmentId, existing.attachmentId))
        .returning();

      if (!updated) {
        throw new ConflictError("Failed to update knowledge attachment");
      }

      return { attachment: updated, oldFileId };
    });
  }

  /**
   * Remove an item's attachment and return the old fileId if it existed.
   */
  async deleteItemAttachment(itemId: string) {
    await this.ensureItemExists(itemId);

    const [deleted] = await db
      .delete(knowledgeAttachments)
      .where(eq(knowledgeAttachments.itemId, itemId))
      .returning({
        fileId: knowledgeAttachments.fileId,
      });

    return deleted?.fileId ?? null;
  }

  async deleteFolder(folderId: string) {
    await this.ensureFolderExists(folderId);

    const allFolderIds: string[] = [folderId];
    const queue: string[] = [folderId];

    while (queue.length > 0) {
      const parentId = queue.shift()!;
      const children = await db
        .select({ folderId: knowledgeFolders.folderId })
        .from(knowledgeFolders)
        .where(
          and(
            eq(knowledgeFolders.parentFolderId, parentId),
            isNull(knowledgeFolders.deletedAt),
          ),
        );
      for (const child of children) {
        allFolderIds.push(child.folderId);
        queue.push(child.folderId);
      }
    }

    const now = new Date();
    await db.transaction(async (tx) => {
      await tx
        .update(knowledgeItems)
        .set({ deletedAt: now })
        .where(
          and(
            inArray(knowledgeItems.folderId, allFolderIds),
            isNull(knowledgeItems.deletedAt),
          ),
        );
      await tx
        .update(knowledgeFolders)
        .set({ deletedAt: now })
        .where(inArray(knowledgeFolders.folderId, allFolderIds));
    });
  }

  async deleteItem(itemId: string) {
    await this.ensureItemExists(itemId);

    await db
      .update(knowledgeItems)
      .set({ deletedAt: new Date() })
      .where(eq(knowledgeItems.itemId, itemId));
  }

  private async ensureFolderExists(folderId: string): Promise<void> {
    const [folder] = await db
      .select({ folderId: knowledgeFolders.folderId })
      .from(knowledgeFolders)
      .where(
        and(
          eq(knowledgeFolders.folderId, folderId),
          isNull(knowledgeFolders.deletedAt),
        ),
      )
      .limit(1);

    if (!folder) {
      throw new NotFoundError("Knowledge folder not found");
    }
  }

  private async ensureItemExists(itemId: string): Promise<void> {
    const [item] = await db
      .select({ itemId: knowledgeItems.itemId })
      .from(knowledgeItems)
      .where(
        and(
          eq(knowledgeItems.itemId, itemId),
          isNull(knowledgeItems.deletedAt),
        ),
      )
      .limit(1);

    if (!item) {
      throw new NotFoundError("Knowledge item not found");
    }
  }
}
