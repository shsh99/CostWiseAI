# Issue Labels

Use a small label set with clear meaning. The goal is to keep triage fast and avoid overlapping labels that nobody uses consistently.

## Label Groups

### Type

- `bug` - Something is broken or produces the wrong result.
- `enhancement` - New capability or improvement.
- `docs` - Documentation-only work.
- `chore` - Maintenance, cleanup, or tooling.
- `refactor` - Structural change without user-facing behavior change.

### Area

- `frontend` - UI, UX, or client-side code.
- `backend` - API, business logic, or server-side code.
- `database` - Schema, migration, query, or data model.
- `deployment` - Build, release, CI, or infrastructure.
- `qa` - Test coverage, verification, or review work.

### Priority

- `high-priority`
- `medium-priority`
- `low-priority`

### State

- `blocked`
- `needs-review`
- `needs-info`

### Cross-cutting

- `performance`
- `security`
- `good-first-issue`

## Usage Rules

1. Apply one type label at most.
2. Apply one or more area labels when the work clearly belongs to a subsystem.
3. Apply exactly one priority label when the issue is actionable.
4. Use `blocked` only when the issue cannot move forward.
5. Use `needs-info` instead of leaving an issue ambiguous.
6. Use `needs-review` when implementation is done and human review is required.

## Recommended Defaults

| Issue kind | Suggested labels |
|------------|-------------------|
| User-reported defect | `bug`, area label, `medium-priority` |
| New feature | `enhancement`, area label, `high-priority` or `medium-priority` |
| Documentation update | `docs`, area label if relevant, `low-priority` |
| Maintenance | `chore`, area label if relevant, `low-priority` |
| Security issue | `security`, `high-priority`, area label |

## Source of Truth

The canonical label list lives in `.github/labels.yml`. Update both this document and the YAML file when the set changes.
