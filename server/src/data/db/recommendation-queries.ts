import { SQL, sql } from "drizzle-orm";

export const recommendationQuery = (algorithm: SQL<unknown>, limit: number) => sql`
WITH
-- ------------------------------------------------------------
-- 1. Mentors user already matched with
-- ------------------------------------------------------------
user_existing_matches AS (
    SELECT DISTINCT mentor_user_id
    FROM mentorship_matches
    WHERE requestor_user_id = $1
      AND status IN ('pending', 'accepted')
),

-- ------------------------------------------------------------
-- 2. The user's existing valid cached recommendations
-- ------------------------------------------------------------
existing_valid_recs AS (
    SELECT recommended_mentor_ids, expires_at
    FROM mentor_recommendations
    WHERE user_id = $1
      AND (expires_at IS NULL OR expires_at > NOW())
    LIMIT 1
),
has_valid_recs AS (
    SELECT
        COUNT(*) > 0 AS has_valid,
        (array_agg(recommended_mentor_ids))[1] AS mentor_ids
    FROM existing_valid_recs
),

-- ------------------------------------------------------------
-- 3. Expand existing recs into row form
-- ------------------------------------------------------------
existing_recommendations AS (
    SELECT unnest(mentor_ids) AS mentor_user_id
    FROM has_valid_recs
    WHERE has_valid = true
),

-- ------------------------------------------------------------
-- 4. Bring in mentor records for existing recs
-- ------------------------------------------------------------
prioritized_existing AS (
    SELECT 
        m.*,
        CASE WHEN uem.mentor_user_id IS NOT NULL THEN true ELSE false END AS has_requested,
        CASE WHEN uem.mentor_user_id IS NOT NULL THEN 1 ELSE 2 END AS priority,
        true AS from_existing
    FROM mentors m
    JOIN existing_recommendations er ON er.mentor_user_id = m.user_id
    LEFT JOIN user_existing_matches uem ON uem.mentor_user_id = m.user_id
    WHERE m.status = 'active'
),
existing_count AS (
    SELECT COUNT(*) AS cnt FROM prioritized_existing
),

-- ------------------------------------------------------------
-- 5. Algorithm candidate set: replace this later with the hybrid search algorithm
-- ------------------------------------------------------------
algorithmic_ranked_candidates AS (
    ${algorithm}
),
-- If no cached recs exist, we use this set directly.
-- If cached recs do exist, we will use some of these to fill gaps.

-- ------------------------------------------------------------
-- 6. If cached recs exist but are fewer than 10, fill gap using the algorithm output
-- ------------------------------------------------------------
fill_gap AS (
    SELECT *
    FROM algorithmic_ranked_candidates
    WHERE EXISTS (SELECT 1 FROM has_valid_recs WHERE has_valid = true)
    ORDER BY score DESC  -- <— SORTING BASED ON ALGORITHM SCORE
    LIMIT GREATEST(0, ${limit} - (SELECT cnt FROM existing_count))
),

-- ------------------------------------------------------------
-- 7. If *no cached recs*: pending matches first
-- ------------------------------------------------------------
pending_matches AS (
    SELECT
        m.*,
        true AS has_requested,
        1 AS priority,
        false AS from_existing
    FROM user_existing_matches uem
    JOIN mentors m ON m.user_id = uem.mentor_user_id
    WHERE m.status = 'active'
      AND NOT EXISTS (SELECT 1 FROM has_valid_recs WHERE has_valid = true)
),

-- ------------------------------------------------------------
-- 8. If *no cached recs*: fill remainder via the algorithm
-- ------------------------------------------------------------
new_recommendations AS (
    SELECT *
    FROM algorithmic_ranked_candidates
    WHERE NOT EXISTS (SELECT 1 FROM has_valid_recs WHERE has_valid = true)
    ORDER BY score DESC
    LIMIT GREATEST(0, ${limit} - (SELECT COUNT(*) FROM pending_matches))
),

-- ------------------------------------------------------------
-- 9. Merge all candidate lists together
-- ------------------------------------------------------------
combined AS (
    SELECT * FROM prioritized_existing
    UNION ALL SELECT * FROM fill_gap
    UNION ALL SELECT * FROM pending_matches
    UNION ALL SELECT * FROM new_recommendations
    ORDER BY priority, score DESC
    LIMIT ${limit}
),

-- ------------------------------------------------------------
-- 10. Store/update the cached result
-- ------------------------------------------------------------
inserted AS (
    INSERT INTO mentor_recommendations (user_id, recommended_mentor_ids, expires_at)
    SELECT 
        $1,
        array_agg(user_id),
        NOW() + INTERVAL '30 days'
    FROM combined
    ON CONFLICT (user_id) DO UPDATE SET
        recommended_mentor_ids = EXCLUDED.recommended_mentor_ids,
        expires_at = EXCLUDED.expires_at
    RETURNING recommendation_id
)

-- ------------------------------------------------------------
-- 11. Final output
-- ------------------------------------------------------------
SELECT * FROM combined;
`


export const RANDOM_ALGORITHM = sql`
    SELECT 
        m.*,
        false AS has_requested,
        2 AS priority,
        false AS from_existing,
        RANDOM() AS score
    FROM mentors m
    WHERE m.user_id != $1
      AND m.status = 'active'
      AND m.user_id NOT IN (SELECT mentor_user_id FROM user_existing_matches)
`