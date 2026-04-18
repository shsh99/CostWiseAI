# Branch Naming

Use short, predictable branch names that encode the type of work and the issue or task reference.

## Recommended format

```text
<type>/<issue-number>-<short-slug>
```

## Types

- `feat/` for new features
- `fix/` for bug fixes
- `chore/` for maintenance and tooling
- `docs/` for documentation only
- `refactor/` for structural changes without behavior changes
- `hotfix/` for urgent production fixes

## Examples

- `feat/164-ux-b`
- `fix/203-auth-token-refresh`
- `chore/ci-template-update`
- `docs/harness-guides`

## Rules

- Keep the slug short and readable.
- Put the issue number first when one exists.
- Do not use spaces or uppercase letters.
- Prefer one branch per logical change.
- If the work splits into independent pieces, create separate branches instead of widening one branch.

## Workflow

1. Create the branch from `main`.
2. Use the branch for one focused change.
3. Open a PR as soon as the branch is reviewable.
4. Delete the branch after merge.
