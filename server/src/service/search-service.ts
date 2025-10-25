import type { SearchRepository } from "../data/repository/search-repo.js";

export class SearchService {
  private searchRepository;

  constructor(searchRepository: SearchRepository) {
    this.searchRepository = searchRepository;
  }

  public async getTypeAheadSuggestions(
    query: string,
    userId: string,
    limit: number,
  ) {
    const prefix = `${query}%`; // prefix matching, later we will expand this to be more powerful

    return await this.searchRepository.getSearchResults(prefix, userId, limit);
  }
}
