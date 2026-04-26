# Project And Scenario Persistence

## Branch

- Worktree: `.worktrees/feat-50-project-scenario-persistence`
- Branch: `feat/50-project-scenario-persistence`
- Base: `dev`
- Related issue: `#50`

## Comparison

- Option A: convert projects, scenarios, analysis rows, valuation results, and approval history in one large PR.
- Option B: create a DB-backed repository boundary and move project/scenario CRUD first, leaving analysis persistence for a follow-up slice.

Option B was selected because it creates a durable foundation while keeping the first PR reviewable. Analysis persistence needs additional read-model reconstruction across `allocation_rules`, `cash_flows`, `valuation_results`, and `approval_logs`, so it should be handled as the next focused slice.

## Changes

- Added `ProjectPersistenceRepository` as the service-facing persistence boundary.
- Added `JdbcProjectPersistenceRepository` using the existing `app.persistence` JDBC/Supabase connection settings.
- Moved project and scenario create/update/delete/detail reads from `ConcurrentHashMap` state into database-backed storage.
- Kept in-process analysis payload state as a temporary compatibility bridge for this slice.
- Added restart-style repository tests proving project/scenario data survives service recreation.
- Updated persistence controller tests to run against an H2 schema.

## Validation

- `.\gradlew.bat test --tests com.costwise.persistence.JdbcProjectPersistenceRepositoryTest`
- `.\gradlew.bat test --tests com.costwise.api.persistence.PersistenceControllerTest --tests com.costwise.persistence.JdbcProjectPersistenceRepositoryTest`
- `.\gradlew.bat check`

## Follow-Up

- Persist allocation rules, cash flows, valuation results, and approval logs into the existing Supabase tables.
- Rebuild project detail responses from those persisted analysis tables after restart.
