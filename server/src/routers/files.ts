import { TRPCError } from "@trpc/server";
import { FileRepository } from "../data/repository/file-repo.js";
import { FileService } from "../service/file-service.js";
import { policyEngine } from "../service/policy-engine.js";
import { FileSystemStorageAdapter } from "../storage/filesystem-adapter.js";
import { procedure, router } from "../trpc/trpc.js";
import { ForbiddenError, UnauthorizedError } from "../types/errors.js";
import type { FileDownloadPayload } from "../types/file-types.js";
import {
  getFileInputSchema,
  uploadForChannelInputSchema,
  uploadForUserInputSchema,
} from "../types/file-types.js";
import log from "../utils/logger.js";

const fileService = new FileService(
  new FileRepository(),
  new FileSystemStorageAdapter(),
);

const uploadForUser = procedure
  .input(uploadForUserInputSchema)
  .meta({
    requiresAuth: true,
    description: "Upload a user-specific file (profile picture, etc.)",
  })
  .mutation(async ({ ctx, input }) => {
    // replace with auth middleware later -----------------\
    const userId = ctx.userId;
    if (!userId) {
      throw new UnauthorizedError("Sign In required");
    }
    // replace with auth middleware later -----------------/

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
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to store file",
      });
    }
  });

const uploadForChannel = procedure
  .input(uploadForChannelInputSchema)
  .meta({
    requiresAuth: true,
    description:
      "Upload a channel-specific file (post attachment, cover photo, etc.)",
  })
  .mutation(async ({ ctx, input }) => {
    // replace with auth middleware later -----------------\
    const userId = ctx.userId;
    if (!userId) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Sign in required",
      });
    }
    // replace with auth middleware later -----------------/

    const { file, channelId, action, contentType } = input;

    const allowed = await policyEngine.validate(
      userId,
      `channel:${channelId}:${action}`,
    );
    if (!allowed) {
      throw new ForbiddenError(
        `No ${action} permission for channel ${channelId}`,
      );
    }

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
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to store file",
      });
    }
  });

const getFile = procedure
  .input(getFileInputSchema)
  .meta({ requiresAuth: true, description: "Get a file from its UUID" })
  .query(async ({ input }) => {
    try {
      const fileData = await fileService.getFileStream(input.fileId);
      if (!fileData) {
        throw new TRPCError({ code: "NOT_FOUND", message: "File not found" });
      }

      const buffer = await new Promise<Buffer>((resolve, reject) => {
        const chunks: Buffer[] = [];
        fileData.stream.on("data", (chunk) =>
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)),
        );
        fileData.stream.on("end", () => resolve(Buffer.concat(chunks)));
        fileData.stream.on("error", reject);
      });

      const payload: FileDownloadPayload = {
        fileName: fileData.fileName,
        contentType: fileData.contentType ?? "application/octet-stream",
        data: buffer.toString("base64"),
      };
      return payload;
    } catch (err) {
      log.error(err, "File retrieval failed");
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to retrieve file",
      });
    }
  });

export const filesRouter = router({
  uploadForUser,
  uploadForChannel,
  getFile,
});
