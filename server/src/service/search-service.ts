import type { SearchRepository } from "@/data/repository/search-repo.js";
import log from "@/utils/logger.js";

/**
 * Service for search and typeahead functionality
 */
export class SearchService {
  private searchRepository;

  constructor(searchRepository: SearchRepository) {
    this.searchRepository = searchRepository;
  }

  /**
   * Get typeahead search suggestions for a query
   * @param query Search query string
   * @param userId User ID
   * @param limit Maximum number of results
   * @param type Match type ("substring" or "prefix")
   * @returns Array of search results
   */
  public async getTypeAheadSuggestions(
    query: string,
    userId: string,
    limit: number,
    type: "substring" | "prefix",
  ) {
    const cleanedQuery = query.trim().toLowerCase();
    if (!cleanedQuery) return [];

    log.debug([cleanedQuery, userId, limit, type], "typeahead");
    // basic matching, later we will expand this to be more powerful

    const prefix = type === "prefix" ? `${cleanedQuery}%` : `%${cleanedQuery}%`;
    return await this.searchRepository.getSearchResults(prefix, userId, limit);
  }
}
