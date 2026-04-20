# Demo Seed Data Log

## Scope

- Issue: `#17 5개 본부·20개 프로젝트 시드 데이터`
- Branch owner: `feat/demo-seed-data`
- Workspace: `.worktrees/feat-project-detail-api`

## Comparison

### A. Explicit row-by-row inserts

- Easy to read per record.
- Hard to keep 20 projects, 3 scenarios, and all dependent rows consistent.
- More likely to drift from the portfolio-first contract.

### B. Deterministic seed pipeline from a single project master table

- Keep one authoritative project list for 5 headquarters and 20 projects.
- Derive scenarios, cost pools, allocation rules, valuation results, and audit logs from that list.
- Easier to rerun and extend without breaking the demo contract.

## Selected Option

- Chose **B. Deterministic seed pipeline from a single project master table**.

## Why This Option Won

- The dashboard, cost accounting, and valuation surfaces all depend on the same project portfolio.
- It keeps the dataset shallow but complete across 5 headquarters and 20 projects.
- It stays deterministic with fixed UUIDs and repeatable truncation.
- It reduces hidden mismatches between project, scenario, valuation, and audit data.

## Notes

- Added `supabase/reset_seed.sql` for a minimal reset helper.
- Added `backend/src/main/resources/demo-seed/portfolio-seed-manifest.json` as a lightweight seed manifest for downstream branches.
