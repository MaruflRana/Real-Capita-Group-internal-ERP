# Prompt 49 Scope: Business Overview Content/UX Redesign

## Why This Workstream Was Opened

Prompts 48B-48D-R completed the visual architecture cleanup and flagship chart redesign for Business Overview. The page is now visually clean: one flagship 3-series bar+line chart (Revenue/Expenses/Net result), hierarchical KPI cards, a period table, and calculation notes. However, the page still functions as a raw data dump rather than an executive decision-support screen. The next priority is improving **content quality and UX usefulness** — what the page communicates and how it supports management decisions, not just how it looks.

## Core Goal

Transform Business Overview from "data display" to "management answer" — the page should answer the executive's core question in one glance, provide interpretation, and surface decision-relevant signals, all while preserving data accuracy and audit traceability.

## Core Principle

"Every element should earn its space by answering a management question or enabling a decision."

---

## Prompt 49A: Content/UX Audit and Blueprint (this prompt)

Planning only. No implementation. No code edits.

### Goal
- Audit the current page for content/UX weaknesses
- Propose the ideal page structure
- Decide what to implement in 49B
- Create the blueprint for supervisor review

### Forbidden scope
- Editing any application code
- Modifying any CSS
- Staging, committing, or pushing
- Backend, API, schema, migration, seed, auth, routing, or workflow changes

---

## Prompt 49B: Implement Business Overview Content/UX Redesign

Implementation of approved 49A blueprint changes. Frontend-only, using existing API response data. No backend changes.

### Allowed scope
- Renaming, regrouping, reordering existing KPI metrics and labels
- Adding frontend-derived insight strips (using existing report totals and bucket data)
- Improving section titles, descriptions, and narrative text
- Reordering period table columns for executive readability
- Adding collection efficiency context where data exists
- Refining the read-only notice wording

### Forbidden scope
- New backend endpoints or calculations
- Changes to other pages (dashboard, financial statements, module pages)
- New chart types or visual additions
- Schema, migration, seed, auth, routing, or workflow changes
- Staging, committing, or pushing

---

## Subsequent Prompts (after 49B approval)

### Prompt 49C — Final QA and checkpoint for Business Overview + broader 48E scope
