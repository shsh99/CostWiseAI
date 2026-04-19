# 2026-04-20 Frontend Dashboard Layout

## Context

Issue `#4` needs a frontend surface that lets an executive review ABC cost allocation and DCF valuation in one coherent flow, while still giving planners and finance reviewers a deeper detail path.

## Alternatives

### A. Inline role-switching panel + stacked dashboard cards

- Keep the main screen as one executive dashboard.
- Use role tabs to switch the detail panel between planner, finance, and executive views.
- Keep the rest of the page visible so the user never loses the overall decision context.

### B. Drawer dialog for the role detail path

- Open a modal drawer when the user selects a role.
- Hide the detail context from the main layout until opened.
- Make the page feel more app-like, but add more interaction and focus-management complexity.

## Decision

Chose **A**.

## Why

- It keeps the MVP smaller and easier to understand.
- The executive summary stays visible while the detail context changes.
- It avoids introducing a drawer/modal interaction before the API contract is stable.
- It is easier to maintain with the current React + CSS scaffold.

## Validation

- `npm run lint` passed.
- `npm run build` passed.

## Notes

- Tailwind is still not part of this slice; the current CSS system already supports the decision flow cleanly.
- The detail path remains one dashboard plus one role-specific review panel.
