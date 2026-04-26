# 2026-04-24 - Issue #46 Users Tailwind Slice

## Context

- Branch: `feat/46-tailwind-next-slice`
- Scope: `frontend/src/views/users/*` only
- Goal: follow file/folder split principle while migrating Users screen styling to Tailwind utilities.

## A/B Comparison

### Option A

- Keep all style strings and UI composition inside `UsersView.tsx`.
- Pros: fastest one-file change.
- Cons: violates split principle and keeps view overly dense.

### Option B (selected)

- Split reusable style utilities into `usersView.styles.ts`.
- Keep behavior/data flow in `UsersView.tsx` and move visual tokens/class bundles to a dedicated module.
- Pros: clearer ownership and easier next-step decomposition (sections/components).

## Decision

- Selected Option B to align with established frontend file/folder split conventions.

## Validation

- `frontend: npm run lint` passed
- `frontend: npm run build` passed

## Notes

- No backend/API contract changes.
- UI behavior and CRUD flow preserved; this slice is styling-structure focused.
