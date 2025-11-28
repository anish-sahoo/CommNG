import { z } from "zod";

export const EmbedInputSchema = z.object({
  inputText: z.string(),
});

export const EmbedBatchInputSchema = z.object({
  inputText: z.array(z.string()),
});

export const EmbedResponseSchema = z.object({
  embedding: z.array(z.number()),
});

export const EmbedBatchResponseSchema = z.object({
  embeddings: z.array(z.array(z.number())),
});

// exported TypeScript types (inferred from zod schemas)
export type EmbedInput = z.infer<typeof EmbedInputSchema>;
export type EmbedBatchInput = z.infer<typeof EmbedBatchInputSchema>;
export type EmbedResponse = z.infer<typeof EmbedResponseSchema>;
export type EmbedBatchResponse = z.infer<typeof EmbedBatchResponseSchema>;

// Simplified body type used by the service invoke method — inputText can be a string or array.
export type InvokeModelBody = { inputText: string | string[] } & Record<
  string,
  unknown
>;
