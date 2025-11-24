import { sql } from "drizzle-orm";
import { channelSubscriptions, channels, users } from "../../data/db/schema.js";
import { db } from "../../data/db/sql.js";
import type { SearchResult } from "../../types/search-types.js";

const UNIVERSITIES = [
  "UMass Amherst",
  "UMass Boston",
  "UMass Dartmouth",
  "UMass Lowell",
  "Bridgewater State University",
  "Fitchburg State University",
  "Framingham State University",
  "Salem State University",
  "Westfield State University",
  "Worcester State University",
];

const uniValues = sql.join(
  UNIVERSITIES.map((u, i) => sql`(${sql.raw(String(i))}, ${u})`),
  sql`, `,
);

/**
 * Repository to handle search queries for users, channels, and universities
 */
export class SearchRepository {
  /**
   * Get search results for users, channels, and universities
   * @param searchString Search string (case-insensitive)
   * @param userId User ID for channel filtering
   * @param limit Maximum number of results
   * @returns Array of search result objects
   */
  public async getSearchResults(
    searchString: string,
    userId: string,
    limit: number,
  ) {
    const rows = await db.execute<SearchResult>(sql`
            SELECT kind, id, label FROM (
              SELECT 'user' AS kind, ${users.id}::text AS id, ${users.name} AS label
              FROM ${users}
              WHERE lower(${users.name}) ILIKE ${searchString}
    
              UNION ALL
    
              SELECT 'channel' AS kind, ${channels.channelId}::text AS id, ${channels.name} AS label
              FROM ${channels}
              INNER JOIN ${channelSubscriptions} cs ON cs.channel_id = ${channels.channelId}
              WHERE cs.user_id = ${userId} AND lower(${channels.name}) ILIKE ${searchString}
    
              UNION ALL
    
              SELECT 'university' AS kind, v.idx::text AS id, v.name AS label
              FROM (VALUES ${uniValues}) AS v(idx, name)
              WHERE lower(v.name) ILIKE ${searchString}
            ) t
            ORDER BY length(label), label
            LIMIT ${limit}
          `);

    return rows.rows ?? [];
  }
}
