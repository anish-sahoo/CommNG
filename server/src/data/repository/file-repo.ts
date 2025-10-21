import { randomUUID } from "node:crypto";

export class FileRepository {
  public async insertFile(filePath: string, fileName: string): Promise<string> {
    const fileId = randomUUID();

    // TODO: Insert into database with fileId, filePath, fileName
    return fileId;
  }

  public async getFile(fileId: string): Promise<{ filePath: string; fileName: string } | null> {
    // TODO: Query database for file by fileId
    // For now, return null (will be implemented when DB is connected)
    return null;
  }
}
