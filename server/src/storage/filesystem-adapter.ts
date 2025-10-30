import * as fs from "node:fs";
import * as fsp from "node:fs/promises";
import path from "node:path";
import type { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { ForbiddenError } from "../types/errors.js";
import {
  type FileInputStreamOptions,
  type FilePath,
  StorageAdapter,
} from "./storage-adapter.js";

export class FileSystemStorageAdapter extends StorageAdapter {
  private STORAGE_BASE_PATH = process.env.STORAGE_BASE_PATH ?? "../storage/";
  private BASE_URL =
    process.env.LOCAL_FILE_BASE_URL ?? "http://localhost:3000/files"; // optional

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

  public async getStream(filePath: string): Promise<Readable> {
    const destDir = path.resolve(process.cwd(), this.STORAGE_BASE_PATH);
    const absolutePath = path.join(destDir, filePath);
    await fsp.access(absolutePath, fs.constants.R_OK);
    return fs.createReadStream(absolutePath);
  }

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

  public async getUrl(filePath: string): Promise<string> {
    // Return a URL to serve locally (optional, requires express/static serving)
    return `${this.BASE_URL}/${filePath}`;
  }

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
