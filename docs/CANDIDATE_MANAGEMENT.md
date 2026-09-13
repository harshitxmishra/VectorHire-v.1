# VectorHire — Candidate Management & Recruiter Workflow Guide

**Phase:** 6.2 (Feature Engineering)  
**Status:** COMPLETE & VERIFIED  

---

## 1. Overview & Recruiter Workflow

Phase 6.2 delivers an integrated candidate management experience across the entire hiring lifecycle. Recruiters can browse, search, filter, sort, paginate, select, and bulk-update candidates with URL-backed state persistence, atomic status updates, and deep candidate intelligence visibility.

### End-to-End Mental Model:
```
Candidate Directory (/candidates)
        ↓
Server-Side Search & Multi-Facet Filtering
        ↓
Deterministic Sorting & Stable Pagination
        ↓
Visible Multi-Candidate Selection
        ↓
Bulk Status Action (PATCH /candidates/bulk-status)
        ↓
Unified Candidate Detail View (/candidates/[id])
        ↓
Resume, GitHub & AI Intelligence + Activity Timeline
        ↓
Return to Directory with Preserved Query State
```

---

## 2. Candidate Directory Capabilities

### A. Server-Side Search
- **Supported Fields**: Case-insensitive substring search across `full_name`, `email`, `college`, and `branch`.
- **Debounced Input**: Client-side input is debounced (350ms) before querying the backend.
- **URL Synchronization**: Search query is stored as `?search=term`. Changing search automatically resets pagination to Page 1.

### B. Multi-Facet Filtering
- **Status Filter**: Supports all 15 valid database statuses (enforced via `check_candidates_status`).
- **College Filter**: Filters by institution name.
- **AI Score Range**: Filter by minimum AI match score (`minScore`).
- **Filter Reset**: One-click "Reset All Filters" button clears all active search/filter params.

### C. Server-Side Sorting & Allowlist
- **Sort Fields**: Allowlisted to `ai_score`, `full_name`, `created_at`, `test_code`, `id`.
- **Sort Orders**: `asc` or `desc`.
- **Deterministic Secondary Order**: All queries append `.order('id', { ascending: true })` to guarantee deterministic pagination without row skipping or duplicate rendering.

### D. Scalable Pagination
- **Efficient DB Projection**: Queries only directory columns (`id, full_name, email, college, branch, status, ai_score, test_code, test_la, resume_url, github, created_at`) with single-roundtrip count (`count: 'exact'`), preventing payload bloat.
- **Page Controls**: Page number display, Previous/Next navigation, and configurable page size (10, 20, 50 candidates per page).

---

## 3. Selection & Bulk Status Actions

### A. Explicit "Select All Visible" Semantics
- Checkbox selection applies **strictly to visible candidates on the current page**.
- Prevents accidental bulk mutations across thousands of unseen matching rows.

### B. Bulk Action Toolbar
- Appears whenever 1 or more candidates are selected.
- Displays selected count (`X visible candidates selected`).
- Provides Status Change Dropdown with the 15 valid statuses.
- "Apply Status" triggers `PATCH /api/v1/candidates/bulk-status` (or `PATCH /api/candidates/bulk-status`).
- "Clear Selection" resets selection immediately.

---

## 4. Candidate Status Lifecycle & Invariants

- **15 Valid Statuses** (Enforced by SQL check constraint `check_candidates_status`):
  1. `applied`
  2. `reviewing`
  3. `shortlisted`
  4. `assessment sent`
  5. `assessment completed`
  6. `interview eligible`
  7. `interview scheduled`
  8. `interview completed`
  9. `offer extended`
  10. `rejected`
  11. `hired`
  12. `pending`
  13. `new`
  14. `reviewed`
  15. `interview`
- **Conditional Timeline Logging**:
  - `status_changed` events are emitted **only when `oldStatus !== newStatus`**.
  - Prevents audit log spam during idempotent bulk updates.

---

## 5. Candidate Profile / Detail Experience (`/candidates/[id]`)

The detail page (`/candidates/[id]`) aggregates existing domain intelligence without creating redundant AI services:

1. **Header & Profile Bar**: Full Name, Email, College, Branch, Avatar Initials, current Status Dropdown, and direct link to schedule interviews.
2. **Key Metrics Strip**: AI Fit Score gauge, GitHub Technical Score, Assessment Score, and CGPA.
3. **Action Trigger Bar**:
   - **Run AI Evaluation**: Triggers multi-provider AI evaluation with in-flight polling chip.
   - **Parse Resume**: Triggers SSRF-protected resume text extraction with in-flight polling chip.
   - **Analyze GitHub**: Triggers GitHub repository and activity analysis with in-flight polling chip.
4. **Tabbed Panels**:
   - **Overview**: Core profile attributes, test scores (`test_la`, `test_code`, average), highlighted AI project, and research publications.
   - **Resume Intelligence**: Source link, parsing status badge, and extracted resume text / skills.
   - **GitHub Insights**: GitHub handle, profile link, summary, and top language badges.
   - **AI Evaluation**: Structured recommendation, evaluation summary, key strengths, and potential gaps to probe.
   - **Activity Timeline**: Chronological event history from `candidate_timeline`.
