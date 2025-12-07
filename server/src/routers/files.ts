import z from "zod";
import { FileRepository } from "../data/repository/file-repo.js";
import { channelRole } from "../data/roles.js";
import { FileService } from "../service/file-service.js";
import { S3StorageAdapter } from "../storage/s3-adapter.js";
import { withErrorHandling } from "../trpc/error_handler.js";
import {
  ensureHasRole,
  procedure,
  protectedProcedure,
  router,
} from "../trpc/trpc.js";
import { InternalServerError } from "../types/errors.js";
import {
  confirmUploadInputSchema,
  createPresignedUploadInputSchema,
  createPresignedUploadOutputSchema,
  deleteFileInputSchema,
  fileDownloadPayloadSchema,
  getFileInputSchema,
  uploadForChannelInputSchema,
  uploadForUserInputSchema,
} from "../types/file-types.js";
import { ensureNOTUsingAws, ensureUsingAws } from "../utils/aws.js";
import log from "../utils/logger.js";

if (
  !(process.env.S3_BUCKET_NAME && process.env.USE_PRESIGNED_UPLOADS === "true")
) {
  throw new Error("Cannot proceed without AWS credentials");
}

const adapter = new S3StorageAdapter({
  bucket: process.env.S3_BUCKET_NAME,
  region: process.env.AWS_REGION,
  publicBaseUrl: `https://${process.env.S3_BUCKET_NAME}.s3.amazonaws.com`,
});
const fileRepository = new FileRepository();
const fileService = new FileService(fileRepository, adapter);

const createPresignedUpload = protectedProcedure
  .input(createPresignedUploadInputSchema)
  .output(createPresignedUploadOutputSchema)
  .meta({
    openapi: {
      method: "POST",
      path: "/files.createPresignedUpload",
      summary: "Get S3 presigned upload URL for a file (metadata only)",
      tags: ["Files"],
    },
  })
  .mutation(async ({ ctx, input }) =>
    withErrorHandling("createPresignedUpload", async () => {
      ensureUsingAws("Presigned uploads not enabled");
      const userId = ctx.auth.user.id;
      try {
        return await fileService.createPresignedUpload(
          userId,
          input.fileName,
          { contentType: input.contentType ?? "application/octet-stream" },
          Number(process.env.PRESIGN_EXPIRY_SECONDS) || undefined,
        );
      } catch (err) {
        log.error(err, "Presigned upload creation failed");
        throw new InternalServerError("Failed to create upload URL");
      }
    }),
  );

const confirmUpload = protectedProcedure
  .input(confirmUploadInputSchema)
  .mutation(async ({ ctx, input }) =>
    withErrorHandling("confirmUpload", async () => {
      ensureUsingAws("Cannot confirm upload without AWS");
      const userId = ctx.auth.user.id;
      try {
        await fileService.confirmPresignedUpload(
          userId,
          input.fileId,
          input.fileName,
          input.storedName,
          { contentType: input.contentType },
        );
        log.info(
          { fileId: input.fileId, userId },
          "File upload confirmed and persisted",
        );
        return { ok: true };
      } catch (err) {
        log.error(err, "Failed to confirm presigned upload");
        throw new InternalServerError("Failed to confirm upload");
      }
    }),
  );

const uploadForUser = protectedProcedure
  .input(uploadForUserInputSchema)
  .mutation(async ({ ctx, input }) =>
    withErrorHandling("uploadForUser", async () => {
      ensureNOTUsingAws("FileSystem uploads not enabled");
      const userId = ctx.auth.user.id;
      const { file, contentType } = input;
      const stream = await fileService.fileLikeToReadable(file);
      try {
        const fileId = await fileService.storeFileFromStream(
          userId,
          file.name,
          stream,
          { contentType: contentType ?? "application/octet-stream" },
        );
        return { fileId };
      } catch (err) {
        log.error(err, "File upload failed");
        throw new InternalServerError("Failed to store file");
      }
    }),
  );

const uploadForChannel = protectedProcedure
  .input(uploadForChannelInputSchema)
  .mutation(async ({ ctx, input }) =>
    withErrorHandling("uploadForChannel", async () => {
      ensureNOTUsingAws("FileSystem uploads not enabled");
      ensureHasRole(ctx, [channelRole("post", input.channelId)]);

      const userId = ctx.auth.user.id;
      const { file, contentType } = input;

      const stream = await fileService.fileLikeToReadable(file);
      const resolvedContentType =
        contentType ?? file.type ?? "application/octet-stream";
      try {
        const fileId = await fileService.storeFileFromStream(
          userId,
          file.name,
          stream,
          { contentType: resolvedContentType },
        );

        return { fileId };
      } catch (err) {
        log.error(err, "Channel file upload failed");
        throw new InternalServerError("Failed to store file");
      }
    }),
  );

const getFile = procedure
  .input(getFileInputSchema)
  .output(fileDownloadPayloadSchema)
  .meta({
    openapi: {
      method: "POST",
      path: "/files.getFile",
      summary: "Get a file stream from its UUID",
      tags: ["Files"],
    },
  })
  .query(async ({ input }) =>
    withErrorHandling("getFile", async () => {
      try {
        // Use the URL-based flow for downloads. This keeps S3 and
        // presigned-download logic separated from streaming concerns.
        const urlData = await fileService.getFileUrl(input.fileId);

        return {
          fileName: urlData.fileName,
          contentType: urlData.contentType ?? "application/octet-stream",
          data: urlData.url,
        };
      } catch (err) {
        log.error(err, "File retrieval failed");
        throw new InternalServerError("Failed to retrieve file");
      }
    }),
  );

const deleteFile = protectedProcedure
  .input(deleteFileInputSchema)
  .output(z.object({ ok: z.boolean() }))
  .meta({
    openapi: {
      method: "POST",
      path: "/files.deleteFile",
      summary: "Delete a file and its DB record",
      tags: ["Files"],
    },
  })
  .mutation(async ({ input }) =>
    withErrorHandling("deleteFile", async () => {
      try {
        const fileRecord = await fileRepository.getFile(input.fileId);
        const location = fileRecord.location;
        const deleted = await fileService.adapter.delete(location);
        await fileRepository.deleteFile(input.fileId);
        return { ok: deleted };
      } catch (err) {
        log.error(err, "Failed to delete file");
        throw new InternalServerError("Failed to delete file");
      }
    }),
  );

export const filesRouter = router({
  uploadForUser,
  uploadForChannel,
  getFile,
  createPresignedUpload,
  confirmUpload,
  deleteFile,
});

export { fileService };
