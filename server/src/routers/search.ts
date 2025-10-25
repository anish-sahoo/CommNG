import { SearchRepository } from "../data/repository/search-repo.js";
import { SearchService } from "../service/search-service.js";
import { withErrorHandling } from "../trpc/error_handler.js";
import { protectedProcedure, router } from "../trpc/trpc.js";
import { typeaheadSchema } from "../types/search-types.js";
import log from "../utils/logger.js";

const searchService = new SearchService(new SearchRepository());

const typeahead = protectedProcedure
  .meta({
    description: "Typeahead suggestions for the UI search bar",
  })
  .input(typeaheadSchema)
  .query(async ({ input, ctx }) => {
    return withErrorHandling("typeahead", async () => {
      const cleanedQuery = input.query.trim().toLowerCase();
      if (!cleanedQuery) return [];

      const userId = ctx.auth.user.id;
      log.debug({ cleanedQuery, user_id: userId }, "typeahead");

      return await searchService.getTypeAheadSuggestions(
        cleanedQuery,
        userId,
        input.limit,
      );
    });
  });

export const searchRouter = router({
  typeahead,
});
