import type { Readable } from "node:stream";

export abstract class StorageAdapter {
  abstract storeStream(
    filename: string,
    input: Readable,
    opts?: FileInputStreamOptions,
  ): Promise<FilePath>;
  abstract getStream(path: string): Promise<Readable>;
  abstract delete(path: string): Promise<boolean>;
  abstract getUrl(path: string): Promise<string>;
}

export type FileInputStreamOptions = {
  contentType?: string;
};

export type FilePath = {
  path: string;
};
