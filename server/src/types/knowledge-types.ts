import { z } from "zod";

const uuidSchema = z.string().uuid();

export const knowledgeFolderOutputSchema = z.object({
  folderId: uuidSchema,
  parentFolderId: uuidSchema.nullable(),
  title: z.string(),
  createdBy: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const knowledgeItemOutputSchema = z.object({
  itemId: uuidSchema,
  folderId: uuidSchema.nullable(),
  name: z.string(),
  description: z.string().nullable(),
  body: z.string().nullable(),
  createdBy: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const knowledgeAttachmentOutputSchema = z.object({
  attachmentId: uuidSchema,
  itemId: uuidSchema,
  fileId: uuidSchema,
  createdAt: z.date(),
});

export const knowledgeAttachmentWithFileOutputSchema =
  knowledgeAttachmentOutputSchema.extend({
    fileName: z.string(),
    location: z.string(),
    metadata: z.unknown().nullable(),
  });

export const getFolderAncestorsInputSchema = z.object({
  folderId: uuidSchema,
});

export const getFoldersInFolderInputSchema = z.object({
  parentFolderId: uuidSchema,
});

export const getItemsInFolderInputSchema = z.object({
  folderId: uuidSchema,
});

export const getItemInputSchema = z.object({
  itemId: uuidSchema,
});

export const getItemAttachmentInputSchema = z.object({
  itemId: uuidSchema,
});

export const createFolderInputSchema = z.object({
  title: z.string().trim().min(1).max(255),
});

export const createFolderInFolderInputSchema = z.object({
  parentFolderId: uuidSchema,
  title: z.string().trim().min(1).max(255),
});

export const updateFolderNameInputSchema = z.object({
  folderId: uuidSchema,
  title: z.string().trim().min(1).max(255),
});

export const createItemInputSchema = z.object({
  folderId: uuidSchema.optional(),
  name: z.string().trim().min(1).max(255),
  description: z.string().optional(),
  body: z.string().optional(),
});

export const updateItemInputSchema = z.object({
  itemId: uuidSchema,
  folderId: uuidSchema.nullable().optional(),
  name: z.string().trim().min(1).max(255).optional(),
  description: z.string().nullable().optional(),
  body: z.string().nullable().optional(),
});

export const createItemAttachmentInputSchema = z.object({
  itemId: uuidSchema,
  fileId: uuidSchema,
});

export const replaceItemAttachmentInputSchema = z.object({
  itemId: uuidSchema,
  fileId: uuidSchema,
});

export const deleteItemAttachmentInputSchema = z.object({
  itemId: uuidSchema,
});

export const deleteFolderInputSchema = z.object({
  folderId: uuidSchema,
});

export const deleteItemInputSchema = z.object({
  itemId: uuidSchema,
});

export const simpleOkSchema = z.object({ ok: z.boolean() });
