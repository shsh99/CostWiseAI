# Current State

## Project

- Product: insurance/financial services management accounting and project valuation platform
- Core flow: ABC-based cost allocation across 5 operating headquarters and around 20 projects, plus DCF investment evaluation for new business decisions
- Primary users: planner, finance reviewer, executive

## Current Stack

- Frontend: React 18, TypeScript, Vite, Tailwind CSS
- Backend: Java 21, Spring Boot 3.x
- Database and auth: Supabase PostgreSQL and Supabase Auth
- Deployment: Cloudflare Pages for frontend and a separate Spring runtime for backend

## Current Implementation Snapshot

- The frontend has a working Vite app scaffold with a dashboard-style landing page for project and cost review.
- The backend has a Spring Boot scaffold with a checked-in Gradle wrapper bootstrap and calculation services for ABC and DCF.
- The database folder has initial migration and seed placeholders for project, allocation, and valuation data.
- The repository now has branch, worktree, and AI collaboration docs to keep agent work isolated.

## Immediate Direction

- Keep feature work on `feat/*` branches.
- Use one worktree per active feature branch.
- Split new work into small vertical slices.
- Treat the current MVP as the 5-headquarter, roughly 20-project operating slice of the management accounting and valuation platform.
- Review every slice for spec fit and buildability before moving on.

