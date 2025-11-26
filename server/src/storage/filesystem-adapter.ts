import * as fs from "node:fs";
import * as fsp from "node:fs/promises";
import path from "node:path";
import type { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import {
  type FileInputStreamOptions,
  type FilePath,
  StorageAdapter,
} from "@/storage/storage-adapter.js";
import { ForbiddenError } from "@/types/errors.js";

/**
 * Storage adapter for local filesystem operations
 */
export class FileSystemStorageAdapter extends StorageAdapter {
  private STORAGE_BASE_PATH = process.env.STORAGE_BASE_PATH ?? "../storage/";
  private BASE_URL =
    process.env.LOCAL_FILE_BASE_URL ?? "http://localhost:3000/files"; // optional

  /**
   * Store a file from a readable stream to local filesystem
   * @param filename File name
   * @param input Readable stream
   * @param _opts File input stream options (not used)
   * @returns File path object with relative path
   */
  public async storeStream(
    filename: string,
    input: Readable,
    _opts?: FileInputStreamOptions,
  ): Promise<FilePath> {
    const destDir = path.resolve(process.cwd(), this.STORAGE_BASE_PATH);
    const finalPath = path.join(destDir, filename);
    const finalDir = path.dirname(finalPath);

    await fsp.mkdir(finalDir, { recursive: true });
    const tmpPath = path.join(finalDir, `.${filename}.tmp`);

    const ws = fs.createWriteStream(tmpPath, { flags: "w" });
    try {
      await pipeline(input, ws);
      await fsp.rename(tmpPath, finalPath);

      const relativePath =
        path.relative(destDir, finalPath) || path.basename(finalPath);
      return { path: relativePath };
    } catch (err) {
      try {
        await fsp.unlink(tmpPath);
      } catch (_) {}
      throw err;
    }
  }

  /**
   * Get a readable stream for a file from local filesystem
   * @param filePath Relative file path
   * @returns Readable stream
   */
  public async getStream(filePath: string): Promise<Readable> {
    const destDir = path.resolve(process.cwd(), this.STORAGE_BASE_PATH);
    const absolutePath = path.join(destDir, filePath);
    await fsp.access(absolutePath, fs.constants.R_OK);
    return fs.createReadStream(absolutePath);
  }

  /**
   * Delete a file from local filesystem
   * @param filePath Relative file path
   * @returns True if deleted, false otherwise
   */
  public async delete(filePath: string): Promise<boolean> {
    try {
      const destDir = path.resolve(process.cwd(), this.STORAGE_BASE_PATH);
      const absolutePath = path.join(destDir, filePath);
      await fsp.unlink(absolutePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get a URL to serve file locally
   * @param filePath Relative file path
   * @returns URL string
   */
  public async getUrl(filePath: string): Promise<string> {
    // Return a URL to serve locally (optional, requires express/static serving)
    return `${this.BASE_URL}/${filePath}`;
  }

  /**
   * Generate presigned upload URL (not supported for filesystem adapter)
   * @param _storageName Storage name
   * @param _expiresSeconds Expiration time
   * @param _contentType Content type
   * @throws ForbiddenError always (not supported)
   */
  public async generatePresignedUploadUrl(
    _storageName: string,
    _expiresSeconds: number,
    _contentType: string | undefined,
  ): Promise<string> {
    // Filesystem adapter does not support presigned uploads.
    throw new ForbiddenError(
      "Presigned uploads are not supported by the filesystem adapter.",
    );
  }
}
