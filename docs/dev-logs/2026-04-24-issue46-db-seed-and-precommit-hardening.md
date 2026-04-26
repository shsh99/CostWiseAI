# 2026-04-24 issue46 db seed and pre-commit hardening

## Context
- Issue: #46 follow-up
- Goal:
  - Apply reference dummy dataset to Supabase and make it queryable from app APIs.
  - Remove tech debt around repository-wide prettier failures in pre-commit.
  - Document rule to avoid `--no-verify` bypass.

## A/B comparison
- A) Keep pre-commit `npm run format:check` on whole frontend tree
  - Pros: simple
  - Cons: fails on unrelated legacy files and blocks scoped commits
- B) Run prettier check only on staged frontend files
  - Pros: checks remain strict for changed files, no unrelated global failure
  - Cons: requires small hook logic
- Selected: B

## Changes
- `supabase/seed.sql`
  - Fixed ambiguous column reference in `cost_pools` insert (`p.description`) so seed runs on real DB.
- `.githooks/pre-commit`
  - Prettier check changed from repository-wide to staged frontend targets only.
  - `npm run lint` remains enforced for frontend changes.
- `AGENTS.md`
  - Added explicit rule: do not bypass checks with `--no-verify`; fix root causes.

## Verification
- Supabase DB apply and query checks:
  - migrations `002/003/004` applied
  - `seed.sql` applied
  - row counts verified:
    - `projects=20`
    - `departments=5`
    - `users=5`
    - `workflow_states=20`
    - `audit_logs=20`
- Frontend:
  - `npm run lint` pass
  - `npm run build` pass
- Backend:
  - `./gradlew.bat test` pass

## Risks
- Existing untracked workspace artifacts remain and are intentionally excluded from this slice.
- If DB schema was partially migrated in another environment, `001_init.sql` may not be idempotent and should be handled by migration history tooling.
