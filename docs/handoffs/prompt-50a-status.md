# Prompt 50A Status

## Prompt 50A: Customer Phone Input Restriction Fix

**Status**: COMPLETE
**Date**: 2026-05-20
**Branch**: main
**Commit**: NOT committed (per instruction)

---

## 1. Root cause

The customer phone field in the CRM/property desk used a plain `type="text"` Input with no sanitization or regex validation, allowing any arbitrary string including alphabetic characters. The backend DTO also had no phone format constraint beyond `@IsString()` and `@MaxLength(32)`.

The phone validation changes were already present in the working tree as uncommitted modifications from prior prompt work (likely Prompt 49C), but were never committed. The running Docker containers were built from the old committed code that lacked these fixes.

---

## 2. Input-level fix applied

- Customer phone input: changed from bare `<Input id="customer-phone" {...form.register('phone')}>` to `<Input id="customer-phone" type="tel" inputMode="tel" {...form.register('phone', { onChange: sanitizePhoneValue })}>`
- Lead phone input: same treatment applied
- `sanitizePhoneValue` function strips all non-digit characters and preserves a leading `+` if present
- `type="tel"` triggers mobile phone keypad
- `inputMode="tel"` activates mobile numeric dialer layout

---

## 3. Validation-level fix applied

### Frontend (Zod)
- Added `phoneRegex = /^\+?\d*$/u` and `phoneRegexMessage = 'Phone must contain only digits and an optional leading +.'`
- Customer form schema phone field: added `.regex(phoneRegex, phoneRegexMessage)` after `.max(32)`
- Lead form schema phone field: same `.regex(phoneRegex, phoneRegexMessage)` addition
- Phone remains optional (`optional().or(z.literal(''))`)

### Backend (class-validator)
- `CreateCustomerDto.phone`: added `@Matches(/^\+?\d*$/, { message: 'Phone must contain only digits and an optional leading +.' })`
- `UpdateCustomerDto.phone`: same `@Matches` decorator
- `CreateLeadDto.phone`: same `@Matches` decorator
- `UpdateLeadDto.phone`: same `@Matches` decorator
- Imported `Matches` from `class-validator` in both DTO files
- Existing `normalizePhone` utility in `property-desk.utils.ts` already strips non-digits and preserves `+`

---

## 4. Create/edit/backend coverage

- **Create**: Customer phone input uses `type="tel"`, `inputMode="tel", sanitizePhoneValue onChange` — COVERED
- **Edit**: Same `CustomerFormPanel` component is reused for create and edit — COVERED (inherent parity)
- **Lead create/edit**: `LeadFormPanel` phone input uses same sanitization pattern — COVERED
- **Backend create**: `CreateCustomerDto` and `CreateLeadDto` have `@Matches` — COVERED
- **Backend update**: `UpdateCustomerDto` and `UpdateLeadDto` have `@Matches` — COVERED

---

## 5. Exact files changed

| File | Change |
|------|-------|
| `apps/web/src/features/crm-property-desk/forms.tsx` | Added `phoneRegex`, `phoneRegexMessage`, `sanitizePhoneValue`; added `.regex()` to Zod customer and lead phone schemas; changed customer and lead phone `<Input>` from bare `register` to `type="tel" inputMode="tel"` with `onChange` sanitization |
| `apps/api/src/app/crm-property-desk/dto/customers.dto.ts` | Added `Matches` import; added `@Matches(/^\+?\d*$/)` on phone field in `CreateCustomerDto` and `UpdateCustomerDto` |
| `apps/api/src/app/crm-property-desk/dto/leads.dto.ts` | Added `Matches` import; added `@Matches(/^\+?\d*$/)` on phone field in `CreateLeadDto` and `UpdateLeadDto` |

---

## 6. Functional QA cases tested

| Case | Input | Expected | Actual | Result |
|------|-------|----------|--------|--------|
| 1 | Type `xvxxvcx` in create phone field | Letters do not remain / empty string | Empty string | PASS |
| 2 | Type `abc01712345678xyz` via keyboard | Sanitized to `01712345678` | `01712345678` | PASS |
| 3 | Type `01712345678` in create phone field | Accepted as-is | `01712345678` | PASS |
| 4 | Type `+8801712345678` in create phone field | Accepted with `+` prefix | `+8801712345678` | PASS |
| 5 | Type `abcxyz` in edit phone field | Stripped to empty | Empty string | PASS |
| 6 | Customer created successfully with valid phone | Record created | Customer appeared in list | PASS |
| 7 | Edit form has same `type="tel"` and `inputMode="tel"` | Verified via JS eval | Both attributes present | PASS |

Testing was performed at `http://localhost:3000/crm-property-desk/customers` with the demo.sales user after Docker rebuild.

---

## 7. Validation results

| Check | Result |
|-------|--------|
| `corepack pnpm lint` | PASS (0 errors, pre-existing warnings only) |
| `corepack pnpm typecheck` | PASS |
| `corepack pnpm build` | PASS |
| `git diff --check` | PASS (only LF/CRLF warnings, no whitespace errors) |
| API unit tests (customer service) | PASS (5/5 tests) |
| API unit tests (all backend) | PASS (39/39 tests) |
| E2e tests | 22 failures, all pre-existing UI text assertion mismatches unrelated to phone validation |

---

## 8. Remaining caveats

1. The 22 e2e test failures are pre-existing (dashboard analytics label mismatches) and are completely unrelated to the phone field changes. They should be addressed in a separate prompt.
2. The phone field allows `+` alone as a valid input per the regex `/^\+?\d*$/` since `\d*` matches zero digits. The backend `normalizePhone` utility handles this correctly by converting a bare `+` to `null`. This is acceptable UX since the user can only reach `+` alone by intentionally typing just the prefix with no digits.
3. The changes are uncommitted in the working tree per the "do NOT commit, push, or stage" instruction. The supervisor should commit these changes when ready.
4. The test customer "Test QA Customer Phone" with phone "01712345678" was created during QA testing. It can be removed with `corepack pnpm seed:demo:reset` or manually.

---

## Verdict

CUSTOMER PHONE INPUT FIXED
