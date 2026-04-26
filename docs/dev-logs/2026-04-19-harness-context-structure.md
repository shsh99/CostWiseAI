# Harness Context Structure Update

## What Changed

- Added `docs/README.md` as the primary documentation entry point.
- Added `docs/project/current-state.md` to hold the current operating picture.
- Added `docs/ai-collaboration.md` for subagent and reviewer roles.
- Added `docs/worktree-strategy.md` with A/B worktree guidance and a recommended default.
- Added `docs/ops/README.md`, `docs/architecture/README.md`, and `docs/conventions/README.md` to group related docs.

## Why

- The repository needed a single, predictable read order for AI-assisted work.
- Branch and worktree decisions needed to be explicit instead of inferred from chat.
- The context docs were becoming fragmented, so short hub documents reduce search overhead.

## Selection Rationale

- Chose `main / dev / feat/*` as the branch model because it separates release, integration, and focused work cleanly.
- Chose worktree option A, one worktree per `feat/*` branch, because it reduces file collision risk and fits subagent work best.
- Kept the MR template as a mirror of the PR template to avoid two independent review formats drifting apart.

## Verification

- Checked that the new docs point to the existing spec and plan files.
- Checked that the branch/worktree guidance matches the current repository workflow.

