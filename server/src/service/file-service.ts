import { randomUUID } from "node:crypto";
import path from "node:path";
import { Readable } from "node:stream";
import type { FileRepository } from "../data/repository/file-repo.js";
import type {
  FileInputStreamOptions,
  StorageAdapter,
} from "../storage/storage-adapter.js";
import { NotFoundError } from "../types/errors.js";
import {
  type FileLike,
  type FileMetadata,
  type FileStreamNullable,
  fileMetadataSchema,
} from "../types/file-types.js";
import log from "../utils/logger.js";

export class FileService {
  private fileRepository: FileRepository;
  public adapter: StorageAdapter;

  constructor(fileRepository: FileRepository, adapter: StorageAdapter) {
    this.fileRepository = fileRepository;
    this.adapter = adapter;
  }

  /**
   * Create a DB record and return a presigned upload URL which the client
   * can PUT to directly. Requires the adapter to implement
   * `generatePresignedUploadUrl` (S3 adapter does).
   */
  public async createPresignedUpload(
    userId: string,
    originalFileName: string,
    opts?: FileInputStreamOptions,
    expiresSeconds?: number,
    uploadedByOverride?: number,
  ): Promise<{ fileId: string; uploadUrl: string }> {
    const safeOriginalName = this.normaliseOriginalName(originalFileName);
    const fileId = randomUUID();
    const extension = this.resolveExtension(safeOriginalName, opts?.contentType);
    const storageName = extension ? `${fileId}${extension}` : fileId;

    // Note: do NOT persist the DB record here for presigned flow. The
    // confirmation step should persist the record after the client has
    // uploaded the file to S3.

    // Ask adapter for a presigned PUT URL
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyAdapter: any = this.adapter;
    if (typeof anyAdapter.generatePresignedUploadUrl !== "function") {
      throw new Error("Adapter does not support presigned upload URLs");
    }

    const uploadUrl = await anyAdapter.generatePresignedUploadUrl(
      storageName,
      expiresSeconds ?? 900,
      opts?.contentType,
    );

    // Return fileId, uploadUrl and storedName (storedName added to help
    // the client confirm upload later). We keep the declared return type
    // for compatibility but include storedName in the runtime object.
    return { fileId, uploadUrl, storedName: storageName } as unknown as {
      fileId: string;
      uploadUrl: string;
    };
  }

  /**
   * Confirm a presigned upload by inserting the DB record. This is called
   * after the client successfully PUTs the file to S3.
   */
  public async confirmPresignedUpload(
    userId: string,
    fileId: string,
    originalFileName: string,
    storedName: string,
    opts?: FileInputStreamOptions,
  ): Promise<void> {
    const parsedUserId = typeof userId === "string" ? parseInt(userId, 10) : (userId as unknown as number);
    const uploadedByValue = Number.isFinite(parsedUserId) && parsedUserId > 0 ? parsedUserId : null;
    const metadata = fileMetadataSchema.parse({
      contentType: opts?.contentType ?? null,
      storedName,
      uploadedBy: uploadedByValue,
      uploadedAt: new Date().toISOString(),
    });

    await this.fileRepository.insertFile({
      fileId,
      fileName: this.normaliseOriginalName(originalFileName),
      location: storedName,
      metadata,
    });
  }

  public async storeFileFromStream(
    userId: string,
    originalFileName: string,
    file: Readable,
    opts?: FileInputStreamOptions,
  ): Promise<string> {
    const safeOriginalName = this.normaliseOriginalName(originalFileName);
    const fileId = randomUUID();
    const extension = this.resolveExtension(
      safeOriginalName,
      opts?.contentType,
    );
    const storageName = extension ? `${fileId}${extension}` : fileId;

    log.info(
      `Store file ${safeOriginalName} for user ${userId} as ${storageName} (${opts?.contentType ?? "unknown"})`,
    );

    const { path: relativePath } = await this.adapter.storeStream(
      storageName,
      file,
      opts,
    );

    const metadata = fileMetadataSchema.parse({
      contentType: opts?.contentType ?? null,
      storedName: storageName,
      uploadedBy: userId,
      uploadedAt: new Date().toISOString(),
    });

    await this.fileRepository.insertFile({
      fileId,
      fileName: safeOriginalName,
      location: relativePath,
      metadata,
    });

    return fileId;
  }

