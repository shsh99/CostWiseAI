# DB Schema Design Log

## Scope

- Issue: `#2 DB 스키마 설계 및 초기 마이그레이션`
- Branch: `feat/db-schema`
- Worktree: `.worktrees/feat-db-schema`

## Comparison

### A. Normalized MVP schema

- Separate tables for projects, departments, scenarios, cost pools, allocation rules, cash flows, valuation results, and approval logs.
- Use foreign keys and simple constraints so the backend can query and validate data predictably.

### B. Flattened JSON-heavy schema

- Store most allocation and valuation details in a smaller number of tables with JSONB blobs.
- Keep fewer relations, but shift structure and validation complexity into application code.

## Selected Option

- Chose **A. Normalized MVP schema**.

## Why This Option Won

- The backend API can consume the data without hidden assumptions.
- The schema stays easy to seed for the MVP case of one project and three departments.
- Foreign keys and check constraints make the financial flow easier to reason about.
- The data model remains flexible enough for later security and audit work without forcing a rewrite.

## Validation

- Reviewed the migration and seed for the MVP tables and relationships.
- Ran `git diff --check` to confirm there are no whitespace or patch-format issues.
- Did not run a live PostgreSQL migration in this environment.

## Notes

- This schema is intentionally narrow: one project, three departments, ABC allocation, DCF valuation, and approval logs.
- The next branch can build the Spring API directly against these tables.
