# Worktree Strategy

This repository uses branch-isolated worktrees to keep AI-driven changes manageable.

## Branch Model

- `main`: release-only branch.
- `dev`: integration branch for reviewed work.
- `feat/*`: one focused branch per feature or change set.
- `fix/*`: one focused branch per bug fix.
- `docs/*`: documentation-only changes.

## Recommended Branch Format

```text
<type>/<short-slug>
```

Examples:

- `feat/platform-scaffold`
- `feat/backend-api`
- `feat/frontend-dashboard`
- `fix/cors-auth-flow`
- `docs/ai-collaboration`

## Worktree Rules

- Create a separate worktree for every active `feat/*` branch.
- Keep one concern per worktree.
- Do not mix frontend, backend, database, and docs work in the same active worktree unless the change is intentionally cross-cutting and small.
- Remove a worktree after the branch is merged or abandoned.

## A/B Operating Modes

### A. Feature Worktree Per Branch

Use one worktree per `feat/*` branch.

Pros:

- Minimal file collision risk
- Clean agent ownership
- Easy parallelization

Cons:

- More directories to manage
- Slightly more setup work

### B. Phase Worktree Per Milestone

Use one worktree per phase, such as `phase-1-core`, `phase-2-ui`, `phase-3-security`.

Pros:

- Fewer directories
- Simpler for very small teams

Cons:

- More scope mixing
- Harder to run AI workers in parallel
- More likely to accumulate unrelated edits

## Recommendation

Use **A. Feature Worktree Per Branch** for this project.

Reason:

- The project is small enough that clean isolation matters more than reducing folder count.
- The work naturally splits into independent slices: database, backend, frontend, security, and deployment.
- AI workers are easier to coordinate when each branch has one responsibility.

## Required Comparison Log

Before opening a PR for any non-trivial change, write a dev log entry that includes:

- the A/B worktree options considered
- the file scope of each option
- the validation results for each option
- the reason the selected option was chosen

Use `docs/dev-logs/` for that record so the decision survives outside chat history.

## Practical Flow

1. Start from `dev`.
2. Create `feat/<short-slug>`.
3. Create a dedicated worktree for that branch.
4. Implement one slice.
5. Validate.
6. Open a PR into `dev`.
7. Delete the worktree after merge.
