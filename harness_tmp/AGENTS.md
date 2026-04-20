# AGENTS.md

## Harness

Use the `harness` skill when you need to design or update agent teams, orchestrators, or project-specific skills in this repository.

## Code Size and Splitting

When editing Java(Spring) or React code, read and follow [docs/architecture/code-size-and-splitting-guidelines.md](../../docs/architecture/code-size-and-splitting-guidelines.md).
Use it as the default refactoring and file-splitting rule set for new or changed code.

## Project-local layout

- Generated agents live under `.codex/agents/`
- Generated skills live under `.codex/skills/`
- Codex packaging metadata lives under `.codex-plugin/`

## Working rules

- Prefer Codex CLI for terminal-driven edits and validation.
- Prefer Codex Desktop for visual review or side-by-side inspection.
- Keep the harness pointers short. Do not duplicate the full skill content here.

## Change log

| Date | Change | Reason |
|------|--------|--------|
| 2026-04-19 | AGENTS.md promoted to system guide | Make AGENTS.md the primary project entry point for Codex workflows |

