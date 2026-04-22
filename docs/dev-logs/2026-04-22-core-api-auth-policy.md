# Core API Auth Policy

## Branch

- Worktree: `.worktrees/feat-53-core-api-auth`
- Branch: `feat/53-core-api-auth`
- Base: `dev`
- Related issue: `#53`

## Comparison

- Option A: keep dashboard, portfolio, accounting, valuation, and compute endpoints public.
- Option B: keep only health public and require authenticated business roles for core business APIs.

Option B was selected because project, cost, valuation, and compute APIs expose business data or business capability and should align with the server-side auth boundary described in the product security direction.

## Changes

- Kept `/api/health` public.
- Required `PLANNER`, `FINANCE_REVIEWER`, or `EXECUTIVE` for dashboard, portfolio summary, cost accounting summary, valuation-risk detail, and compute APIs.
- Restricted audit log API access to `EXECUTIVE`.
- Added security tests for anonymous denial, business-role access, and audit-log role behavior.

## Validation

- `.\gradlew.bat test --tests com.costwise.api.workflow.WorkflowControllerSecurityTest`
- `.\gradlew.bat check`
- Pre-commit backend Gradle check during commit
