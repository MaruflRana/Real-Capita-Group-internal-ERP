# Prompt 51 Scope

## Objective

Rebuild the ERP demo/seed dataset from scratch as a realistic, large-volume, Bangladesh-facing, BDT-based, multi-year synthetic operating dataset that makes the ERP look like it has been actively used for years.

The current low-quality visible demo dataset is considered unsatisfactory and will be replaced entirely.

## Supervisor Requirements (Locked)

### A1. No visible "demo vibe"
Future seeded business-facing records must not contain "Demo", "Test", "Sample", "Mock", "Seed", "UAT", or similar placeholder wording. Records must look like actual operational data.

### A2. Bangladesh-facing data
- Bangladesh names (Muslim, Hindu, and mixed naming conventions)
- Bangladesh-style business entities
- Bangladesh addresses at city/area level (Dhaka, Keraniganj, Rupganj, Narayanganj, Savar, Khulna, Kuakata, Azimpur, Munshiganj, Gulshan, Badda, Dhanmondi, Uttara, Bashundhara, Purbachal)
- Bangladesh phone conventions (e.g., +880 17XX-XXXXXX patterns)
- Bangladesh real-estate terminology (katha, bigha, share ownership, allotment, handover)
- BDT / ৳ currency throughout

### A3. BDT-only currency assumption
All financial values must be interpreted/presented as BDT. The UI and reporting layers must consistently use ৳ or BDT formatting.

### A4. Multi-year lived-in operational history
The dataset must span at least 3-4 years of operational history (e.g., FY2022-FY2026). It must include old and recent customers, booking/collection timelines across years, installment schedules, payroll history, leaves, employee lifecycle, voucher activity across periods, and reports with meaningful trends.

### A5. Large quantity, but meaningful
Large volume with coherent entity relationships, rich history, realistic statuses, report usefulness, dashboard usefulness, Customer 360 usefulness, and data patterns that support testing and demonstrations.

## Sub-prompts

- **51A**: Audit current seed architecture and demo contamination; produce replacement blueprint (this is planning/audit only, no implementation)
- **51B**: Realistic Multi-Year Synthetic Dataset Specification — exact target volumes, years, entity counts, naming standards, relationship scenarios, accounting realism plan, BDT/BD geography rules, acceptance matrix **(COMPLETE — see docs/handoffs/prompt-51b-status.md)**
- **51C**: Implement Seed Framework Replacement — remove old low-quality visible seed logic, implement realistic UAT profile, preserve technical reset/bootstrap mechanics
- **51D**: Quality Verification on Freshly Seeded Runtime — reset/reseed, inspect UI, verify no demo vibe, verify reports/dashboard/customer flows
- **51E**: Stress-Volume Profile and Performance-Oriented Seed Expansion — if approved after UAT-realistic profile

## Scope boundaries
- Prompt 51A is audit/planning only: no code edits, no seed changes, no data deletion, no staging/commit/push
- No Prisma schema changes
- No new backend endpoints
- No Next.js server actions
- No UI redesign beyond potential BDT symbol integration
- No commit, push, or staging in 51A
- Preserve existing `seed:demo`, `seed:demo:reset`, `seed:demo:verify` command scaffolding and reset/bootstrap mechanics in later prompts
- Preserve the existing Docker/runtime, auth, and reporting infrastructure

## Web-grounding requirement
Browse Real Capita Group's public official sources (rcgcbd.com) to understand project/business vocabulary, company-facing realism, Bangladesh operating context, plausible real-estate terminology, and project/location patterns. Final dataset must remain synthetic and must not depend solely on web copying.
