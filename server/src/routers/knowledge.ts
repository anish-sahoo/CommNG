import z from "zod";
import { KnowledgeRepository } from "../data/repository/knowledge-repo.js";
import { fileService } from "../routers/files.js";
import { KnowledgeService } from "../service/knowledge-service.js";
import { withErrorHandling } from "../trpc/error_handler.js";
import { protectedProcedure, router } from "../trpc/trpc.js";
import {
  createFolderInFolderInputSchema,
  createFolderInputSchema,
  createItemAttachmentInputSchema,
  createItemInputSchema,
  deleteFolderInputSchema,
  deleteItemAttachmentInputSchema,
  deleteItemInputSchema,
  getFolderAncestorsInputSchema,
  getFoldersInFolderInputSchema,
  getItemAttachmentInputSchema,
  getItemInputSchema,
  getItemsInFolderInputSchema,
  knowledgeAttachmentOutputSchema,
  knowledgeAttachmentWithFileOutputSchema,
  knowledgeFolderOutputSchema,
  knowledgeItemOutputSchema,
  replaceItemAttachmentInputSchema,
  simpleOkSchema,
  updateFolderNameInputSchema,
  updateItemInputSchema,
} from "../types/knowledge-types.js";

const knowledgeService = new KnowledgeService(
  new KnowledgeRepository(),
  fileService,
);

const getRootFolders = protectedProcedure
  .output(z.array(knowledgeFolderOutputSchema))
  .meta({
    openapi: {
      method: "POST",
      path: "/knowledge.getRootFolders",
      summary: "Get root-level knowledge folders",
      tags: ["Knowledge"],
    },
  })
  .query(() =>
    withErrorHandling("getRootFolders", async () => {
      return await knowledgeService.getRootFolders();
    }),
  );

const getFolderAncestors = protectedProcedure
  .input(getFolderAncestorsInputSchema)
  .output(z.array(knowledgeFolderOutputSchema))
  .meta({
    openapi: {
      method: "POST",
      path: "/knowledge.getFolderAncestors",
      summary: "Get a folder and all its ancestors up to the root",
      tags: ["Knowledge"],
    },
  })
  .query(({ input }) =>
    withErrorHandling("getFolderAncestors", async () => {
      return await knowledgeService.getFolderWithAncestors(input.folderId);
    }),
  );

const getFoldersInFolder = protectedProcedure
  .input(getFoldersInFolderInputSchema)
  .output(z.array(knowledgeFolderOutputSchema))
  .meta({
    openapi: {
      method: "POST",
      path: "/knowledge.getFoldersInFolder",
      summary: "Get child folders for a parent folder",
      tags: ["Knowledge"],
    },
  })
  .query(({ input }) =>
    withErrorHandling("getFoldersInFolder", async () => {
      return await knowledgeService.getChildFolders(input.parentFolderId);
    }),
  );

const getItemsInFolder = protectedProcedure
  .input(getItemsInFolderInputSchema)
  .output(z.array(knowledgeItemOutputSchema))
  .meta({
    openapi: {
      method: "POST",
      path: "/knowledge.getItemsInFolder",
      summary: "Get knowledge items in a folder",
      tags: ["Knowledge"],
    },
  })
  .query(({ input }) =>
    withErrorHandling("getItemsInFolder", async () => {
      return await knowledgeService.getItemsByFolder(input.folderId);
    }),
  );

const getItem = protectedProcedure
  .input(getItemInputSchema)
  .output(knowledgeItemOutputSchema)
  .meta({
    openapi: {
      method: "POST",
      path: "/knowledge.getItem",
      summary: "Get a single knowledge item by id",
      tags: ["Knowledge"],
    },
  })
  .query(({ input }) =>
    withErrorHandling("getItem", async () => {
      return await knowledgeService.getItemById(input.itemId);
    }),
  );

const getItemAttachment = protectedProcedure
  .input(getItemAttachmentInputSchema)
  .output(knowledgeAttachmentWithFileOutputSchema.nullable())
  .meta({
    openapi: {
      method: "POST",
      path: "/knowledge.getItemAttachment",
      summary: "Get the current attachment for a knowledge item",
      tags: ["Knowledge"],
    },
  })
  .query(({ input }) =>
    withErrorHandling("getItemAttachment", async () => {
      return await knowledgeService.getItemAttachment(input.itemId);
    }),
  );

const createFolder = protectedProcedure
  .input(createFolderInputSchema)
  .output(knowledgeFolderOutputSchema)
  .meta({
    openapi: {
      method: "POST",
      path: "/knowledge.createFolder",
      summary: "Create a root knowledge folder",
      tags: ["Knowledge"],
    },
  })
  .mutation(({ ctx, input }) =>
    withErrorHandling("createFolder", async () => {
      return await knowledgeService.createFolder(input.title, ctx.auth.user.id);
    }),
  );

