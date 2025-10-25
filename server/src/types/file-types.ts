import type { Readable } from "node:stream";
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

export const uploadForUserInputSchema = formDataLikeSchema.pipe(
  (
    z
      .object({
        file: fileFieldSchema,
        contentType: z.string().optional(),
      })
      .loose() as unknown as z.ZodType<any, Record<string, FormDataEntryValueLike>, any>
  ),
);

export const uploadForChannelInputSchema = formDataLikeSchema.pipe(
  (
    z
      .object({
        file: fileFieldSchema,
        channelId: z.coerce.number().int().positive({
          message: "channelId must be a positive integer",
        }),
        action: z.enum(["write", "admin"]),
        contentType: z.string().optional(),
      })
      .loose() as unknown as z.ZodType<any, Record<string, FormDataEntryValueLike>, any>
  ),
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
    uploadedBy: z.number().int().positive().nullable(),
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

export type FileDownloadPayload = {
  fileName: string;
  contentType: string;
  data: string;
};

export type FileStreamNullable = {
  stream: Readable;
  fileName: string;
  contentType?: string;
} | null;
