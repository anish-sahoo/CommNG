import type { Readable } from "node:stream";
import { FileRepository } from "../data/repository/file-repo.js";
import { FileSystemStorageAdapter } from "../storage/filesystem-adapter.js";
import { S3Adapter } from "../storage/s3-adapter.js";
import type {
  FileInputStreamOptions,
  StorageAdapter,
} from "../storage/storage-adapter.js";

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
    fileName: string,
    file: Readable,
    _opts?: FileInputStreamOptions,
  ): Promise<string> {
    const { path: filePath } = await this.adapter.storeStream(fileName, file);
    return this.fileRepository.insertFile(filePath, fileName);
  }
}
