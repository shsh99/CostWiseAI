# Orchestrator Manager Automation

`scripts/orchestrator-manager.ts` is a lightweight manager that automates:

- issue triage (priority/domain)
- subagent assignment
- parallel/sequential batch planning
- optional worktree+branch creation
- optional issue assignment comments
- run-state persistence and retry control
- optional enforcement gate (scope + mandatory verification)

## What It Does

1. Reads open issues with `gh issue list`.
2. Classifies each issue:
- priority (`P0` to `P3`)
- domain (`frontend`, `backend`, `database`, `security`, `devx`, `docs`, `unknown`)
3. Maps each issue to an agent and target branch/worktree.
4. Builds conflict-aware batches:
- same-domain work is split sequentially
- shared-file risk forces sequential execution
5. Optionally executes dispatch actions.

## Commands

```bash
# plan only (dry-run)
npx tsx scripts/orchestrator-manager.ts plan

# plan + write markdown file
npx tsx scripts/orchestrator-manager.ts plan --output docs/ops/dispatch-plan.md

# execute dispatch (create worktrees + issue comments + strict gate)
npx tsx scripts/orchestrator-manager.ts run --execute --create-worktrees --comment --strict-gate
```

## Options

- `--state <open|closed|all>`: issue state (default: `open`)
- `--limit <n>`: max issues (default: `30`)
- `--base <branch>`: base branch for worktrees (default: `dev`)
- `--worktree-root <path>`: worktree root (default: `.worktrees`)
- `--output <path>`: write markdown plan
- `--execute`: apply actions (without this, dry-run only)
- `--create-worktrees`: create worktree+branch per issue
- `--comment`: post issue comment with assignment metadata
- `--strict-gate`: enforce out-of-scope rejection + mandatory verification matrix
- `--state-file <path>`: state file path (default: `.codex/orchestrator/state.json`)
- `--max-retries <n>`: retry cap before skip
- `--worker-command <template>`: worker execution command template

## Run State / Recovery

- State is persisted in JSON for each issue:
  - `planned`, `running`, `dispatched`, `failed`, `done`
  - retry count
  - last error / gate failures
- On rerun, done items are skipped.
- Failed items retry until `--max-retries` threshold.
- Run summary markdown is written to `docs/ops/orchestrator-run-state.md` (or `--output` path).

## Enforcement Gate

When `--strict-gate` is enabled:

1. Scope check
- Reject if out-of-scope files are changed in issue worktree.

2. Mandatory verification
- Frontend: `npm run lint`, `npm run build`
- Backend/Security/Database: `./gradlew.bat check`

If either fails, issue status becomes `failed` and retry count increases.

## Enforcement Expectations

This script dispatches work, but operational enforcement still relies on:

- `docs/ops/orchestrator-agent-playbook.md`
- `docs/ai-collaboration.md`

Specifically:
- out-of-scope edits must be rejected
- mandatory verification matrix must be satisfied
- blocking review findings must stop merge

## Notes

- Requires `gh` CLI authentication.
- Requires `npx` to run `tsx` (the `.mjs` wrapper forwards to the TypeScript entrypoint).
- Branch naming uses `feat/<issue>-<slug>`.
- For non-trivial PRs, keep dev-log rules unchanged.
