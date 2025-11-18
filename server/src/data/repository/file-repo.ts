import { eq } from "drizzle-orm";
import { files } from "@/data/db/schema.js";
import { db } from "@/data/db/sql.js";
import { NotFoundError } from "@/types/errors.js";
import type { FileMetadata, FileRecord } from "@/types/file-types.js";
import { fileMetadataSchema } from "@/types/file-types.js";
import { Cache } from "@/utils/cache.js";

/**
 * Repository for file storage and retrieval operations
 */
export class FileRepository {
  /**
   * Insert a new file record into the database
   * @param record File record object
   */
  public async insertFile(record: FileRecord): Promise<void> {
    await db.insert(files).values({
      fileId: record.fileId,
      fileName: record.fileName,
      location: record.location,
      metadata: record.metadata ?? null,
    });
  }

  /**
   * Delete a file record by file ID
   * @param fileId File ID
   */
  public async deleteFile(fileId: string): Promise<void> {
    await db.delete(files).where(eq(files.fileId, fileId));
  }

  /**
   * Get a file record by file ID
   * @param fileId File ID
   * @returns File record object
   * @throws NotFoundError if file not found
   */
  @Cache((fileId) => `file:${fileId}:data`, 60 * 60 * 2)
  public async getFile(fileId: string): Promise<FileRecord> {
    const [file] = await db
      .select({
        fileId: files.fileId,
        fileName: files.fileName,
        location: files.location,
        metadata: files.metadata,
      })
      .from(files)
      .where(eq(files.fileId, fileId));

    if (!file) {
      throw new NotFoundError(`File ${fileId} not found`);
    }

    let metadata: FileMetadata | null = null;
    if (
      file.metadata &&
      typeof file.metadata === "object" &&
      !Array.isArray(file.metadata)
    ) {
      const parsed = fileMetadataSchema.safeParse(file.metadata);
      metadata = parsed.success ? parsed.data : null;
    }

    return {
      fileId: file.fileId,
      fileName: file.fileName,
      location: file.location,
      metadata,
    };
  }
}
