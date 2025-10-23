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
  private adapter: StorageAdapter;

  constructor(fileRepository: FileRepository, adapter: StorageAdapter) {
    this.fileRepository = fileRepository;
    this.adapter = adapter;
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
      const stream = await this.adapter.getStream(fileData.location);
      const metadata = this.normaliseMetadata(fileData.metadata);
      const downloadName = this.resolveDownloadName(
        fileData.fileName,
        metadata?.storedName ?? fileData.location,
      );

      return {
        stream,
        fileName: downloadName,
        contentType: metadata?.contentType ?? undefined,
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
