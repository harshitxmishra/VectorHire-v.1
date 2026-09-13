# VectorHire — Job Matching & Recruiter Workspace Documentation

## 1. Overview & Recruiter Workflow

Phase 6.3 establishes a complete recruiter workflow centered around job descriptions, whole-dataset match intelligence, and candidate evaluation:

```
+-------------------+      +-------------------------+      +--------------------------+
|  Job Directory    | ---> |   Job Detail Workspace  | ---> |   Run AI Matching        |
| /job-descriptions |      |  /job-descriptions/[id] |      | (Synchronous AI Engine)  |
+-------------------+      +-------------------------+      +--------------------------+
                                       |
                                       v
                           +-------------------------+
                           | Whole-Job Metrics Bar   |
                           | Total / High (>=80) / Avg|
                           +-------------------------+
                                       |
                                       v
                           +-------------------------+
                           | Filter / Search / Sort  |
                           | URL-Backed Pagination   |
                           +-------------------------+
                                       |
                                       v
                           +-------------------------+
                           | Match Explainability    |
                           | & Candidate Profile Nav |
                           +-------------------------+
```

---

## 2. Match Scoring & Presentation Semantics

The matching engine compares a candidate's profile (name, branch, AI projects, research, GitHub, resume text, test scores) against a Job Description's title and requirements using Gemini AI (`aiGenerateJSON`).

### Database Fields Stored in `job_match_results`:
- `match_percentage` (0–100 integer)
- `matched_skills` (`text[]` array)
- `missing_skills` (`text[]` array)
- `experience_match` (`text`)
- `education_match` (`text`)
- `recommendation` (`text`)
- `evaluated_at` (`timestamptz`)

### Visual Presentation Thresholds (Strictly Non-Altering):
- **Score $\ge$ 80%**: Emerald / High visual match badge
- **Score 65% – 79%**: Amber / Moderate visual match badge
- **Score < 65%**: Rose / Low visual match badge

*Note: Thresholds are presentation styling only and do not alter or reinterpret the underlying AI score.*

---

## 3. Whole-Dataset Summary Metrics vs. Paginated Page

A critical architectural requirement in Phase 6.3 is that match summary metrics (`totalMatches`, `highMatchCount`, `averageMatchScore`) represent **all candidates matched for that job description**, rather than being derived from the current 25-row paginated view:

```typescript
export interface JobMatchMetrics {
  totalMatches: number;
  highMatchCount: number;
  averageMatchScore: number | null;
}
```

### Two-Stage Database Operation
Rather than assuming single-roundtrip RPC complexity, `findPaginatedByJobId` executes a structured two-stage operation:
1. **Lightweight Aggregate Query**: Selects `match_percentage` across all rows for the `job_description_id` to compute whole-job metrics (`totalMatches`, `highMatchCount >= 80`, `averageMatchScore`).
2. **Paginated Relational Query**: Executes the filtered query using `candidate:candidates!inner(...)` with PostgREST `foreignTable: 'candidates'` bounded search across `full_name`, `email`, `college`, and `branch`.


---

## 4. Disambiguated Empty States

The workspace UI differentiates between three distinct empty states using backend metadata (`candidateCount`, `totalMatchesForJob`, and `total`):

1. **No candidates in database (`candidateCount === 0`)**:
   - Message: *"No candidates found in database. Please upload candidates before running AI matching."*
   - CTA: *"Go to Candidates"* -> `/candidates`
2. **No matches calculated yet (`candidateCount > 0 && totalMatchesForJob === 0`)**:
   - Message: *"AI matching has not been computed for this job description yet."*
   - CTA: *"Run AI Matching"* button with in-flight lock.
3. **Zero filter matches (`totalMatchesForJob > 0 && total === 0`)**:
   - Message: *"No candidates match your current filter criteria."*
   - CTA: *"Reset Filters"*

---

## 5. API Endpoints

### Backend (NestJS Modular API):
- `GET /api/v1/jobs/:id` — Retrieve job description details
- `GET /api/v1/matching/jd/:id/paginated?page=1&limit=25&minScore=80&status=screened&college=Stanford&search=John&sortBy=match_percentage&sortOrder=desc` — Paginated matches with whole-job metrics and candidate joins
- `POST /api/v1/matching/jd/:id/run` — Batch evaluate candidate matches (`candidate_ids?: number[]`, `force?: boolean`)
- `POST /api/v1/matching/evaluate` — Single candidate evaluation

### Frontend BFF Routes:
- `GET /api/job-descriptions/[id]`
- `GET /api/job-matches?jobDescriptionId=2&page=1&limit=25...`
- `POST /api/job-matches/run`
