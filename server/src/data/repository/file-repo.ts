import { eq, sql } from "drizzle-orm";
import { NotFoundError } from "../../types/errors.js";
import { Cache } from "../../utils/cache.js";
import { files } from "../db/schema/index.js";
import { db } from "../db/sql.js";

export type FileRecord = {
  fileId: string;
  fileName: string;
  location: string;
  metadata: Record<string, unknown> | null;
};

export class FileRepository {
  public async generateFileId(): Promise<string> {
    try {
      const result = await db.execute<{ file_id: string }>(
        sql`select gen_random_uuid()::text as file_id`,
      );
      const [row] = result.rows;
      if (row?.file_id) {
        return row.file_id;
      }
    } catch (err) {
      // Fall back to uuid_generate_v4 if pgcrypto is unavailable
      const fallback = await db.execute<{ file_id: string }>(
        sql`select uuid_generate_v4()::text as file_id`,
      );
      const [row] = fallback.rows;
      if (row?.file_id) {
        return row.file_id;
      }
      throw err;
    }

    throw new Error("Failed to generate file id");
  }

  public async insertFile(record: FileRecord): Promise<void> {
    await db.insert(files).values({
      fileId: record.fileId,
      fileName: record.fileName,
      location: record.location,
      metadata: record.metadata ?? null,
    });
  }

  @Cache((fileId) => `file:${fileId}:data`, 60*60*12)
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

    const metadata =
      file.metadata &&
      typeof file.metadata === "object" &&
      !Array.isArray(file.metadata)
        ? (file.metadata as Record<string, unknown>)
        : null;

    return {
      fileId: file.fileId,
      fileName: file.fileName,
      location: file.location,
      metadata,
    };
  }
}
