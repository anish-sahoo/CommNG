import type { Readable } from "node:stream";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  type FileInputStreamOptions,
  type FilePath,
  StorageAdapter,
} from "../storage/storage-adapter.js";
import { ForbiddenError } from "../types/errors.js";
import log from "../utils/logger.js";

/**
 * Storage adapter for AWS S3 operations with presigned URL support
 */
export class S3StorageAdapter extends StorageAdapter {
  private s3: S3Client;
  private bucket: string;
  private publicBaseUrl: string;

  /**
   * Create S3 storage adapter
   * @param opts Object with bucket, optional region, and public base url
   */
  constructor(opts: {
    bucket: string;
    region?: string;
    publicBaseUrl: string;
  }) {
    super();
    this.bucket = opts.bucket;
    this.publicBaseUrl = opts.publicBaseUrl;
    this.s3 = new S3Client({
      region: opts.region ?? process.env.AWS_REGION ?? "us-east-1",
    });
    log.info(
      { bucketName: this.bucket, base_url: this.publicBaseUrl },
      "Starting AWS S3 connection",
    );
  }

  /**
   * Store a file from a readable stream to S3
   * @param filename File name
   * @param input Readable stream
   * @param opts File input stream options
   * @returns File path object with S3 object key
   */
  public async storeStream(
    filename: string,
    input: Readable,
    opts?: FileInputStreamOptions,
  ): Promise<FilePath> {
    // Perform a server-side Put as a fallback. Do NOT set public ACLs here;
    // rely on presigned URLs / CloudFront for public access in production.
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: filename,
        Body: input,
        ContentType: opts?.contentType ?? "application/octet-stream",
      }),
    );

    // Store the object key as the location so callers can request a GET url later
    return { path: filename };
  }

  /**
   * Get stream from S3 (not supported, use getUrl instead)
   * @param _path S3 object key
   * @throws ForbiddenError always (use presigned GET URLs instead)
   */
  public async getStream(_path: string): Promise<Readable> {
    // Streaming directly from S3 is not allowed in this adapter. Clients
    // must use presigned GET URLs (getUrl) to retrieve file contents.
    throw new ForbiddenError(
      "Direct streaming from S3 is not supported. Use getUrl() instead.",
    );
  }

  /**
   * Delete a file from S3
   * @param path S3 object key
   * @returns True if deleted, false otherwise
   */
  public async delete(path: string): Promise<boolean> {
    try {
      await this.s3.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: path,
        }),
      );
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get a presigned GET URL for an S3 object
   * @param path S3 object key
   * @returns Presigned GET URL
   */
  public async getUrl(path: string): Promise<string> {
    // Return a presigned GET URL so private buckets work correctly.
    return await this.generatePresignedGetUrl(path);
  }

  /**
   * Generate a presigned PUT URL for uploading to S3
   * @param key S3 object key
   * @param expiresSeconds Expiration time in seconds (default: 900)
   * @param contentType Content type (optional)
   * @returns Presigned PUT URL
   */
  public async generatePresignedUploadUrl(
    key: string,
    expiresSeconds = 900,
    contentType?: string,
  ): Promise<string> {
    const cmd = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType ?? "application/octet-stream",
    });
    return await getSignedUrl(this.s3, cmd, { expiresIn: expiresSeconds });
  }

  /**
   * Generate a presigned GET URL for downloading from S3
   * @param key S3 object key
   * @param expiresSeconds Expiration time in seconds (default: 3600)
   * @returns Presigned GET URL
   */
  public async generatePresignedGetUrl(
    key: string,
    expiresSeconds = 3600,
  ): Promise<string> {
    const cmd = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    return await getSignedUrl(this.s3, cmd, { expiresIn: expiresSeconds });
  }
}
