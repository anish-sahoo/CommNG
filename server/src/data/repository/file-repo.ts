import { eq } from "drizzle-orm";
import { NotFoundError } from "../../types/errors.js";
import type { FileMetadata, FileRecord } from "../../types/file-types.js";
import { fileMetadataSchema } from "../../types/file-types.js";
import { Cache } from "../../utils/cache.js";
import { files } from "../db/schema/index.js";
import { db } from "../db/sql.js";

export class FileRepository {
  public async insertFile(record: FileRecord): Promise<void> {
    await db.insert(files).values({
      fileId: record.fileId,
      fileName: record.fileName,
      location: record.location,
      metadata: record.metadata ?? null,
    });
  }

  @Cache((fileId) => `file:${fileId}:data`, 60 * 60 * 12)
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
