# Branch Naming

Use short, predictable branch names that encode the type of work and the scope of the change.

## Branch Model

- `main` is the release branch.
- `dev` is the integration branch.
- `feat/*` is for focused feature work.
- `fix/*` is for bug fixes.
- `docs/*` is for documentation-only changes.
- `chore/*` is for maintenance and tooling.

## Recommended Format

```text
<type>/<short-slug>
```

If an issue number is available, include it in the slug:

```text
<type>/<issue-number>-<short-slug>
```

## Examples

- `feat/platform-scaffold`
- `feat/164-frontend-dashboard`
- `fix/203-auth-token-refresh`
- `chore/ci-template-update`
- `docs/ai-collaboration`

## Rules

- Keep the slug short and readable.
- Do not use spaces or uppercase letters.
- Prefer one branch per logical change.
- If the work splits into independent pieces, create separate branches instead of widening one branch.
- Branch feature work from `dev`, not from `main`.

## Workflow

1. Start from `dev` for feature work.
2. Create a `feat/*` branch for one focused change.
3. Use a dedicated worktree for the branch when the change is non-trivial.
4. Open a PR into `dev` as soon as the branch is reviewable.
5. Merge `dev` into `main` only after integration checks pass.
6. Delete the branch and its worktree after merge.
