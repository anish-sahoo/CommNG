import { z } from "zod";

export const typeaheadSchema = z.object({
  query: z.string().min(1, "query must be at least 1 character"),
  limit: z.number().int().min(1).max(50, "query is too long").optional().default(10),
});

export type SearchResult = {
  id: string;
  label: string;
  kind: "user" | "channel" | "university";
};
