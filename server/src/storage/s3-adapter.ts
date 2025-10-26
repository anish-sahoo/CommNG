import { Readable } from "node:stream";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { StorageAdapter, type FileInputStreamOptions, type FilePath } from "./storage-adapter.js";
import { ForbiddenError } from "../types/errors.js";
import log from "../utils/logger.js";

export class S3StorageAdapter extends StorageAdapter {
  private s3: S3Client;
  private bucket: string;
  private publicBaseUrl: string;

  /**
   * @param opts.bucket - S3 bucket name
   * @param opts.region - AWS region
   * @param opts.publicBaseUrl - public URL base of the bucket
   */
  constructor(opts: { bucket: string; region?: string; publicBaseUrl: string }) {
    super();
    this.bucket = opts.bucket;
    this.publicBaseUrl = opts.publicBaseUrl;
    this.s3 = new S3Client({
      region: opts.region ?? process.env.AWS_REGION ?? "us-east-1",
    });
    log.info({bucketName: this.bucket, base_url: this.publicBaseUrl},'Starting AWS S3 connection')
  }

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

  public async getStream(_path: string): Promise<Readable> {
    // Streaming directly from S3 is not allowed in this adapter. Clients
    // must use presigned GET URLs (getUrl) to retrieve file contents.
    throw new ForbiddenError(
      "Direct streaming from S3 is not supported. Use getUrl() instead."
    );
  }

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

  public async getUrl(path: string): Promise<string> {
    // Return a presigned GET URL so private buckets work correctly.
    return await this.generatePresignedGetUrl(path);
  }

  public async generatePresignedUploadUrl(key: string, expiresSeconds = 900, contentType?: string): Promise<string> {
    const cmd = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType ?? "application/octet-stream",
    });
    return await getSignedUrl(this.s3, cmd, { expiresIn: expiresSeconds });
  }

  public async generatePresignedGetUrl(key: string, expiresSeconds = 3600): Promise<string> {
    const cmd = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    return await getSignedUrl(this.s3, cmd, { expiresIn: expiresSeconds });
  }
}
