# Analysis Persistence

## Branch

- Worktree: `.worktrees/feat-50-analysis-persistence`
- Branch: `feat/50-analysis-persistence`
- Base: `dev`
- Related issue: `#50`

## Comparison

- Option A: keep analysis payloads in `PersistenceService` maps after project/scenario persistence.
- Option B: persist allocation rules, cash flows, valuation results, and approval logs through the JDBC repository and reconstruct project detail from database reads.

Option B was selected because issue `#50` requires analysis results to survive service recreation and requires minimizing the in-memory persistence dependency.

## Changes

- Extended `ProjectPersistenceRepository` with analysis write/read contracts.
- Persisted allocation rules through `departments`, `cost_pools`, and `allocation_rules`.
- Persisted cash flows, valuation results, and approval logs into their existing migration tables.
- Rebuilt `ProjectDetailResponse` analysis sections and approval summary from database reads.
- Removed in-memory analysis, approval summary, and approval log maps from `PersistenceService`.
- Added restart-style tests proving analysis and approval history remain after service recreation.

## Validation

- `.\gradlew.bat test --tests com.costwise.persistence.JdbcProjectPersistenceRepositoryTest`
- `.\gradlew.bat test --tests com.costwise.api.persistence.PersistenceControllerTest --tests com.costwise.persistence.JdbcProjectPersistenceRepositoryTest`
- `.\gradlew.bat check`
