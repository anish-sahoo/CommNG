import type { Readable } from "node:stream";
import type { FileInfo } from "busboy";
import busboy from "busboy";
import express, { type Request, type Response } from "express";
import { FileRepository } from "../data/repository/file-repo.js";
import { FileService } from "../service/file-service.js";
import { policyEngine } from "../service/policy-engine.js";
import log from "../utils/logger.js";

const fileRouter = express.Router();
const MAX_BYTES = 10 * 1024 * 1024;

const fileRepo = new FileRepository();
const fileEngine = new FileService(fileRepo);

async function getUserFromReq(_req: Request) {
  // const auth = req.headers.authorization?.split(" ")[1];
  // if (!auth) return null;
  return { userId: 1 };
}

function sendResponse(
  res: Response,
  responded: { value: boolean },
  status: number,
  data: object,
) {
  if (!responded.value) {
    responded.value = true;
    res.status(status).json(data);
  }
}

type UploadHandler = (input: {
  filename: string;
  mimeType: string;
  stream: Readable;
}) => Promise<string>;

async function handleFileUpload(
  req: Request,
  res: Response,
  handler: UploadHandler,
) {
  return new Promise<void>((resolve) => {
    const responded = { value: false };
    let sawFile = false;

    const bb = busboy({
      headers: req.headers,
      limits: { fileSize: MAX_BYTES },
    });

    let cleaned = false;
    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      req.unpipe(bb);
      bb.removeAllListeners();
      req.resume();
      resolve();
    };

    bb.on("file", (_field: string, fileStream: Readable, info: FileInfo) => {
      if (responded.value) {
        fileStream.resume();
        return;
      }

      sawFile = true;
      const { filename, mimeType } = info;

      fileStream.on("limit", () => {
        sendResponse(res, responded, 413, {
          error: "File too large (max 10MB)",
        });
        log.warn("File upload failed: file too large");
        fileStream.destroy();
        cleanup();
      });

      handler({ filename, mimeType, stream: fileStream })
        .then((fileId) => {
          sendResponse(res, responded, 201, { fileId });
          cleanup();
        })
        .catch((err) => {
          sendResponse(res, responded, 500, {
            error: "Upload failed",
            details: err.message,
          });
          log.error(err, "File upload failed");
          cleanup();
        });
    });

    bb.on("error", () => {
      sendResponse(res, responded, 500, { error: "Upload parsing error" });
      cleanup();
    });

    bb.on("finish", () => {
      if (!sawFile) {
        sendResponse(res, responded, 400, { error: "No file uploaded" });
      }
      cleanup();
    });

    req.pipe(bb);
  });
}

fileRouter.post("/user", async (req: Request, res: Response) => {
  const user = await getUserFromReq(req);
  if (!user?.userId) return res.status(401).json({ error: "Unauthorized" });

  await handleFileUpload(req, res, async ({ filename, mimeType, stream }) => {
    return fileEngine.storeFileFromStream(user.userId, filename, stream, {
      contentType: mimeType,
    });
  });
});

fileRouter.post("/channel", async (req: Request, res: Response) => {
  const user = await getUserFromReq(req);
  if (!user?.userId) return res.status(401).json({ error: "Unauthorized" });

  const channelId = req.query.channelId as string | undefined;
  const action = req.query.action as "write" | "admin" | undefined;

  if (!channelId) {
    return res
      .status(400)
      .json({ error: "channelId query parameter is required" });
  }

  if (!action || (action !== "write" && action !== "admin")) {
    return res
      .status(400)
      .json({ error: "action query parameter must be write or admin" });
  }

  const allowed = await policyEngine.validate(
    user.userId,
    `channel:${channelId}:${action}`,
  );

  if (!allowed) {
    return res.status(403).json({
      error: `No ${action} permission for channel ${channelId}`,
    });
  }

  await handleFileUpload(req, res, async ({ filename, mimeType, stream }) => {
    return fileEngine.storeFileFromStream(user.userId, filename, stream, {
      contentType: mimeType,
    });
  });
});

fileRouter.get("/:fileId", async (req: Request, res: Response) => {
  const { fileId } = req.params;

  if (!fileId) {
    return res.status(400).json({ error: "File ID is required" });
  }
  log.info(`GET api/files/${fileId}`);
  try {
    const fileData = await fileEngine.getFileStream(fileId);

    if (!fileData) {
      return res.status(404).json({ error: "File not found" });
    }

    const { stream, fileName, contentType } = fileData;

    // Set headers for file download
    res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);
    res.setHeader("Content-Type", contentType ?? "application/octet-stream");

    // Pipe the stream to response (non-blocking, efficient)
    stream.pipe(res);

    // Handle stream errors
    stream.on("error", (err) => {
      log.error(err, "Error streaming file");
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to stream file" });
      }
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    log.error(err, "File retrieval failed");
    res
      .status(500)
      .json({ error: "Failed to retrieve file", details: message });
  }
});

export default fileRouter;
