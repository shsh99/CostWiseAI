# 2026-04-23 Issue #46 Users CRUD + Audit E2E

## Context

- Branch: `feat/46-user-crud-audit-link`
- Goal: close remaining #46 gaps for user CRUD + audit linkage on frontend while preserving current architecture.

## A/B Comparison

### Option A: Users flow inside `App.tsx` state tree

- Put users list, modal state, CRUD submit, and USER-MGMT audit fetch into `App.tsx`.
- Pros:
  - Single state owner.
  - Reuses existing top-level reload patterns.
- Cons:
  - Expands already large `App.tsx`.
  - Couples user management concerns to portfolio/workspace lifecycle.

### Option B: Dedicated `UsersView` vertical slice (Selected)

- Keep `App.tsx` as router/composer only.
- Implement users CRUD + USER-MGMT audit fetch inside a dedicated `UsersView`.
- Pros:
  - Smaller blast radius and clearer ownership.
  - Easier to evolve users domain independently.
  - Minimal risk to existing portfolio/workspace behavior.
- Cons:
  - Adds one more view component and API helper surface.

## Decision

- Selected Option B to keep slice boundaries clear and avoid additional growth in `App.tsx`.

## Implemented Scope

- Added `users` navigation/view metadata and role-based menu exposure.
- Added frontend users CRUD UI (list/create/edit/delete) with admin-only mutation control.
- Added USER-MGMT audit list panel wired to audit API.
- Added frontend API helpers for users CRUD and project-id based audit fetch.

## Validation

- Frontend: `npm run lint` pass
- Frontend: `npm run build` pass
- Backend: `.\gradlew.bat test` pass

## Notes

- This slice is focused on #46 user/audit closure only; it does not alter backend authorization matrix beyond existing policy.
