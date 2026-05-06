import type { KnowledgeRepository } from "../data/repository/knowledge-repo.js";
import log from "../utils/logger.js";

type FileDeletionService = {
  deleteFile: (fileId: string) => Promise<void>;
};

type CreateItemInput = {
  folderId?: string;
  name: string;
  description?: string;
  body?: string;
};

type UpdateItemInput = {
  folderId?: string | null;
  name?: string;
  description?: string | null;
  body?: string | null;
};

/**
 * Service layer for knowledge-base workflows.
 * Handles cross-repo side-effects such as deleting replaced attachments.
 */
export class KnowledgeService {
  constructor(
    private readonly knowledgeRepo: KnowledgeRepository,
    private readonly fileService: FileDeletionService,
  ) {}

  async getRootFolders() {
    return await this.knowledgeRepo.getRootFolders();
  }

  async getChildFolders(parentFolderId: string) {
    return await this.knowledgeRepo.getChildFolders(parentFolderId);
  }

  async getFolderWithAncestors(folderId: string) {
    return await this.knowledgeRepo.getFolderWithAncestors(folderId);
  }

  async getItemsByFolder(folderId: string) {
    return await this.knowledgeRepo.getItemsByFolder(folderId);
  }

  async getItemById(itemId: string) {
    return await this.knowledgeRepo.getItemById(itemId);
  }

  async getItemAttachment(itemId: string) {
    return await this.knowledgeRepo.getItemAttachment(itemId);
  }

  async createFolder(title: string, createdBy: string) {
    return await this.knowledgeRepo.createFolder({ title, createdBy });
  }

  async createFolderInFolder(
    parentFolderId: string,
    title: string,
    createdBy: string,
  ) {
    return await this.knowledgeRepo.createFolderInFolder(
      parentFolderId,
      title,
      createdBy,
    );
  }

  async renameFolder(folderId: string, title: string) {
    return await this.knowledgeRepo.renameFolder(folderId, title);
  }

  async createItem(input: CreateItemInput, createdBy: string) {
    return await this.knowledgeRepo.createItem({
      ...input,
      createdBy,
    });
  }

  async updateItem(itemId: string, input: UpdateItemInput) {
    return await this.knowledgeRepo.updateItem(itemId, input);
  }

  async createItemAttachment(itemId: string, fileId: string) {
    return await this.knowledgeRepo.createItemAttachment(itemId, fileId);
  }

  async replaceItemAttachment(itemId: string, newFileId: string) {
    const { attachment, oldFileId } =
      await this.knowledgeRepo.replaceItemAttachment(itemId, newFileId);

    if (oldFileId) {
      await this.fileService.deleteFile(oldFileId);
      log.info(
        { itemId, oldFileId, newFileId },
        "Replaced knowledge attachment and deleted old file",
      );
    }

    return attachment;
  }

  async deleteFolder(folderId: string) {
    await this.knowledgeRepo.deleteFolder(folderId);
    return { ok: true };
  }

  async deleteItem(itemId: string) {
    await this.knowledgeRepo.deleteItem(itemId);
    return { ok: true };
  }

  async deleteItemAttachment(itemId: string) {
    const oldFileId = await this.knowledgeRepo.deleteItemAttachment(itemId);

    if (oldFileId) {
      await this.fileService.deleteFile(oldFileId);
      log.info({ itemId, oldFileId }, "Deleted knowledge attachment file");
    }

    return { ok: true };
  }
}
