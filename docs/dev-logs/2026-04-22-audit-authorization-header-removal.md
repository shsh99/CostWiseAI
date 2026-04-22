# Audit Authorization Header Removal

## Branch

- Worktree: `.worktrees/feat-52-remove-auth-header`
- Branch: `feat/52-remove-auth-header`
- Base: `dev`
- Related issue: `#52`

## Comparison

- Option A: keep collecting `Authorization` in audit request context and rely on generic masking.
- Option B: stop collecting the header in the controller and remove sensitive request-context keys before persistence.

Option B was selected because the issue requires non-storage, not only redaction. It also protects any future direct `AppendCommand` caller that accidentally passes sensitive request context.

## Changes

- Removed `Authorization` header collection from audit request context assembly.
- Added stricter request-context sanitization that removes sensitive keys before storage.
- Updated controller and repository tests to assert that `authorization` is absent.
- Added a controller-level test that proves the header is not passed to `AuditLogService`.

## Validation

- `.\gradlew.bat test --tests com.costwise.api.audit.AuditLogControllerTest --tests com.costwise.audit.JdbcAuditLogRepositoryTest`
- `.\gradlew.bat check`
- Pre-commit backend Gradle check during commit
