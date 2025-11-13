import type { Readable } from "node:stream";

/**
 * Abstract base class for file storage adapters
 */
export abstract class StorageAdapter {
  /**
   * Store a file from a readable stream
   * @param filename File name to store
   * @param input Readable stream
   * @param opts Optional file input stream options
   * @returns File path object
   */
  abstract storeStream(
    filename: string,
    input: Readable,
    opts?: FileInputStreamOptions,
  ): Promise<FilePath>;
  
  /**
   * Get a readable stream for a stored file
   * @param path File path
   * @returns Readable stream
   */
  abstract getStream(path: string): Promise<Readable>;
  
  /**
   * Delete a stored file
   * @param path File path
   * @returns True if deleted, false otherwise
   */
  abstract delete(path: string): Promise<boolean>;
  
  /**
   * Get a URL for a stored file
   * @param path File path
   * @returns File URL
   */
  abstract getUrl(path: string): Promise<string>;
  
  /**
   * Generate a presigned upload URL
   * @param storageName Storage name
   * @param expiresSeconds Expiration time in seconds
   * @param contentType Content type
   * @returns Presigned upload URL
   */
  abstract generatePresignedUploadUrl(
    storageName: string,
    expiresSeconds: number,
    contentType: string | undefined,
  ): Promise<string>;
}

export type FileInputStreamOptions = {
  contentType?: string;
};

export type FilePath = {
  path: string;
};
