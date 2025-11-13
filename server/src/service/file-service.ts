import { randomUUID } from "node:crypto";
import path from "node:path";
import { Readable } from "node:stream";
import type { FileRepository } from "../data/repository/file-repo.js";
import type {
  FileInputStreamOptions,
  StorageAdapter,
} from "../storage/storage-adapter.js";
import { ForbiddenError } from "../types/errors.js";
import {
  type FileLike,
  type FileMetadata,
  type FileStreamNullable,
  fileMetadataSchema,
} from "../types/file-types.js";
import { ensureNOTUsingAws } from "../utils/aws.js";
import log from "../utils/logger.js";

/**
 * Service for file upload/download operations with storage adapter integration
 */
export class FileService {
  private fileRepository: FileRepository;
  public adapter: StorageAdapter;

  constructor(fileRepository: FileRepository, adapter: StorageAdapter) {
    this.fileRepository = fileRepository;
    this.adapter = adapter;
  }

  /**
   * Create a DB record and return a presigned upload URL which the client can PUT to directly
   * @param _userId User ID (reserved for future use)
   * @param originalFileName Original file name
   * @param opts Optional file input stream options
   * @param expiresSeconds Optional expiration time in seconds (default: 900)
   * @param _uploadedByOverride Optional override for uploader ID
   * @returns Object with fileId, uploadUrl, and storedName
   */
  public async createPresignedUpload(
    _userId: string,
    originalFileName: string,
    opts?: FileInputStreamOptions,
    expiresSeconds?: number,
    _uploadedByOverride?: number,
  ): Promise<{ fileId: string; uploadUrl: string; storedName: string }> {
    const safeOriginalName = this.normaliseOriginalName(originalFileName);
    const fileId = randomUUID();
    const extension = this.resolveExtension(
      safeOriginalName,
      opts?.contentType,
    );
    const storageName = extension ? `${fileId}${extension}` : fileId;
    const uploadUrl = await this.adapter.generatePresignedUploadUrl(
      storageName,
      expiresSeconds ?? 900,
      opts?.contentType,
    );

    // Return fileId, uploadUrl and storedName (storedName added to help
    // the client confirm upload later)
    return { fileId, uploadUrl, storedName: storageName };
  }

  /**
   * Confirm a presigned upload by inserting the DB record after client uploads to S3
   * @param userId User ID
   * @param fileId File ID
   * @param originalFileName Original file name
   * @param storedName Stored file name
   * @param opts Optional file input stream options
   */
  public async confirmPresignedUpload(
    userId: string,
    fileId: string,
    originalFileName: string,
    storedName: string,
    opts?: FileInputStreamOptions,
  ): Promise<void> {
    await this.fileRepository.insertFile({
      fileId,
      fileName: this.normaliseOriginalName(originalFileName),
      location: storedName,
      metadata: {
        contentType: opts?.contentType ?? null,
        storedName,
        uploadedBy: userId,
        uploadedAt: new Date().toISOString(),
      },
    });
  }

  /**
   * Store a file from a stream (for non-AWS environments)
   * @param userId User ID
   * @param originalFileName Original file name
   * @param file Readable stream
   * @param opts Optional file input stream options
   * @returns File ID
   */
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
    ensureNOTUsingAws("Not supported if using AWS");
    const storageName = extension ? `${fileId}${extension}` : fileId;

    log.debug(
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

  /**
   * Get file stream for download
   * @param fileId File ID
   * @returns File stream with metadata
   * @throws ForbiddenError if file is stored as URL (use getFileUrl instead)
   */
  public async getFileStream(fileId: string): Promise<FileStreamNullable> {
    const fileData = await this.fileRepository.getFile(fileId);
    const metadata = this.normaliseMetadata(fileData.metadata);
    const downloadName = this.resolveDownloadName(
      fileData.fileName,
      metadata?.storedName ?? fileData.location,
    );

    const location = fileData.location;
    // If the stored location is already a public URL (S3/public),
    // streaming is not allowed via the server. Clients should request
    // the URL instead. Throw Forbidden so callers can fallback to
    // the URL-based flow.
    const isUrl =
      location.startsWith("http://") || location.startsWith("https://");

    if (isUrl) {
      throw new ForbiddenError(
        "File is stored as a URL and cannot be streamed from the server. Use getFileUrl instead.",
      );
    }
    const stream = await this.adapter.getStream(location);
    return {
      stream,
      fileName: downloadName,
      contentType: metadata?.contentType ?? undefined,
      location,
    };
  }

  /**
   * Return a downloadable URL for the given fileId. This will return the
   * stored public URL directly if the DB record contains one, or ask the
   * adapter to produce a URL (presigned GET) for stored locations.
   * @param fileId File ID
   * @returns Object with fileName, contentType, url, and location
   */
  public async getFileUrl(fileId: string): Promise<{
    fileName: string;
    contentType?: string;
    url: string;
    location: string;
  }> {
    const fileData = await this.fileRepository.getFile(fileId);
    const metadata = this.normaliseMetadata(fileData.metadata);
    const downloadName = this.resolveDownloadName(
      fileData.fileName,
      metadata?.storedName ?? fileData.location,
    );

    const location = fileData.location;

    // If already a public URL, return it.
    if (location.startsWith("http://") || location.startsWith("https://")) {
      return {
        fileName: downloadName,
        contentType: metadata?.contentType ?? undefined,
        url: location,
        location,
      };
    }

    const url = await this.adapter.getUrl(location);
    return {
      fileName: downloadName,
      contentType: metadata?.contentType ?? undefined,
      url,
      location,
    };
  }

  /**
   * Delete a file from storage and database
   * @param fileId File ID
   */
  public async deleteFile(fileId: string): Promise<void> {
    const fileData = await this.fileRepository.getFile(fileId);
    const location = fileData.location;

    // Delete from S3 storage using the adapter
    log.debug({ fileId, location }, "Deleting file from S3");
    const deleted = await this.adapter.delete(location);
    if (!deleted) {
      log.warn({ fileId, location }, "Failed to delete file from S3 storage");
    }

    // Delete from database
    await this.fileRepository.deleteFile(fileId);
    log.info({ fileId, location }, "File deleted from S3 and database");
  }

  /**
   * Convert a FileLike object to a Readable stream
   * @param file FileLike object
   * @returns Readable stream
   */
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
