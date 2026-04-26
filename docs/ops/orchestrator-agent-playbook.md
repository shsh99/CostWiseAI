# Orchestrator Agent Playbook

This playbook defines how to run a decision-authority orchestrator that manages worker subagents.

## Purpose

- Keep one decision owner for scope, sequencing, and merge order.
- Keep workers narrow and deterministic.
- Prevent mixed-mode work (implementation + review + debugging in one slice).

## Role Model

- Orchestrator:
  - sets priority and slice boundaries
  - decides parallel vs sequential execution
  - validates evidence before merge decisions
- Worker:
  - implements one slice only
  - reports only in fixed handoff format
- Reviewer:
  - returns blocking findings or explicit no-findings

## Dispatch Rules

1. One slice per session.
2. Do not mix implementation, review, and debugging in one instruction.
3. If file overlap is possible, run sequentially.
4. For frontend slices, require `frontend-design` before coding.
5. For backend/calculation slices, fix verification commands before coding.

## Priority Matrix (P0-P3)

- P0: security issue, auth bypass, production outage, data corruption risk
- P1: core user flow broken, blocking bug in release path
- P2: non-blocking feature improvement, UX/perf improvement
- P3: refactor, docs-only, non-urgent tooling cleanup

Tie-breakers:
- same priority면 user-facing impact가 큰 이슈 우선
- same impact면 충돌 위험 낮은 slice 우선
- same risk면 구현/검증 시간이 짧은 slice 우선

## Mandatory Verification Matrix

Each slice contract must include the matching minimum checks.

- Frontend slice:
  - `npm run lint`
  - `npm run build`
  - affected route/component render check
- Backend slice:
  - changed-scope unit/integration tests
  - `./gradlew.bat check`
  - affected API response contract check
- Database slice:
  - migration apply check (dry-run or target DB apply log)
  - rollback feasibility note
  - backward compatibility check for existing queries

Required contract wording:

```text
Verification:
- build must pass
- no lint errors
- touched route must render
- API response contract unchanged
```

## Shared File Policy

The following files/areas require explicit orchestrator approval before edit:

- `package.json` / lockfiles
- shared config (`vite.config.*`, `application.yml`, global build configs)
- auth/security middleware and security config
- global/shared types and API contract DTOs
- environment sample/config files

If a worker touches shared files without approval, treat as scope violation.

## Overlap Risk Criteria

Treat as overlap risk and force sequential execution if any is true:

- same file
- same route/controller/component
- same shared config/type/auth boundary
- same migration or schema object
- same deployment/runtime config

If none match, parallel execution is allowed.

## Violation Handling (Enforcement)

If a worker output violates contract:

1. Reject output immediately.
2. Do not cherry-pick partial changes.
3. Re-open same worker with prior context and explicit violation note.
4. Require full re-verification evidence.

Scope violation examples:

- out-of-scope files changed
- missing mandatory verification
- mixed mode output (implementation + unrelated refactor)

## Orchestrator Prompt Template

```text
You are the main orchestrator for this repository.
You have decision authority for scope, sequence, and merge order.

Execution contract for this slice:
- issue: <id>
- scope: <one slice>
- do not touch: <paths>
- verification: <commands>
- handoff format:
  - 변경 파일 목록
  - 검증 결과
  - 남은 리스크

Rules:
- one slice only
- no scope expansion
- no mixed mode (implementation/review/debug together)
- if conflict risk exists, switch to sequential execution

After worker completion:
- reject handoff if verification evidence is missing
- reject handoff if out-of-scope files are changed
- route fixes back to the same worker until pass
- only then decide PR readiness and merge order
```

## Reviewer Conflict Resolution

If reviewer decisions conflict:

- blocking security/quality finding wins over spec-pass
- merge is blocked until orchestrator resolves conflict
- resolution must be recorded in PR comment or dev log

## Failure Recovery

- If verification fails after integration, revert only current slice.
- Never rollback unrelated merged slices.
- Reopen the same worker with previous context and failing evidence.
- Re-run mandatory verification matrix before re-merge.

## Definition of Done (DoD)

A slice is done only if all conditions are true:

- acceptance contract satisfied
- mandatory verification passed
- blocking review findings resolved
- required dev log updated
- PR body contains issue linkage and verification evidence

## Merge Decision Checklist

- Verification commands passed in current branch/worktree.
- No blocked review findings.
- Scope stayed inside issue contract.
- Dev log entry exists when required.
- PR body includes issue linkage and validation evidence.
