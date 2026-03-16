# Prompt 3 Scope

## Prompt 3 May Build

- Backend integration foundation work only.
- Shared backend infrastructure needed to support future modules.
- REST-facing backend plumbing that stays generic and non-business-specific.
- Supporting config, validation, persistence wiring, and internal scaffolding required by that integration scope.

## Prompt 3 Must Not Touch

- No accounting, payroll, CRM, property, or other ERP domain modules unless explicitly required by Prompt 3 scope.
- No fake data, demo CRUD samples, or tutorial placeholders.
- No frontend business workflows that break the frontend-only boundary.
- No Next.js backend routes or server-action-based business operations.
- No unrelated infrastructure expansion beyond the locked stack.

## Next Session Checklist

- Read `AGENTS.md` first.
- Confirm `apps/web` remains frontend-only and `apps/api` remains REST-only.
- Preserve Docker Compose as the single-VM baseline.
- Preserve Prisma as the default database access layer.
- Keep MinIO as the S3-compatible storage target.
- Avoid business assumptions and fake ERP artifacts.
- Build only the Prompt 3 backend integration foundation.
