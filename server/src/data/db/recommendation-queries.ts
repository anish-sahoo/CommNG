import { type SQL, sql } from "drizzle-orm";

export const recommendationQuery = (
  algorithm: SQL<unknown>,
  limit: number,
) => sql`
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
`;

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
`;

/**
 * Hybrid search algorithm for mentor recommendations.
 * 
 * Scoring components:
 * 1. Vector similarity (0.5 weight) - cosine similarity between mentee and mentor embeddings
 * 2. Meeting format compatibility (0.15 weight) - soft match with diffusion
 * 3. Hours commitment compatibility (0.15 weight) - soft match with tolerance
 * 4. Mentor load balancing (0.2 weight) - boost mentors with fewer active mentees
 * 
 * Uses diffusion for soft filtering - even without exact matches, candidates still get scores.
 */
export const HYBRID_ALGORITHM = sql`
    -- Get mentee's embeddings and preferences
    mentee_data AS (
        SELECT 
            me.profile_embedding AS mentee_profile_emb,
            me.hope_to_gain_embedding AS mentee_hope_emb,
            me.why_interested_embedding AS mentee_why_emb,
            mt.preferred_meeting_format AS mentee_meeting_format,
            mt.hours_per_month_commitment AS mentee_hours
        FROM mentorship_embeddings me
        JOIN mentees mt ON mt.user_id = me.user_id
        WHERE me.user_id = $1 AND me.user_type = 'mentee'
        LIMIT 1
    ),
    
    -- Count active mentees per mentor for load balancing
    mentor_mentee_counts AS (
        SELECT 
            mentor_user_id,
            COUNT(*) AS active_mentee_count
        FROM mentorship_matches
        WHERE status = 'accepted'
        GROUP BY mentor_user_id
    ),
    
    -- Calculate scores for each mentor
    scored_mentors AS (
        SELECT 
            m.*,
            false AS has_requested,
            2 AS priority,
            false AS from_existing,
            
            -- Vector similarity component (weight: 0.5)
            -- Average of profile and why_interested similarities
            COALESCE(
                (
                    -- Profile embedding similarity (primary match)
                    COALESCE(1 - (mentor_emb.profile_embedding <=> md.mentee_profile_emb), 0) * 0.5 +
                    -- Cross-match: mentee's hope_to_gain vs mentor's why_interested 
                    COALESCE(1 - (mentor_emb.why_interested_embedding <=> md.mentee_hope_emb), 0) * 0.3 +
                    -- Cross-match: mentee's why_interested vs mentor's profile
                    COALESCE(1 - (mentor_emb.profile_embedding <=> md.mentee_why_emb), 0) * 0.2
                ),
                0.3  -- Default score if no embeddings
            ) * 0.5 AS vector_score,
            
            -- Meeting format compatibility (weight: 0.15)
            -- Full match: 1.0, partial match: 0.6, no preference involved: 0.8, no match: 0.3
            CASE
                -- Exact match
                WHEN m.preferred_meeting_format = md.mentee_meeting_format THEN 1.0
                -- Either has no preference
                WHEN m.preferred_meeting_format = 'no-preference' OR md.mentee_meeting_format = 'no-preference' THEN 0.9
                WHEN m.preferred_meeting_format IS NULL OR md.mentee_meeting_format IS NULL THEN 0.8
                -- Hybrid matches with in-person or virtual
                WHEN m.preferred_meeting_format = 'hybrid' OR md.mentee_meeting_format = 'hybrid' THEN 0.7
                -- No match but still consider (diffusion)
                ELSE 0.3
            END * 0.15 AS format_score,
            
            -- Hours commitment compatibility (weight: 0.15)
            -- Perfect match or close: high score, with gradual falloff
            CASE
                -- Both null - neutral
                WHEN m.hours_per_month_commitment IS NULL AND md.mentee_hours IS NULL THEN 0.7
                -- One is null - slight penalty
                WHEN m.hours_per_month_commitment IS NULL OR md.mentee_hours IS NULL THEN 0.6
                -- Within 2 hours - great match
                WHEN ABS(m.hours_per_month_commitment - md.mentee_hours) <= 2 THEN 1.0
                -- Within 5 hours - good match
                WHEN ABS(m.hours_per_month_commitment - md.mentee_hours) <= 5 THEN 0.8
                -- Mentor offers more than mentee needs - acceptable
                WHEN m.hours_per_month_commitment > md.mentee_hours THEN 0.6
                -- Mentor offers less - gradual penalty based on gap
                ELSE GREATEST(0.2, 1.0 - (md.mentee_hours - m.hours_per_month_commitment)::float / 10.0)
            END * 0.15 AS hours_score,
            
            -- Mentor load balancing (weight: 0.2)
            -- Boost mentors with fewer active mentees to distribute load
            CASE
                WHEN COALESCE(mmc.active_mentee_count, 0) = 0 THEN 1.0      -- No mentees: full boost
                WHEN COALESCE(mmc.active_mentee_count, 0) = 1 THEN 0.85     -- 1 mentee: good
                WHEN COALESCE(mmc.active_mentee_count, 0) = 2 THEN 0.7      -- 2 mentees: decent
                WHEN COALESCE(mmc.active_mentee_count, 0) = 3 THEN 0.5      -- 3 mentees: moderate
                ELSE GREATEST(0.2, 1.0 - COALESCE(mmc.active_mentee_count, 0)::float / 10.0)  -- Gradual falloff
            END * 0.2 AS load_score
            
        FROM mentors m
        CROSS JOIN mentee_data md
        LEFT JOIN mentorship_embeddings mentor_emb 
            ON mentor_emb.user_id = m.user_id AND mentor_emb.user_type = 'mentor'
        LEFT JOIN mentor_mentee_counts mmc 
            ON mmc.mentor_user_id = m.user_id
        WHERE m.user_id != $1
          AND m.status = 'active'
          AND m.user_id NOT IN (SELECT mentor_user_id FROM user_existing_matches)
    )
    
    -- Final selection with combined score
    SELECT 
        mentor_id,
        user_id,
        mentorship_preferences,
        years_of_service,
        eligibility_data,
        status,
        resume_file_id,
        strengths,
        personal_interests,
        why_interested_responses,
        career_advice,
        preferred_mentee_career_stages,
        preferred_meeting_format,
        hours_per_month_commitment,
        created_at,
        updated_at,
        has_requested,
        priority,
        from_existing,
        (vector_score + format_score + hours_score + load_score) AS score
    FROM scored_mentors
    ORDER BY score DESC
`;
