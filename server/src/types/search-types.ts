import { z } from "zod";

export const typeaheadSchema = z.object({
  query: z.string().min(1, "query must be at least 1 character"),
  limit: z
    .number()
    .int()
    .min(3)
    .max(20, "Too many results")
    .optional()
    .default(10),
  searchType: z.enum(["substring", "prefix"]).default("prefix"),
});

export type SearchResult = {
  id: string;
  label: string;
  kind: "user" | "channel" | "university";
};
