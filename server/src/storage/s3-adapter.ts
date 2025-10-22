import type { Readable } from "node:stream";
import {
  type FileInputStreamOptions,
  type FilePath,
  StorageAdapter,
} from "./storage-adapter.js";

export class S3Adapter extends StorageAdapter {
  public async storeStream(
    _filename: string,
    _input: Readable,
    _opts?: FileInputStreamOptions,
  ): Promise<FilePath> {
    return { path: "" };
  }
  public async delete(_path: string): Promise<boolean> {
    return false;
  }
  public async getUrl(_path: string): Promise<string> {
    return "";
  }
}