const createFolderInFolder = protectedProcedure
  .input(createFolderInFolderInputSchema)
  .output(knowledgeFolderOutputSchema)
  .meta({
    openapi: {
      method: "POST",
      path: "/knowledge.createFolderInFolder",
      summary: "Create a child knowledge folder",
      tags: ["Knowledge"],
    },
  })
  .mutation(({ ctx, input }) =>
    withErrorHandling("createFolderInFolder", async () => {
      return await knowledgeService.createFolderInFolder(
        input.parentFolderId,
        input.title,
        ctx.auth.user.id,
      );
    }),
  );

const updateFolderName = protectedProcedure
  .input(updateFolderNameInputSchema)
  .output(knowledgeFolderOutputSchema)
  .meta({
    openapi: {
      method: "POST",
      path: "/knowledge.updateFolderName",
      summary: "Rename an existing knowledge folder",
      tags: ["Knowledge"],
    },
  })
  .mutation(({ input }) =>
    withErrorHandling("updateFolderName", async () => {
      return await knowledgeService.renameFolder(input.folderId, input.title);
    }),
  );

const createItem = protectedProcedure
  .input(createItemInputSchema)
  .output(knowledgeItemOutputSchema)
  .meta({
    openapi: {
      method: "POST",
      path: "/knowledge.createItem",
      summary: "Create a knowledge item",
      tags: ["Knowledge"],
    },
  })
  .mutation(({ ctx, input }) =>
    withErrorHandling("createItem", async () => {
      return await knowledgeService.createItem(input, ctx.auth.user.id);
    }),
  );

const updateItem = protectedProcedure
  .input(updateItemInputSchema)
  .output(knowledgeItemOutputSchema)
  .meta({
    openapi: {
      method: "POST",
      path: "/knowledge.updateItem",
      summary: "Update mutable knowledge item fields",
      tags: ["Knowledge"],
    },
  })
  .mutation(({ input }) =>
    withErrorHandling("updateItem", async () => {
      const { itemId, ...updates } = input;
      return await knowledgeService.updateItem(itemId, updates);
    }),
  );

const createItemAttachment = protectedProcedure
  .input(createItemAttachmentInputSchema)
  .output(knowledgeAttachmentOutputSchema)
  .meta({
    openapi: {
      method: "POST",
      path: "/knowledge.createItemAttachment",
      summary: "Attach a file to a knowledge item",
      tags: ["Knowledge"],
    },
  })
  .mutation(({ input }) =>
    withErrorHandling("createItemAttachment", async () => {
      return await knowledgeService.createItemAttachment(
        input.itemId,
        input.fileId,
      );
    }),
  );

const replaceItemAttachment = protectedProcedure
  .input(replaceItemAttachmentInputSchema)
  .output(knowledgeAttachmentOutputSchema)
  .meta({
    openapi: {
      method: "POST",
      path: "/knowledge.replaceItemAttachment",
      summary: "Replace knowledge item attachment and delete the old file",
      tags: ["Knowledge"],
    },
  })
  .mutation(({ input }) =>
    withErrorHandling("replaceItemAttachment", async () => {
      return await knowledgeService.replaceItemAttachment(
        input.itemId,
        input.fileId,
      );
    }),
  );

const deleteFolder = protectedProcedure
  .input(deleteFolderInputSchema)
  .output(simpleOkSchema)
  .meta({
    openapi: {
      method: "POST",
      path: "/knowledge.deleteFolder",
      summary: "Soft-delete a folder and all its contents",
      tags: ["Knowledge"],
    },
  })
  .mutation(({ input }) =>
    withErrorHandling("deleteFolder", async () => {
      return await knowledgeService.deleteFolder(input.folderId);
    }),
  );

const deleteItem = protectedProcedure
  .input(deleteItemInputSchema)
  .output(simpleOkSchema)
  .meta({
    openapi: {
      method: "POST",
      path: "/knowledge.deleteItem",
      summary: "Soft-delete a knowledge item",
      tags: ["Knowledge"],
    },
  })
  .mutation(({ input }) =>
    withErrorHandling("deleteItem", async () => {
      return await knowledgeService.deleteItem(input.itemId);
    }),
  );

const deleteItemAttachment = protectedProcedure
  .input(deleteItemAttachmentInputSchema)
  .output(simpleOkSchema)
  .meta({
    openapi: {
      method: "POST",
      path: "/knowledge.deleteItemAttachment",
      summary: "Delete knowledge item attachment and underlying file",
      tags: ["Knowledge"],
    },
  })
  .mutation(({ input }) =>
    withErrorHandling("deleteItemAttachment", async () => {
      return await knowledgeService.deleteItemAttachment(input.itemId);
    }),
  );

export const knowledgeRouter = router({
  getRootFolders,
  getFolderAncestors,
  getFoldersInFolder,
  getItemsInFolder,
  getItem,
  getItemAttachment,
  createFolder,
  createFolderInFolder,
  updateFolderName,
  createItem,
  updateItem,
  createItemAttachment,
  replaceItemAttachment,
  deleteFolder,
  deleteItem,
  deleteItemAttachment,
});
