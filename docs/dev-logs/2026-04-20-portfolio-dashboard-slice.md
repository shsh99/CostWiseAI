# 2026-04-20 Portfolio Dashboard Slice

## Context

The project brief and reference image point to a portfolio-first finance decision tool:

- 5 operating headquarters
- around 20 projects
- ABC allocation at the operating-portfolio level
- DCF evaluation for ranking and approval decisions

## Worktree Comparison

### A. Single-project dashboard

- Faster to explain
- But it hides the operating-portfolio context from the first screen
- Underrepresents the 5-headquarter / 20-project requirement

### B. Portfolio-first dashboard

- Shows the operating structure the brief actually asks for
- Makes headquarters, project ranking, and decision signals visible at once
- Better matches the submission goal and the image

## Decision

Chose **B: portfolio-first dashboard**.

## What Changed

- Added a backend portfolio summary API for 5 headquarters and 20 projects.
- Added a frontend portfolio dashboard that reads the portfolio summary shape.
- Kept the executive decision view, but re-centered it on the operating portfolio instead of a single project.

## Validation

- Backend compile: `./gradlew.bat -q classes` passed.
- Backend tests: `./gradlew.bat test` passed.
- Frontend lint: `npm run lint` passed.
- Frontend build: `npm run build` passed.

## Notes

- The local frontend worktree needed `npm install` before lint/build could run.
- The portfolio summary API and the frontend fallback data now share the same structure.
