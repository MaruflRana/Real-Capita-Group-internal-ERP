# Prompt 50 Scope

## Objective

Fix the Customer Phone field so so no longer accepts arbitrary text/letters and and only allows valid phone-number-style numeric input across all surfaces: frontend input UX, client-side form validation, and backend/API schema validation.

## Problem

The supervisor visually confirmed that the "Create customer" drawer currently allows alphabetic text inside the Phone field, which is incorrect for an ERP dealing with phone numbers.

## Solution Approach

### D1: Input-level UX restriction
- Use `type="tel"` on the phone input for mobile keyboard support
- Use `inputMode="tel"` for mobile numeric keypad activation
- Add `sanitizePhoneValue` onChange handler that strips non-digits and preserves a leading `+`
- Allowed characters: digits `0-9` and optionally one leading `+`

### D2: Form/client validation
- Add Zod `.regex(/^\+?\d*$/)` validation on customer and lead phone schemas
- Error message: "Phone must contain only digits and an optional leading +."
- Phone remains optional (consistent with current field behavior)

### D3: Edit form parity
- The CustomerFormPanel is shared between create and edit flows, so parity is inherent

### D4: Backend/API validation
- Add `@Matches(/^\+?\d*$/)` decorator on CreateCustomerDto, UpdateCustomerDto, CreateLeadDto, and UpdateLeadDto phone fields
- Import `Matches` from `class-validator`
- The existing `normalizePhone` utility already strips non-digits and preserves leading `+`

## Sub-prompts

- **50A**: Full implementation and QA verification of the phone-input restriction fix

## Scope boundaries
- No Prisma schema changes
- No migration
- No new backend endpoints
- No Next.js server actions
- No seed data changes
- No UI redesign beyond the phone input restriction
- No commit, push, or staging

## Affected files
- `apps/web/src/features/crm-property-desk/forms.tsx` — phone input UX and Zod validation
- `apps/api/src/app/crm-property-desk/dto/customers.dto.ts` — backend phone Matches validation
- `apps/api/src/app/crm-property-desk/dto/leads.dto.ts` — backend phone Matches validation (parity)
