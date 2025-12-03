import { sql } from "drizzle-orm";

// =============================================================================
// Algorithm Weights Configuration
// =============================================================================
// These weights control the relative importance of each scoring component.
// They should sum to 1.0 for the final score to be normalized.

/** Weight for vector similarity (semantic matching) */
const VECTOR_SIMILARITY_WEIGHT = 0.5;

/** Weight for meeting format compatibility */
const MEETING_FORMAT_WEIGHT = 0.15;

/** Weight for hours commitment compatibility */
const HOURS_COMMITMENT_WEIGHT = 0.15;

/** Weight for mentor load balancing (fewer mentees = higher score) */
const LOAD_BALANCING_WEIGHT = 0.2;

/**
 * Recommendation query using the hybrid algorithm for mentor recommendations.
 * 
 * Scoring components:
 * 1. Vector similarity (${VECTOR_SIMILARITY_WEIGHT} weight) - cosine similarity between mentee and mentor embeddings
 * 2. Meeting format compatibility (${MEETING_FORMAT_WEIGHT} weight) - soft match with diffusion
 * 3. Hours commitment compatibility (${HOURS_COMMITMENT_WEIGHT} weight) - soft match with tolerance
 * 4. Mentor load balancing (${LOAD_BALANCING_WEIGHT} weight) - boost mentors with fewer active mentees
 * 
 * Uses diffusion for soft filtering - even without exact matches, candidates still get scores.
 * 
 * @param userId - The mentee user ID requesting recommendations
 * @param limit - Maximum number of recommendations to return
 */
export const recommendationQuery = (
  userId: string,
  limit: number,
) => sql`
WITH
-- ------------------------------------------------------------
-- 1. Mentors user already matched with
-- ------------------------------------------------------------
user_existing_matches AS (
    SELECT DISTINCT mentor_user_id
    FROM mentorship_matches
    WHERE requestor_user_id = ${userId}
      AND status IN ('pending', 'accepted')
),

-- ------------------------------------------------------------
-- 2. The user's existing valid cached recommendations
-- ------------------------------------------------------------
existing_valid_recs AS (
    SELECT recommended_mentor_ids, expires_at
    FROM mentor_recommendations
    WHERE user_id = ${userId}
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
    SELECT jsonb_array_elements_text(mentor_ids) AS mentor_user_id
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
        true AS from_existing,
        1.0 AS score
    FROM mentors m
    JOIN existing_recommendations er ON er.mentor_user_id = m.user_id
    LEFT JOIN user_existing_matches uem ON uem.mentor_user_id = m.user_id
    WHERE m.status = 'active'
),
existing_count AS (
    SELECT COUNT(*) AS cnt FROM prioritized_existing
),

-- ------------------------------------------------------------
-- 5. Hybrid Algorithm CTEs
-- ------------------------------------------------------------
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
    WHERE me.user_id = ${userId} AND me.user_type = 'mentee'
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
        
        -- Vector similarity component (weight: ${VECTOR_SIMILARITY_WEIGHT})
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
        ) * ${VECTOR_SIMILARITY_WEIGHT} AS vector_score,
        
        -- Meeting format compatibility (weight: ${MEETING_FORMAT_WEIGHT})
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
        END * ${MEETING_FORMAT_WEIGHT} AS format_score,
        
        -- Hours commitment compatibility (weight: ${HOURS_COMMITMENT_WEIGHT})
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
        END * ${HOURS_COMMITMENT_WEIGHT} AS hours_score,
        
        -- Mentor load balancing (weight: ${LOAD_BALANCING_WEIGHT})
        -- Boost mentors with fewer active mentees to distribute load
        CASE
            WHEN COALESCE(mmc.active_mentee_count, 0) = 0 THEN 1.0      -- No mentees: full boost
            WHEN COALESCE(mmc.active_mentee_count, 0) = 1 THEN 0.85     -- 1 mentee: good
            WHEN COALESCE(mmc.active_mentee_count, 0) = 2 THEN 0.7      -- 2 mentees: decent
            WHEN COALESCE(mmc.active_mentee_count, 0) = 3 THEN 0.5      -- 3 mentees: moderate
            ELSE GREATEST(0.2, 1.0 - COALESCE(mmc.active_mentee_count, 0)::float / 10.0)  -- Gradual falloff
        END * ${LOAD_BALANCING_WEIGHT} AS load_score
        
    FROM mentors m
    CROSS JOIN mentee_data md
    LEFT JOIN mentorship_embeddings mentor_emb 
        ON mentor_emb.user_id = m.user_id AND mentor_emb.user_type = 'mentor'
    LEFT JOIN mentor_mentee_counts mmc 
        ON mmc.mentor_user_id = m.user_id
    WHERE m.user_id != ${userId}
      AND m.status = 'active'
      AND m.user_id NOT IN (SELECT mentor_user_id FROM user_existing_matches)
),

-- ------------------------------------------------------------
-- 6. Algorithm candidate set
-- ------------------------------------------------------------
algorithmic_ranked_candidates AS (
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
),

-- ------------------------------------------------------------
-- 7. If cached recs exist but are fewer than limit, fill gap
-- ------------------------------------------------------------
fill_gap AS (
    SELECT *
    FROM algorithmic_ranked_candidates
    WHERE EXISTS (SELECT 1 FROM has_valid_recs WHERE has_valid = true)
    ORDER BY score DESC
    LIMIT GREATEST(0, ${limit} - (SELECT cnt FROM existing_count))
),

-- ------------------------------------------------------------
-- 8. If *no cached recs*: pending matches first
-- ------------------------------------------------------------
pending_matches AS (
    SELECT
        m.*,
        true AS has_requested,
        1 AS priority,
        false AS from_existing,
        1.0 AS score
    FROM user_existing_matches uem
    JOIN mentors m ON m.user_id = uem.mentor_user_id
    WHERE m.status = 'active'
      AND NOT EXISTS (SELECT 1 FROM has_valid_recs WHERE has_valid = true)
),

-- ------------------------------------------------------------
-- 9. If *no cached recs*: fill remainder via the algorithm
-- ------------------------------------------------------------
new_recommendations AS (
    SELECT *
    FROM algorithmic_ranked_candidates
    WHERE NOT EXISTS (SELECT 1 FROM has_valid_recs WHERE has_valid = true)
    ORDER BY score DESC
    LIMIT GREATEST(0, ${limit} - (SELECT COUNT(*) FROM pending_matches))
),

-- ------------------------------------------------------------
-- 10. Merge all candidate lists together
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
-- 11. Store/update the cached result
-- ------------------------------------------------------------
inserted AS (
    INSERT INTO mentor_recommendations (user_id, recommended_mentor_ids, expires_at)
    SELECT 
        ${userId},
        to_jsonb(array_agg(user_id)),
        NOW() + INTERVAL '30 days'
    FROM combined
    ON CONFLICT (user_id) DO UPDATE SET
        recommended_mentor_ids = EXCLUDED.recommended_mentor_ids,
        expires_at = EXCLUDED.expires_at
    RETURNING recommendation_id
)

-- ------------------------------------------------------------
-- 12. Final output
-- ------------------------------------------------------------
SELECT * FROM combined;
`;
