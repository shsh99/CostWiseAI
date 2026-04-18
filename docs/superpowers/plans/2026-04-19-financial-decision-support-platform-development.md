# Financial Decision Support Platform Development Document

**Purpose:** implementation reference for the insurance/financial new business decision support platform  
**Scope:** one-project MVP with ABC cost allocation, DCF valuation, role-based access, and audit logging

## 1. Implementation Summary

Build a modular monolith backend and a feature-based frontend for a decision support tool that helps planners, finance reviewers, and executives evaluate a single new business project.

The backend is the trust boundary. It owns the business rules, calculations, authorization checks, and audit logging. The frontend is responsible for data entry, visualization, and decision review.

## 2. Target Stack

- Frontend: React 18, TypeScript, Tailwind CSS
- Backend: Java 21, Spring Boot 3.x
- Database: Supabase PostgreSQL
- Auth: Supabase Auth for identity, Spring Security for enforcement
- Deployment: Cloudflare Pages for frontend, separate Spring runtime for API, Supabase for database/auth

## 3. Repository-Level Structure

Recommended project layout:

```text
repo/
├── AGENTS.md
├── CODEX.md
├── docs/
│   └── superpowers/
│       ├── specs/
│       └── plans/
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── features/
│   │   ├── shared/
│   │   └── styles/
│   └── package.json
├── backend/
│   ├── src/main/java/
│   ├── src/main/resources/
│   └── build.gradle or pom.xml
└── supabase/
    ├── migrations/
    └── seed.sql
```

If the repository is organized differently, preserve the same logical module boundaries even if the physical paths differ.

## 4. Frontend Architecture

The frontend should be feature-driven. Each feature owns its UI, local state, and API adapters, while shared primitives live in one common layer.

### 4.1 Frontend modules

- `app-shell`
  - App routing
  - Global layout
  - Navigation
  - Role-aware page entry points

- `features/dashboard`
  - Executive summary cards
  - Approval status display
  - ABC and DCF summary visuals
  - Risk flags and sensitivity snapshot

- `features/project-form`
  - Project creation
  - Scenario input editing
  - Validation for required assumptions

- `features/abc-allocation`
  - Department list
  - Cost pool table
  - Allocation rule editor
  - Result breakdown by department

- `features/dcf-evaluation`
  - Cash flow assumptions
  - NPV/IRR/payback display
  - Scenario comparison

- `features/approval-history`
  - Review comments
  - Approval/hold/reject timeline
  - Audit event summary

- `shared/ui`
  - Buttons, inputs, dialogs, tables, badges, cards
  - Loading and error states

- `shared/api`
  - API client
  - Request/response types
  - Error normalization
  - Auth token attachment

### 4.2 Frontend data flow

1. The user opens the executive dashboard.
2. The app loads the latest project summary.
3. The user navigates to the detail page to edit assumptions.
4. The frontend posts input changes to the backend.
5. The backend recalculates ABC and DCF results.
6. The frontend refreshes the dashboard and detail view with normalized results.

### 4.3 Frontend implementation notes

- Keep calculations out of the UI except for display formatting.
- Use optimistic UI only for low-risk edits; always reconcile with server responses.
- Show loading, empty, validation, and server-error states explicitly.
- Use a single shared type model for project, allocation, and valuation responses.

## 5. Backend Architecture

The backend should be a modular monolith with clear service boundaries. Controllers should be thin, services should own business logic, and repositories should only handle persistence.

### 5.1 Backend modules

- `project`
  - Project creation and retrieval
  - Project metadata
  - Project state

- `allocation`
  - ABC cost allocation logic
  - Allocation rule evaluation
  - Department cost breakdown

- `valuation`
  - DCF calculation
  - NPV, IRR, payback period
  - Scenario comparison

- `review`
  - Approval state transitions
  - Reviewer comments
  - Decision records

- `audit`
  - Immutable activity logging
  - Change metadata
  - Traceable decision history

- `security`
  - Authentication filter integration
  - Role-based authorization
  - Request origin and CSRF handling

- `common`
  - Error model
  - Validation model
  - Shared utilities

### 5.2 Backend layering

Recommended layering inside each feature module:

- controller
- service
- domain model
- repository
- mapper
- dto

Rules:

- Controllers accept input, validate shape, and call services.
- Services perform calculations, authorization-aware branching, and persistence coordination.
- Domain objects encapsulate calculation inputs and outputs where it improves clarity.
- Repositories stay persistence-only.

## 6. Database Design

Use Supabase PostgreSQL with RLS enabled for any exposed table. The backend remains the preferred access path for sensitive operations.

### 6.1 Core tables

- `projects`
  - `id`
  - `name`
  - `business_category`
  - `status`
  - `created_by`
  - `created_at`
  - `updated_at`

- `departments`
  - `id`
  - `project_id`
  - `name`
  - `allocation_base`
  - `allocation_ratio`

- `cost_pools`
  - `id`
  - `project_id`
  - `name`
  - `amount`
  - `driver_type`

- `allocation_rules`
  - `id`
  - `project_id`
  - `department_id`
  - `cost_pool_id`
  - `rule_type`
  - `rule_value`

- `cash_flows`
  - `id`
  - `project_id`
  - `scenario_id`
  - `year_index`
  - `cash_inflow`
  - `cash_outflow`

- `valuation_results`
  - `id`
  - `project_id`
  - `scenario_id`
  - `npv`
  - `irr`
  - `payback_period`
  - `discount_rate`

