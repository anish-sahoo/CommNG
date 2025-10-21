import type { Readable } from "node:stream";
import { FileRepository } from "../data/repository/file-repo.js";
import { FileSystemStorageAdapter } from "../storage/filesystem-adapter.js";
import { S3Adapter } from "../storage/s3-adapter.js";
import type {
  FileInputStreamOptions,
  StorageAdapter,
} from "../storage/storage-adapter.js";
import log from "../utils/logger.js";

/**
 * Policy Engine that handles everything related to access control (checking access, granting access, etc.)
 */
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
    fileName: string,
    file: Readable,
    opts?: FileInputStreamOptions,
  ): Promise<string> {
    log.info(`INSERT ${fileName} ${opts?.contentType} for user ${userId}`);
    fileName = fileName.replace(/\s+/g, "-").replace(/[^\x00-\x7F]/g, "");

    const { path: filePath } = await this.adapter.storeStream(
      fileName,
      file,
      opts,
    );

    const fileId = await this.fileRepository.insertFile(filePath, fileName);
    return fileId;
  }

  public async getFileStream(fileId: string): Promise<{ stream: Readable; fileName: string } | null> {
    const fileData = await this.fileRepository.getFile(fileId);
    if (!fileData) {
      return null;
    }

    const stream = await this.adapter.getStream(fileData.filePath);
    return { stream, fileName: fileData.fileName };
  }
}