  public async getFileStream(fileId: string): Promise<FileStreamNullable> {
    try {
      const fileData = await this.fileRepository.getFile(fileId);
      const metadata = this.normaliseMetadata(fileData.metadata);
      const downloadName = this.resolveDownloadName(
        fileData.fileName,
        metadata?.storedName ?? fileData.location,
      );

      const location = fileData.location;

      // If the stored location is already a public URL, return it as-is.
      const isUrl =
        typeof location === "string" &&
        (location.startsWith("http://") || location.startsWith("https://"));

  let stream: Readable | undefined;
  let returnedLocation: string = location as string;

      if (!isUrl) {
        // Prefer asking the adapter for a URL. Many adapters (S3) will
        // provide a presigned GET URL instead of supporting direct
        // streaming. If adapter.getUrl returns a valid http(s) URL, use
        // that and do not attempt to stream. Otherwise fall back to
        // adapter.getStream for adapters that support streaming.
        try {
          const url = await this.adapter.getUrl(location as string);
          if (typeof url === "string" && (url.startsWith("http://") || url.startsWith("https://"))) {
            returnedLocation = url;
            stream = undefined;
          } else {
            // Adapter returned something that isn't an http URL; try streaming
            stream = await this.adapter.getStream(location as string);
          }
        } catch (err) {
          // If getUrl fails for any reason, attempt to stream. Note:
          // S3 adapter's getStream intentionally throws ForbiddenError,
          // so adapter.getUrl should succeed for S3. This catch ensures
          // we still try streaming for adapters where getUrl isn't
          // implemented or temporarily fails.
          stream = await this.adapter.getStream(location as string);
        }
      }

      return {
        stream,
        fileName: downloadName,
        contentType: metadata?.contentType ?? undefined,
        location: returnedLocation,
      };
    } catch (err) {
      if (err instanceof NotFoundError) {
        return null;
      }
      throw err;
    }
  }

  public async fileLikeToReadable(file: FileLike): Promise<Readable> {
    if (typeof Readable.fromWeb === "function") {
      return Readable.fromWeb(file.stream());
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    return Readable.from([buffer]);
  }

  private normaliseOriginalName(fileName: string): string {
    const trimmed = fileName?.trim() ?? "";
    const base = path.basename(trimmed).replace(/[\r\n]+/g, "");
    return base.length > 0 ? base : "file";
  }

  private resolveExtension(fileName: string, contentType?: string): string {
    const fromName = path.extname(fileName ?? "");
    if (fromName.length > 0) {
      return fromName.toLowerCase();
    }

    if (!contentType) {
      return "";
    }

    const mapping: Record<string, string> = {
      "application/pdf": ".pdf",
      "image/png": ".png",
      "image/jpeg": ".jpg",
      "image/jpg": ".jpg",
      "image/gif": ".gif",
      "text/plain": ".txt",
    };

    const type = contentType.toLowerCase();
    return mapping[type] ?? "";
  }

  private resolveDownloadName(preferred: string, storedName: string): string {
    const trimmedPreferred = preferred?.trim() ?? "";
    if (trimmedPreferred.length === 0) {
      return storedName;
    }

    if (path.extname(trimmedPreferred)) {
      return trimmedPreferred;
    }

    const storedExt = path.extname(storedName ?? "");
    if (storedExt) {
      return `${trimmedPreferred}${storedExt}`;
    }

    return trimmedPreferred;
  }

  private normaliseMetadata(
    metadata: FileMetadata | null,
  ): FileMetadata | null {
    if (!metadata) {
      return null;
    }
    const parsed = fileMetadataSchema.safeParse(metadata);
    if (!parsed.success) {
      return null;
    }
    return parsed.data;
  }
}
