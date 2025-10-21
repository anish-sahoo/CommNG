import { randomUUID } from "node:crypto";
import * as fs from "node:fs";
import * as fsp from "node:fs/promises";
import path from "node:path";
import type { Readable } from "node:stream";
import { pipeline } from "node:stream";
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
    _opts?: FileInputStreamOptions,
  ): Promise<FilePath> {
    const destDir = path.resolve(process.cwd(), this.STORAGE_BASE_PATH);
    await fsp.mkdir(destDir, { recursive: true });
    const tmpName = `${filename}.${randomUUID()}.tmp`;
    const tmpPath = path.join(destDir, tmpName);
    const finalPath = path.join(destDir, filename);

    // createWriteStream (callback-style) for piping
    const ws = fs.createWriteStream(tmpPath, { flags: "w" });

    try {
      // pipeline will throw if the stream errors
      await pipeline(input, ws);
      // move into final location atomically
      await fsp.rename(tmpPath, finalPath);
      return { path: finalPath };
    } catch (err) {
      // cleanup temp file on error
      try {
        await fsp.unlink(tmpPath);
      } catch (_) {
        /* ignore */
      }
      throw err;
    }
  }

  public async delete(_path: string): Promise<boolean> {
    return false;
  }
  public async getUrl(_path: string): Promise<string> {
    return "";
  }
}
