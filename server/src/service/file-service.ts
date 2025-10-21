import path from "node:path";
import type { Readable } from "node:stream";
import {
  type FileRecord,
  FileRepository,
} from "../data/repository/file-repo.js";
import { FileSystemStorageAdapter } from "../storage/filesystem-adapter.js";
import { S3Adapter } from "../storage/s3-adapter.js";
import type {
  FileInputStreamOptions,
  StorageAdapter,
} from "../storage/storage-adapter.js";
import { NotFoundError } from "../types/errors.js";
import log from "../utils/logger.js";

export class FileService {
  private fileRepository: FileRepository;
  private adapter: StorageAdapter;

  constructor(fileRepository: FileRepository, adapter?: StorageAdapter) {
    this.fileRepository = fileRepository ?? new FileRepository();
    const backend = (process.env.STORAGE_BACKEND ?? "fs").toLowerCase();
    this.adapter =
      adapter ??
      (backend === "s3" ? new S3Adapter() : new FileSystemStorageAdapter());
  }

  public async storeFileFromStream(
    userId: number,
    originalFileName: string,
    file: Readable,
    opts?: FileInputStreamOptions,
  ): Promise<string> {
    const safeOriginalName = this.normaliseOriginalName(originalFileName);
    const fileId = await this.fileRepository.generateFileId();
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

    await this.fileRepository.insertFile({
      fileId,
      fileName: safeOriginalName,
      location: relativePath,
      metadata: {
        contentType: opts?.contentType ?? null,
        uploadedBy: userId,
        storedName: storageName,
        uploadedAt: new Date().toISOString(),
      },
    });

    return fileId;
  }

  public async getFileStream(fileId: string): Promise<{
    stream: Readable;
    fileName: string;
    contentType?: string;
  } | null> {
    try {
      const fileData = await this.fileRepository.getFile(fileId);
      const stream = await this.adapter.getStream(fileData.location);
      const metadata = this.normaliseMetadata(fileData);
      const downloadName = this.resolveDownloadName(
        fileData.fileName,
        metadata.storedName ?? fileData.location,
      );

      return {
        stream,
        fileName: downloadName,
        contentType: metadata.contentType ?? undefined,
      };
    } catch (err) {
      if (err instanceof NotFoundError) {
        return null;
      }
      throw err;
    }
  }

  private normaliseOriginalName(fileName: string): string {
    const trimmed = fileName?.trim() ?? "";
    const base = path.basename(trimmed).replace(/[\r\n]+/g, "");
    return base.length > 0 ? base : "file";
  }

  private resolveExtension(fileName: string, contentType?: string): string {
    const fromName = path.extname(fileName ?? "");
    if (fromName) {
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

  private normaliseMetadata(file: FileRecord): {
    contentType: string | null;
    storedName: string | null;
    uploadedBy: number | null;
  } {
    const metadata = file.metadata ?? {};
    if (typeof metadata !== "object" || Array.isArray(metadata)) {
      return { contentType: null, storedName: null, uploadedBy: null };
    }

    const tryString = (value: unknown): string | null =>
      typeof value === "string" && value.trim().length > 0
        ? value.trim()
        : null;

    const tryNumber = (value: unknown): number | null =>
      typeof value === "number" && Number.isFinite(value) ? value : null;

    const bag = metadata as Record<string, unknown>;

    return {
      contentType: tryString(bag.contentType ?? null),
      storedName: tryString(bag.storedName ?? null),
      uploadedBy: tryNumber(bag.uploadedBy ?? null),
    };
  }
}
