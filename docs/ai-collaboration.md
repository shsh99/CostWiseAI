# AI Collaboration Guide

This document defines how Codex and other AI helpers should work in this repository.

## Operating Principles

- Keep each task small enough to finish in one branch.
- Prefer isolated changes over broad refactors.
- Use subagents only when the task can be split into independent slices.
- Never let a subagent widen scope on its own.
- Treat docs, code, and review as separate passes.

## Recommended Agent Roles

- Main orchestrator: chooses scope, sequence, and final merge order.
- Worker agent: edits files within one owned slice.
- Spec reviewer: checks alignment with the design and implementation docs.
- Quality reviewer: checks buildability, maintainability, and missing setup.
- Security reviewer: checks auth, access control, secrets, and audit coverage.

## Subagent Usage Rules

- Use one worker per file slice or subsystem.
- Give each worker a narrow deliverable and a concrete finish line.
- Do not ask a worker to solve multiple unrelated problems.
- After implementation, run a spec review and a quality review before declaring the slice done.
- If a review finds a blocking issue, fix it before starting the next slice.
- For frontend work, load the `frontend-design` skill first so the implementation has a deliberate visual direction, strong hierarchy, and production-grade polish.

## Prompt Template for Workers

Use this structure when dispatching work:

```text
You are not alone in the codebase. Do not revert or overwrite edits made by others.
You own <slice> only.

Goal:
<one sentence>

Files in scope:
- <file or directory>

Constraints:
- <constraints>

Deliverable:
- <what must exist when you finish>
```

## Prompt Template for Reviewers

Use this structure when asking for review:

```text
Review the current workspace changes for <slice>.
Check only the files in scope and report concrete findings.

Focus on:
- spec compliance
- buildability
- missing configuration
- security or audit gaps

Return only actionable findings, sorted by severity.
If there are no findings, say so explicitly.
```

## Handoff Rules

- Workers should report changed files and assumptions.
- Reviewers should report only concrete issues, not general praise.
- The orchestrator should integrate findings, then move to the next slice.
- Keep context small by closing agents after the slice is resolved.
- Before a PR is opened, write a `docs/dev-logs/` entry that records the worktree comparison and the reason the selected option was chosen.
