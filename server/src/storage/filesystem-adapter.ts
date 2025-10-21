import { randomUUID } from "node:crypto";
import * as fs from "node:fs";
import * as fsp from "node:fs/promises";
import path from "node:path";
import type { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import {
  type FileInputStreamOptions,
  type FilePath,
  StorageAdapter,
} from "./storage-adapter.js";

export class FileSystemStorageAdapter extends StorageAdapter {
  private STORAGE_BASE_PATH = process.env.STORAGE_BASE_PATH ?? "../storage/";

  public async storeStream(
    filename: string,
    input: Readable,
    opts?: FileInputStreamOptions,
  ): Promise<FilePath> {
    const destDir = path.resolve(process.cwd(), this.STORAGE_BASE_PATH);
    const finalPath = path.join(destDir, filename);
    const finalDir = path.dirname(finalPath);

    // Ensure the destination directory (including subdirectories) exists
    await fsp.mkdir(finalDir, { recursive: true });
    // Create temp file in the same directory as final file for atomic rename
    const tmpPath = path.join(
      finalDir,
      `.${filename}.tmp`,
    );

    const ws = fs.createWriteStream(tmpPath, { flags: "w" });
    try {
      // pipeline will throw if the stream errors
      await pipeline(input, ws);
      // move into final location atomically (works because same filesystem/directory)
      await fsp.rename(tmpPath, finalPath);
      return { path: finalPath };
    } catch (err) {
      // cleanup temp file on error
      try {
        await fsp.unlink(tmpPath);
      } catch (_) {}
      throw err;
    }
  }

  public async getStream(filePath: string): Promise<Readable> {
    // Verify file exists first
    await fsp.access(filePath, fs.constants.R_OK);
    // Return a readable stream
    return fs.createReadStream(filePath);
  }

  public async delete(_path: string): Promise<boolean> {
    return false;
  }
  public async getUrl(_path: string): Promise<string> {
    return "";
  }
}
