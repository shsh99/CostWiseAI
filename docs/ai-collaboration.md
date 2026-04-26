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

## Orchestrator Decision Authority

- The main orchestrator is the only role that can declare:
  - issue priority
  - parallel vs sequential execution
  - merge order
  - done/not-done status
- Workers and reviewers must not self-promote scope, merge order, or completion status.
- The orchestrator must freeze one acceptance contract per slice before dispatch:
  - scope boundaries
  - verification commands
  - non-touch files
  - handoff format

## Subagent Control Loop

Use this loop for each slice:

1. Contract freeze
- Define one slice goal, file scope, constraints, and pass/fail checks.

2. Dispatch
- Assign exactly one worker per independent slice.
- If overlap risk exists, run sequentially.

3. Collect
- Require worker output in fixed format:
  - changed files
  - verification results
  - residual risks

4. Gate
- Run spec + quality review.
- If blocking findings exist, route back to the same worker.

5. Integrate
- Confirm verification evidence.
- Update dev log when required.
- Decide next slice or PR.

Enforcement:
- If a worker changes out-of-scope files, reject the output and rerun the slice.
- If mandatory verification evidence is missing, reject the output.
- If review decisions conflict, quality/security blocking findings block merge until resolved.

Reference:
- Detailed protocol: `docs/ops/orchestrator-agent-playbook.md`

## Mandatory Worker Report Format

```text
변경 파일 목록
- ...

검증 결과
- command: result

남은 리스크
- ...
```

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
