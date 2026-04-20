# AGENTS.md

This is the canonical entry point for the repository. Start here, then follow the linked docs only when you need more detail.

## Project Snapshot

- Product: insurance/financial services management accounting and project valuation platform
- Core flow: ABC-based cost allocation across 5 operating headquarters and around 20 projects, plus DCF investment evaluation for new business decisions
- Primary users: planner, finance reviewer, executive
- Frontend: React 18, TypeScript, Vite, Tailwind CSS
- Backend: Java 21, Spring Boot 3.x
- Database and auth: Supabase PostgreSQL and Supabase Auth
- Deployment: Cloudflare Pages for frontend and a separate Spring runtime for backend

## Read Next

- `docs/index.md` for the doc map
- `docs/project/current-state.md` for the current working picture
- `docs/ai-collaboration.md` for subagent and reviewer rules
- `docs/worktree-strategy.md` for branch and worktree policy
- `docs/ops/README.md` for operational workflow docs
- `docs/git/branch-naming.md` for naming rules
- `.gitmessage` for commit message format
- `docs/git/issue-labels.md` for triage labels
- `docs/dev-logs/README.md` for comparison notes and PR prerequisites
- `docs/superpowers/specs/2026-04-19-financial-decision-support-platform-design.md` for product scope
- `docs/superpowers/plans/2026-04-19-financial-decision-support-platform-development.md` for implementation details
- `docs/superpowers/plans/2026-04-19-financial-decision-support-platform-implementation.md` for task order

## Working Rules

- Keep changes small and task-focused.
- Prefer `apply_patch` for edits.
- Do not broaden scope unless the task demands it.
- Keep `main` release-only, `dev` integration-only, and `feat/*` for focused work.
- Use one worktree per non-trivial `feat/*` branch.
- Before opening a PR for any non-trivial change, write a dev log entry that explains the worktree comparison and why the chosen option won.

## Common Commands

- Frontend build and lint:
  - `cd frontend`
  - `npm run build`
  - `npm run lint`
- Frontend format check:
  - `cd frontend`
  - `npm run format:check`
- Backend build checks:
  - `cd backend`
  - `./gradlew check`
- Backend compile check:
  - `cd backend`
  - `./gradlew classes`

## Do Not

- Do not edit `harness_tmp/`.
- Do not change unrelated files.
- Do not commit unverified changes.
- Do not expose secrets or service keys to the browser.
- Do not open a PR without the required dev log for a non-trivial change.

## AI Collaboration

- Use one focused subagent per independent slice.
- Use a spec reviewer after implementation to check scope and consistency.
- Use a quality reviewer after implementation to check buildability and risk.
- Keep subagent prompts narrow: one repo slice, one output, one acceptance bar.
