# Phase 1 UAT, Demo, And Sign-Off Package

This package helps Real Capita stakeholders, supervisors, testers, and operators validate the Phase 1 release candidate before handoff.

Checkpoint reference: `3bf83f5e`

## Required Environment

- Use the Docker Compose release-candidate stack unless a test lead explicitly chooses another environment.
- Recommended browser URL: `http://localhost:3000`.
- The root `.env` must target the intended test environment.
- Run migrations with `corepack pnpm docker:migrate`.
- Bootstrap a company admin with `corepack pnpm docker:bootstrap -- --company-name ...` when needed.
- Testers should understand that empty lists and empty reports are valid when no real records exist.

## Documents

| Document | Who Should Use It | Purpose |
| --- | --- | --- |
| [Phase 1 feature matrix](phase-1-feature-matrix.md) | Stakeholders, test lead, supervisors | Understand included modules, deferred scope, roles, and verification status. |
| [Role-wise UAT guide](role-wise-uat-guide.md) | Testers, test lead | Validate each company role's allowed and denied access. |
| [Module-wise UAT scenarios](module-wise-uat-scenarios.md) | Testers | Execute structured UAT scenarios module by module. |
| [Demo walkthrough](phase-1-demo-walkthrough.md) | Presenter, supervisor, client stakeholder | Run a practical 20 to 40 minute stakeholder demo. |
| [UAT issue log template](uat-issue-log-template.md) | Testers, triage owner | Record defects, severity, priority, status, and retest results. |
| [Sign-off checklist](phase-1-signoff-checklist.md) | Stakeholders, test lead, technical owner | Record final acceptance, limitation acknowledgement, and handoff decision. |
| [Known limitations and deferred scope](phase-1-known-limitations.md) | Everyone involved in sign-off | Keep Phase 1 claims honest and explicit. |

## Recommended UAT Order

1. Review the [route and module inventory](../operations/phase-1-route-inventory.md).
2. Review the [feature matrix](phase-1-feature-matrix.md) and [known limitations](phase-1-known-limitations.md).
3. Prepare the environment using the [release checklist](../operations/phase-1-release-checklist.md).
4. Run the broad [operations UAT checklist](../operations/phase-1-uat-checklist.md).
5. Execute [role-wise UAT](role-wise-uat-guide.md).
6. Execute [module-wise UAT scenarios](module-wise-uat-scenarios.md).
7. Record defects in the [issue log template](uat-issue-log-template.md).
8. Run the [demo walkthrough](phase-1-demo-walkthrough.md) with stakeholders.
9. Complete the [sign-off checklist](phase-1-signoff-checklist.md).

## Supporting Operations Links

- Route inventory: [docs/operations/phase-1-route-inventory.md](../operations/phase-1-route-inventory.md)
- Release checklist: [docs/operations/phase-1-release-checklist.md](../operations/phase-1-release-checklist.md)
- UAT checklist: [docs/operations/phase-1-uat-checklist.md](../operations/phase-1-uat-checklist.md)
- Backup/restore guide: [docs/operations/backup-restore.md](../operations/backup-restore.md)

## Acceptance Guidance

Do not mark the Phase 1 release candidate accepted while unresolved release-blocking issues remain in authentication, company selection, role access, voucher posting, financial statement correctness, backup verification, restore dry-run, attachment upload/download, or data integrity.
