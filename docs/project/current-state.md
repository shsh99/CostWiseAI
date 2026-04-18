# Current State

## Project

- Product: insurance/financial services new business decision support platform
- Core flow: ABC cost allocation plus DCF investment evaluation
- Primary users: planner, finance reviewer, executive

## Current Stack

- Frontend: React 18, TypeScript, Vite, Tailwind CSS
- Backend: Java 21, Spring Boot 3.x
- Database and auth: Supabase PostgreSQL and Supabase Auth
- Deployment: Cloudflare Pages for frontend and a separate Spring runtime for backend

## Current Implementation Snapshot

- The frontend has a working Vite app scaffold with a dashboard-style landing page.
- The backend has a Spring Boot scaffold with a checked-in Gradle wrapper bootstrap.
- The database folder has initial migration and seed placeholders.
- The repository now has branch, worktree, and AI collaboration docs to keep agent work isolated.

## Immediate Direction

- Keep feature work on `feat/*` branches.
- Use one worktree per active feature branch.
- Split new work into small vertical slices.
- Review every slice for spec fit and buildability before moving on.

