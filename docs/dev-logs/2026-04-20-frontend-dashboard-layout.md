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

## Follow-up Comparison

### A. Dashboard page and project detail page split

- Keep the portfolio overview on one screen.
- Move project detail into a second screen or route.
- Make the detail surface larger, but force the user to navigate away from the portfolio overview.

### B. Single control-room layout with inline project drill-down

- Keep the left navigation, KPI strip, project ranking, and detail tabs in one workspace.
- Let the user select a project from the portfolio table and update the detail panel in place.
- Preserve the first-screen emphasis on 5 headquarters and 20 projects while still exposing cost and valuation detail.

## Follow-up Decision

Chose **B**.

## Follow-up Why

- The submission needs the first screen to prove portfolio scope immediately.
- The reference visual direction is a business dashboard, not a route-heavy product UI.
- Inline drill-down keeps the portfolio and project contexts visible at the same time.
- It reduces navigation complexity while still covering cost accounting, valuation, risk, and workflow in one coherent surface.
