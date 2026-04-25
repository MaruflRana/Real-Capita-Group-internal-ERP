# UAT Issue Log Template

Use this template to record Phase 1 UAT issues. Copy the table into the working UAT record if testers need a separate editable file.

Checkpoint reference: `3bf83f5e`

## Severity Guide

| Severity | Meaning |
| --- | --- |
| Critical | Blocks release candidate acceptance; data loss, security failure, auth failure, posting corruption, backup/restore dry-run failure, or app-wide outage. |
| High | Blocks a key Phase 1 workflow for an intended role, but does not corrupt data. |
| Medium | Workaround exists, but the issue affects normal UAT execution or stakeholder confidence. |
| Low | Cosmetic, wording, or minor usability issue that does not block Phase 1 handoff. |

## Priority Guide

| Priority | Meaning |
| --- | --- |
| P0 | Must be fixed before Phase 1 acceptance. |
| P1 | Should be fixed before acceptance unless explicitly deferred by stakeholders. |
| P2 | Can be scheduled after acceptance if stakeholders agree. |
| P3 | Backlog or future improvement. |

## Issue Log

| Issue ID | Date | Tester | Role | Module | Scenario ID | Severity | Priority | Environment | Steps To Reproduce | Expected Result | Actual Result | Screenshot/Reference | Assigned To | Status | Resolution Notes | Retest Result |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| UAT-001 |  |  |  |  |  |  |  |  |  |  |  |  |  | Open |  |  |
| UAT-002 |  |  |  |  |  |  |  |  |  |  |  |  |  | Open |  |  |
| UAT-003 |  |  |  |  |  |  |  |  |  |  |  |  |  | Open |  |  |

## Status Values

- Open
- In triage
- Accepted defect
- Duplicate
- Deferred by stakeholder
- Fixed
- Retest passed
- Retest failed
- Closed

## Release-Blocking Rule

Do not mark Phase 1 accepted with unresolved Critical issues or unresolved P0 issues. High/P1 issues require an explicit stakeholder decision before acceptance.
