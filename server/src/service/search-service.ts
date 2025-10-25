import type { SearchRepository } from "../data/repository/search-repo.js";
import log from "../utils/logger.js";

export class SearchService {
  private searchRepository;

  constructor(searchRepository: SearchRepository) {
    this.searchRepository = searchRepository;
  }

  public async getTypeAheadSuggestions(
    query: string,
    userId: string,
    limit: number,
    type: "substring" | "prefix",
  ) {
    const cleanedQuery = query.trim().toLowerCase();
    log.debug([cleanedQuery, userId, limit, type], "typeahead");
    if (!cleanedQuery) return [];
    // basic matching, later we will expand this to be more powerful
    const prefix = type === "prefix" ? `${query}%` : `%${query}%`;
    return await this.searchRepository.getSearchResults(prefix, userId, limit);
  }
}
