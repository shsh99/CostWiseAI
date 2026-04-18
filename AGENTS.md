# AGENTS.md

## Harness

Use the `harness` skill when you need to design or update agent teams, orchestrators, or project-specific skills in this repository.

## Project-local layout

- Generated agents live under `.codex/agents/`
- Generated skills live under `.codex/skills/`
- Codex packaging metadata lives under `.codex-plugin/`

## Working rules

- Prefer Codex CLI for terminal-driven edits and validation.
- Prefer Codex Desktop for visual review or side-by-side inspection.
- Keep the harness pointers short. Do not duplicate the full skill content here.

## Frontend Work

- Use the `frontend-design` skill when creating or changing frontend pages, components, layouts, or other user-facing UI.
- Do not use `frontend-design` for linting, formatting, hook setup, package wiring, or other tooling-only changes.
- If the work includes accessibility-sensitive UI decisions, pair `frontend-design` with `accessible-ui-guidelines`.

## Backend Work

- Use backend-specific guidance when changing Spring services, APIs, persistence, or other server-side behavior.
- Keep `frontend-design` out of backend-only work.
- Use the harness only for agent, skill, and workflow orchestration.
- The backend uses the checked-in Gradle wrapper, so backend changes should validate with `./backend/gradlew check`.

## Change log

| Date | Change | Reason |
|------|--------|--------|
| 2026-04-19 | Initial harness pointer added | Install project-local Codex harness |
| 2026-04-19 | GitHub workflow templates added | Standardize PR, issue, commit, and branch workflows |
| 2026-04-19 | Issue label set added | Standardize triage, ownership, and priority labels |
| 2026-04-19 | Frontend tooling workflow added | Standardize lint, format, and pre-commit checks for frontend work |
| 2026-04-19 | Backend tooling workflow added | Standardize Java formatting, style checks, and backend pre-commit coverage |
| 2026-04-19 | Gradle wrapper added | Make backend checks reproducible through the checked-in wrapper |
