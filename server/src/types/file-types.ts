import type { ReadableStream as ReadableStreamWeb } from "node:stream/web";
import { z } from "zod";

export type FileLike = {
  name: string;
  size: number;
  type: string;
  arrayBuffer(): Promise<ArrayBuffer>;
  stream(): ReadableStreamWeb<Uint8Array>;
};

type FormDataEntryValueLike = string | FileLike;

type FormDataLike = {
  entries(): IterableIterator<[string, FormDataEntryValueLike]>;
};

const fileLikeSchema = z.object({
  name: z.string(),
  size: z.number(),
  type: z.string(),
  arrayBuffer: z.function({
    input: [],
    output: z.promise(z.instanceof(ArrayBuffer)),
  }),
  stream: z.function({
    input: [],
    output: z.custom<ReadableStreamWeb<Uint8Array>>(),
  }),
});

const formDataLikeSchema = z
  .custom<FormDataLike>(
    (value): value is FormDataLike =>
      typeof value === "object" &&
      value !== null &&
      typeof (value as FormDataLike).entries === "function",
    { message: "Expected form-data payload" },
  )
  .transform((fd) => {
    const result: Record<string, FormDataEntryValueLike> = {};
    for (const [key, rawValue] of fd.entries()) {
      result[key] = rawValue;
    }
    return result;
  });

const fileFieldSchema = z
  .custom<FileLike>(
    (value): value is FileLike => fileLikeSchema.safeParse(value).success,
    {
      message: "Expected file upload",
    },
  )
  .refine((file) => file.size > 0, {
    message: "File cannot be empty",
  });

// Create a custom schema that accepts Record<string, FormDataEntryValueLike>
const createLooseFormDataSchema = <T extends z.ZodRawShape>(shape: T) => {
  return z
    .custom<Record<string, FormDataEntryValueLike>>(
      (value): value is Record<string, FormDataEntryValueLike> => {
        return typeof value === "object" && value !== null;
      },
    )
    .transform((data) => {
      const schema = z.looseObject(shape);
      return schema.parse(data);
    });
};

export const uploadForUserInputSchema = formDataLikeSchema.pipe(
  createLooseFormDataSchema({
    file: fileFieldSchema,
    contentType: z.string().optional(),
  }),
);

export const uploadForChannelInputSchema = formDataLikeSchema.pipe(
  createLooseFormDataSchema({
    file: fileFieldSchema,
    channelId: z.coerce.number().int().positive({
      message: "channelId must be a positive integer",
    }),
    // action: z.enum(["write"]),
    contentType: z.string().optional(),
  }),
);

export const getFileInputSchema = z.object({
  fileId: z.string().min(1, "fileId is required"),
});

export type UploadForUserInput = z.infer<typeof uploadForUserInputSchema>;
export type UploadForChannelInput = z.infer<typeof uploadForChannelInputSchema>;
export type GetFileInput = z.infer<typeof getFileInputSchema>;

export const fileMetadataSchema = z
  .object({
    contentType: z
      .string()
      .trim()
      .min(1, "contentType cannot be empty")
      .nullable(),
    storedName: z
      .string()
      .trim()
      .min(1, "storedName cannot be empty")
      .nullable(),
    uploadedBy: z.string().nullable(),
    uploadedAt: z.string().datetime().nullable().optional(),
  })
  .strict();

export type FileMetadata = z.infer<typeof fileMetadataSchema>;

export type FileRecord = {
  fileId: string;
  fileName: string;
  location: string;
  metadata: FileMetadata | null;
};

export const fileDownloadPayloadSchema = z.object({
  fileName: z.string(),
  contentType: z.string(),
  data: z.string(),
});

export const fileStreamSchema = z.object({
  // stream is not validated at runtime, but kept for type completeness
  stream: z.any().optional(),
  fileName: z.string(),
  contentType: z.string().optional(),
  location: z.string(),
});

export const createPresignedUploadInputSchema = z.object({
  fileName: z.string().min(1),
  contentType: z.string().optional(),
  fileSize: z.number().optional(),
});

export const createPresignedUploadOutputSchema = z.object({
  fileId: z.string(),
  uploadUrl: z.string(),
  storedName: z.string(),
});

export const confirmUploadInputSchema = z.object({
  fileId: z.string().min(1),
  fileName: z.string().min(1),
  storedName: z.string().min(1),
  contentType: z.string().optional(),
});

export const deleteFileInputSchema = z.object({ fileId: z.string().min(1) });

export type FileStream = z.infer<typeof fileStreamSchema>;
export type FileStreamNullable = FileStream | null;