- `scenarios`
  - `id`
  - `project_id`
  - `name`
  - `is_base`
  - `version`
  - `created_at`

- `review_comments`
  - `id`
  - `project_id`
  - `author_id`
  - `role`
  - `decision`
  - `comment`
  - `created_at`

- `audit_logs`
  - `id`
  - `project_id`
  - `actor_id`
  - `action_type`
  - `entity_type`
  - `entity_id`
  - `summary`
  - `created_at`

### 6.2 Database rules

- Enable RLS on any table that can be accessed directly.
- Use `auth.uid()`-based policies only when direct frontend access is necessary.
- Keep sensitive authorization decisions in Spring Boot whenever possible.
- Store calculation history as versioned rows, not mutable overwrites.

## 7. API Contract

The API should be minimal and predictable.

### 7.1 Project APIs

- `POST /api/projects`
  - create a new project

- `GET /api/projects/{id}`
  - fetch project summary and latest results

- `PATCH /api/projects/{id}`
  - update project metadata

### 7.2 Calculation APIs

- `POST /api/projects/{id}/allocate`
  - run ABC allocation

- `POST /api/projects/{id}/value`
  - run DCF evaluation

- `POST /api/projects/{id}/scenarios`
  - create or update a scenario

### 7.3 Review APIs

- `POST /api/projects/{id}/review`
  - submit approval, hold, or rejection

- `GET /api/projects/{id}/audit`
  - fetch the audit trail

### 7.4 API rules

- Every mutating endpoint must be authenticated.
- Authorization must be verified in the service layer.
- Responses should return normalized domain objects plus concise summary fields.
- Validation errors should be field-specific when possible.
- Calculation endpoints must be idempotent for the same input state.

## 8. Security Implementation

Security must cover identity, authorization, transport, and logging.

### 8.1 Authentication

- Use Supabase Auth to issue user identity tokens.
- Validate tokens in the Spring backend.
- Map authenticated users to internal roles: planner, finance reviewer, executive.

### 8.2 Authorization

- Enforce permissions in Spring Security.
- Annotate service methods that perform sensitive actions.
- Separate read-only summary access from recalculation and approval permissions.

### 8.3 Transport and browser security

- Configure CORS only for the Cloudflare Pages origin.
- Use CSRF protection when cookie sessions are used.
- Prefer bearer-token or secure session handling with explicit backend validation.

### 8.4 Secret handling

- Do not expose Supabase service role keys to the browser.
- Store secrets in backend environment variables only.
- Keep the frontend limited to public-safe configuration values.

### 8.5 Logging and audit

Log the following events at minimum:

- project creation
- assumption edits
- allocation recalculations
- DCF recalculations
- approval actions
- permission denials

Avoid logging secrets, raw tokens, or sensitive personal data.

## 9. Calculation Logic

### 9.1 ABC allocation

Model:

- Each cost pool has a driver type.
- Each department has an allocation base or ratio.
- Shared costs are distributed according to the selected driver ratio.

Output:

- total allocated cost per department
- cost pool contribution breakdown
- before/after comparison for each department

### 9.2 DCF evaluation

Model:

- annual cash flow series
- single discount rate per scenario
- base scenario plus optional comparison scenario

Output:

- NPV
- IRR
- payback period
- simple sensitivity snapshot

### 9.3 Calculation guardrails

- Reject incomplete input with clear validation messages.
- Persist the input set that produced each calculation result.
- Keep the formulas explainable and stable.
- Avoid overly advanced financial instruments in the MVP.

## 10. Error Handling

Use one consistent error model across the app.

### Frontend

- show validation errors inline
- show server errors in a dismissible alert
- preserve entered values after failure

### Backend

- convert validation failures to structured error responses
- map authorization failures to a standard forbidden response
- log unexpected failures with enough context to debug but not enough to leak secrets

### Domain

- if allocation cannot be computed, stop and explain which input is missing
- if DCF cannot be computed, stop and explain which assumption is invalid

## 11. Testing Plan

The test plan should prove that the app is coherent, secure, and stable.

### Backend tests

- allocation service tests
- valuation service tests
- scenario versioning tests
- authorization tests
- audit-log tests

### Frontend tests

- dashboard rendering
- form validation
- state transitions
- error handling

### Integration tests

- create project
- edit assumptions
- run allocation
- run DCF
- submit decision
- verify audit trail

## 12. Deployment Plan

### Frontend

- build React app
- deploy to Cloudflare Pages
- set frontend environment variables for API base URL and public Supabase config

### Backend

- deploy Spring Boot API to a separate runtime
- expose only the necessary API routes
- secure the runtime with environment-based secrets and transport security

### Database

- manage schema with migrations
- seed demo data for submission review
- keep the production-like demo dataset small and explainable

## 13. Implementation Order

1. Define the database schema and seed data.
2. Implement project creation and retrieval.
3. Implement ABC allocation.
4. Implement DCF evaluation.
5. Add approval and audit logging.
6. Build the executive dashboard.
7. Build the detailed analysis page.
8. Add authentication and authorization.
9. Run end-to-end checks and polish the UI.

## 14. Acceptance Criteria

The development is ready when:

- one project can be created and evaluated end-to-end,
- ABC output is visible and explainable,
- DCF output is visible and explainable,
- planner, finance reviewer, and executive permissions are enforced,
- audit history records key changes,
- the frontend works on Cloudflare Pages,
- the backend works with Spring Boot 3.x and Java 21,
- the database layer works with Supabase PostgreSQL and RLS where needed.

