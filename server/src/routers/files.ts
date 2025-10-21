import express, { type Request, type Response } from "express";
import Busboy from "busboy";
import type { FileInfo } from "busboy";
import { FileRepository } from "../data/repository/file-repo.js";
import { FileService } from "../service/file-service.js";
import type { Readable } from "node:stream";

const fileRouter = express.Router();
const MAX_BYTES = 10 * 1024 * 1024;

const fileRepo = new FileRepository();
const fileEngine = new FileService(fileRepo);

async function getUserFromReq(req: Request) {
  const auth = req.headers.authorization?.split(" ")[1];
  if (!auth) return null;
  return { userId: "unknown" };
}

fileRouter.post("/upload", async (req: Request, res: Response) => {
  const user = await getUserFromReq(req);
  if (!user?.userId) return res.status(401).json({ error: "Unauthorized" });

  const busboy = new Busboy({ headers: req.headers, limits: { fileSize: MAX_BYTES } });
  let responded = false;
  let sawFile = false;

  busboy.on("file", (fieldname: string, fileStream: Readable, info: FileInfo) => {
    sawFile = true;
    const { filename, mimeType } = info;
    const destName = `${user.userId}/${Date.now()}-${filename}`;

    let fileTooLarge = false;
    fileStream.on("limit", () => {
      fileTooLarge = true;
      fileStream.resume(); // drain stream to prevent hanging
    });
    handleFileUpload(destName, fileStream, filename, mimeType, fileTooLarge);
  });

    async function handleFileUpload(
      destName: string,
      fileStream: Readable,
      filename: string,
      mimeType: string,
      fileTooLarge: boolean
    ) {
      try {
        if (fileTooLarge) {
          if (!responded) {
            responded = true;
            res.status(413).json({ error: "File too large (max 10MB)" });
          }
          return;
        }

        const fileId = await fileEngine.storeFileFromStream(destName, fileStream, {
          contentType: mimeType,
        });

        if (!responded) {
          responded = true;
          res.status(201).json({ fileId, filename, path: destName });
        }
      } catch (err: any) {
        if (!responded) {
          responded = true;
          res.status(500).json({ error: "Upload failed", details: err.message });
        }
      }
    }

  busboy.on("error", () => {
    if (!responded) {
      responded = true;
      res.status(500).json({ error: "Upload parsing error" });
    }
  });

  busboy.on("finish", () => {
    if (!sawFile && !responded) {
      responded = true;
      res.status(400).json({ error: "No file uploaded" });
    }
  });
  req.pipe(busboy);
});


export default fileRouter;