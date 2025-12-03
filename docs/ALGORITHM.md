# Mentor Matching Algorithm

This document describes the hybrid search algorithm used to recommend mentors to mentees in the mentorship program.

## Overview

The algorithm combines **vector similarity** (semantic matching) with **soft filtering** (preference compatibility) and **load balancing** to produce ranked mentor recommendations. It uses a **diffusion approach** for filtering, meaning even imperfect matches still return results rather than being excluded entirely.

## Scoring Components

The final score is a weighted sum of four components:

| Component | Weight | Description |
|-----------|--------|-------------|
| Vector Similarity | 50% | Semantic similarity between mentee and mentor embeddings |
| Meeting Format | 15% | Compatibility of preferred meeting formats |
| Hours Commitment | 15% | Compatibility of time availability |
| Load Balancing | 20% | Boost for mentors with fewer active mentees |

---

## 1. Vector Similarity (50% weight)

Uses cosine similarity between embedding vectors stored in PostgreSQL (pgvector). The vector score is computed as a weighted combination:

| Comparison | Weight | Description |
|------------|--------|-------------|
| Profile ↔ Profile | 50% | Overall profile embedding similarity |
| Mentee's hope_to_gain ↔ Mentor's why_interested | 30% | What mentee wants vs. why mentor participates |
| Mentee's why_interested ↔ Mentor's profile | 20% | Mentee motivation vs. mentor's overall profile |

If no embeddings exist, a default score of 0.3 is used.

---

## 2. Meeting Format Compatibility (15% weight)

Soft matching with diffusion - no hard filtering, just scoring penalties:

| Scenario | Score |
|----------|-------|
| Exact match | 1.0 |
| Either has "no-preference" | 0.9 |
| Either is NULL | 0.8 |
| Either is "hybrid" | 0.7 |
| No match (diffusion fallback) | 0.3 |

---

## 3. Hours Commitment Compatibility (15% weight)

Gradual scoring based on how close the time commitments are:

| Scenario | Score |
|----------|-------|
| Both NULL | 0.7 |
| One is NULL | 0.6 |
| Within 2 hours difference | 1.0 |
| Within 5 hours difference | 0.8 |
| Mentor offers more than needed | 0.6 |
| Mentor offers less | Gradual decay (min 0.2) |

The decay formula for "mentor offers less": `max(0.2, 1.0 - gap/10)`

---

## 4. Mentor Load Balancing (20% weight)

Ensures fair distribution by boosting mentors with fewer active mentees:

| Active Mentees | Score |
|----------------|-------|
| 0 | 1.0 |
| 1 | 0.85 |
| 2 | 0.7 |
| 3 | 0.5 |
| 4+ | Gradual decay (min 0.2) |

The decay formula for 4+: `max(0.2, 1.0 - count/10)`

---

## Caching

Recommendations are cached in the `mentor_recommendations` table with a 30-day expiration. The algorithm:

1. Checks for valid cached recommendations first
2. If cache exists but has fewer than the limit, fills gaps with fresh algorithm results
3. If no cache exists, generates fresh recommendations
4. Stores/updates the cache on each run

---

## Usage

The algorithm is invoked via `MatchingService.generateMentorRecommendations(userId)` when a new mentee profile is created. Results are retrieved through `getMentorshipData()`.
