<div align="center" style="margin: 1.5rem auto;">
  <table role="presentation" style="border:none;border-radius:18px;background:#0f172a;padding:1.5rem 2rem;box-shadow:0 10px 30px rgba(15,23,42,0.35);color:#f8fafc;width:100%;max-width:1200px;">
    <tr>
      <td style="vertical-align:middle;padding-right:1.5rem;">
        <img src="../web/public/icons/favicon_yellow.svg" alt="CommNG Favicon" width="72">
      </td>
      <td style="vertical-align:middle;">
        <h1 style="margin:0;font-size:2rem;color:#f8fafc;">🎯 Mentor Matching Algorithm</h1>
      </td>
    </tr>
  </table>
</div>

<p align="center">
  <a href="#overview">Overview</a> •
  <a href="#scoring-components">Scoring</a> •
  <a href="#1-vector-similarity-50-weight">Vector Similarity</a> •
  <a href="#2-meeting-format-compatibility-15-weight">Meeting Format</a> •
  <a href="#3-hours-commitment-compatibility-15-weight">Hours</a> •
  <a href="#4-mentor-load-balancing-20-weight">Load Balancing</a> •
  <a href="#caching">Caching</a> •
  <a href="#usage">Usage</a>
</p>

---

<a id="overview"></a>

## 🔍 Overview

The algorithm combines **vector similarity** (semantic matching) with **soft filtering** (preference compatibility) and **load balancing** to produce ranked mentor recommendations. It uses a **diffusion approach** for filtering, meaning even imperfect matches still return results rather than being excluded entirely.

<a id="scoring-components"></a>

## 📊 Scoring Components

The final score is a weighted sum of four components:

<div align="center">

| Component | Weight | Description |
|-----------|--------|-------------|
| Vector Similarity | 50% | Semantic similarity between mentee and mentor embeddings |
| Meeting Format | 15% | Compatibility of preferred meeting formats |
| Hours Commitment | 15% | Compatibility of time availability |
| Load Balancing | 20% | Boost for mentors with fewer active mentees |

</div>

> 💡 **Tip:** These weights are configurable in `recommendation-queries.ts`. Look for the constants at the top of the file (`VECTOR_SIMILARITY_WEIGHT`, `MEETING_FORMAT_WEIGHT`, `HOURS_COMMITMENT_WEIGHT`, `LOAD_BALANCING_WEIGHT`) to adjust them. Weights should sum to 1.0.

---

<a id="1-vector-similarity-50-weight"></a>

## 🧠 1. Vector Similarity (50% weight)

Uses cosine similarity between embedding vectors stored in PostgreSQL (pgvector). The vector score is computed as a weighted combination:

<div align="center">

| Comparison | Weight | Description |
|------------|--------|-------------|
| Profile ↔ Profile | 50% | Overall profile embedding similarity |
| Mentee's hope_to_gain ↔ Mentor's why_interested | 30% | What mentee wants vs. why mentor participates |
| Mentee's why_interested ↔ Mentor's profile | 20% | Mentee motivation vs. mentor's overall profile |

</div>

> If no embeddings exist, a default score of 0.3 is used.

---

<a id="2-meeting-format-compatibility-15-weight"></a>

## 📍 2. Meeting Format Compatibility (15% weight)

Soft matching with diffusion - no hard filtering, just scoring penalties:

<div align="center">

| Scenario | Score |
|----------|-------|
| Exact match | 1.0 |
| Either has "no-preference" | 0.9 |
| Either is NULL | 0.8 |
| Either is "hybrid" | 0.7 |
| No match (diffusion fallback) | 0.3 |

</div>

---

<a id="3-hours-commitment-compatibility-15-weight"></a>

## ⏰ 3. Hours Commitment Compatibility (15% weight)

Gradual scoring based on how close the time commitments are:

<div align="center">

| Scenario | Score |
|----------|-------|
| Both NULL | 0.7 |
| One is NULL | 0.6 |
| Within 2 hours difference | 1.0 |
| Within 5 hours difference | 0.8 |
| Mentor offers more than needed | 0.6 |
| Mentor offers less | Gradual decay (min 0.2) |

</div>

> The decay formula for "mentor offers less": `max(0.2, 1.0 - gap/10)`

---

<a id="4-mentor-load-balancing-20-weight"></a>

## ⚖️ 4. Mentor Load Balancing (20% weight)

Ensures fair distribution by boosting mentors with fewer active mentees:

<div align="center">

| Active Mentees | Score |
|----------------|-------|
| 0 | 1.0 |
| 1 | 0.85 |
| 2 | 0.7 |
| 3 | 0.5 |
| 4+ | Gradual decay (min 0.2) |

</div>

> The decay formula for 4+: `max(0.2, 1.0 - count/10)`

---

<a id="caching"></a>

## 💾 Caching

Recommendations are cached in the `mentor_recommendations` table with a 30-day expiration. The algorithm:

1. ✅ Checks for valid cached recommendations first
2. ✅ If cache exists but has fewer than the limit, fills gaps with fresh algorithm results
3. ✅ If no cache exists, generates fresh recommendations
4. ✅ Stores/updates the cache on each run

---

<a id="usage"></a>

## 🚀 Usage

The algorithm is implemented in `recommendation-queries.ts` and exposes a single function:

```typescript
recommendationQuery(userId: string, limit: number)
```

It is invoked via `MatchingService.generateMentorRecommendations(userId)` when a new mentee profile is created. Results are retrieved through `getMentorshipData()`.

---

**Last Updated**: December 2, 2025
