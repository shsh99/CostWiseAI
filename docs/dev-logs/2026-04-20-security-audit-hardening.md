# 2026-04-20 Security Audit Hardening

## Context

Issue `#3` needs a security/audit slice that does not fight the backend-api worktree.

## Alternatives

### A. Doc-first + tiny hardening change

- Document the intended production posture.
- Keep local/dev on HTTP Basic.
- Apply only minimal API-oriented hardening in `SecurityConfig`.

### B. Code-first partial JWT/audit implementation

- Start JWT validation and audit persistence now.
- This would overlap with the backend API slice and complicate the merge path.

## Decision

Chose **A**.

## Why

- It keeps the worktree isolated from the compute API implementation.
- It gives the team a clear target for later production hardening.
- It avoids expanding the MVP into a full auth migration too early.

## Validation

- Compile validation is currently blocked by the custom Gradle bootstrap path in the sandbox environment.
- The code change itself is intentionally small and limited to security posture.

## Notes

- The production JWT posture remains documented, not implemented, for this slice.
- Audit persistence is still a follow-up task.
