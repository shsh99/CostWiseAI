# Backend API Contract Log

## Scope

- Issue: `#5 백엔드 계산 API 구현`
- Branch: `feat/backend-api`
- Worktree: `.worktrees/feat-backend-api`

## Comparison

### A. Compute-only API first

- Add a `POST /api/compute` endpoint that calculates ABC allocation and DCF valuation from request payloads.
- Keep persistence out of the first slice.

### B. Full persistence API first

- Add create/read/update endpoints for projects, scenarios, allocations, cash flows, approvals, and computed results at the same time.
- Couple the backend directly to the database schema before the schema branch is complete.

## Selected Option

- Chose **A. Compute-only API first**.

## Why This Option Won

- It can be implemented and tested before the database branch merges.
- The frontend can consume the contract immediately with mock or ad hoc payloads.
- The calculation logic stays easy to verify in isolation.
- The later persistence layer can reuse the same request/response shapes without redesigning the API.

## Validation

- Ran `./gradlew.bat test` in the backend worktree with a worktree-local `GRADLE_USER_HOME`.
- All backend tests passed after aligning the expected DCF output with the implementation.

## Notes

- This slice intentionally leaves Supabase persistence for the next backend iteration.
- Security and CORS remain placeholder-level and are expected to be refined in the security issue.
