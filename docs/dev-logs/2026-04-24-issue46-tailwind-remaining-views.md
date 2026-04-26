# 2026-04-24 - Issue #46 Tailwind Remaining Views

## Context

- Branch: `feat/46-ui-parity-polish`
- Target: finish next slice of #46 by converting remaining frontend views from legacy `global.css` class coupling to Tailwind utilities.
- Scope in this slice: `PortfolioView`, `ReviewsView`, `SettingsView`, and cleanup of obsolete related selectors in `global.css`.

## A/B Comparison

### Option A

- Keep legacy `global.css` selectors for portfolio/reviews/settings and add only small Tailwind wrappers.
- Pros: lowest immediate code churn.
- Cons: mixed styling source keeps maintenance cost high and blocks full Tailwind migration intent.

### Option B (selected)

- Move view-level layout/controls/states to Tailwind utility classes in the view components.
- Remove/neutralize stale selectors in `global.css` that are no longer referenced.
- Pros: clearer component-local styling ownership and reduced dependency on monolithic CSS.
- Cons: larger JSX diff.

## Decision

- Selected Option B because Issue #46 parity work requires sustained UI iteration and the remaining legacy selector coupling was the primary bottleneck.

## Validation

- `frontend: npm run lint` passed.
- `frontend: npm run build` passed.

## Notes

- User-management shared modal/table selectors in `global.css` were intentionally kept where still referenced.
- This slice does not change backend/API behavior.
