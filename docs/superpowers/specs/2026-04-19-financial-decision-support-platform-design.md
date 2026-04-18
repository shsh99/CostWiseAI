# Financial Decision Support Platform Design

**Project:** Insurance/financial services new business decision support platform  
**Core idea:** combine ABC cost allocation and DCF-based investment evaluation into one workflow for planners, finance teams, and executives

## Goal

Build a single-page-first web application that helps a user evaluate whether a new business project should be approved. The system must explain:

1. how operating costs are allocated by activity using ABC,
2. whether the project is financially attractive using DCF,
3. who can view or edit each stage of the analysis,
4. what changed over time through an auditable history.

The project is submission-bound, so the design prioritizes completion quality over breadth. The MVP must feel like a real internal decision tool, not a demo with disconnected charts.

## Scope

### In scope

- One new business project at a time
- Three user roles: planner, finance reviewer, executive
- ABC allocation for a small set of departments and cost pools
- DCF evaluation with NPV, IRR, and payback period
- Scenario editing and recalculation
- Approval and review history
- Security controls for authentication, authorization, and audit logging
- One executive summary dashboard plus one detailed analysis page

### Out of scope

- Multi-project portfolio management
- Complex workflow engines
- Real external banking or insurance integrations
- File upload pipelines
- Advanced analytics beyond the listed financial metrics
- Full multi-tenant enterprise admin console

## Recommended Stack

- Frontend: React 18, TypeScript, Tailwind CSS
- Backend: Java 21, Spring Boot 3.x
- Database: Supabase PostgreSQL
- Auth: Supabase Auth for identity, Spring Security for server-side authorization enforcement
- Deployment: Cloudflare Pages for the frontend, separate Spring runtime for the API, Supabase for database and auth

## Product Shape

The application should open to an executive-oriented summary view. That view answers the only question that matters first: "Should this project proceed?" Supporting views let the planner and finance reviewer inspect assumptions, allocation logic, and approval history.

### Primary user roles

- Planner: enters project assumptions and updates scenario inputs
- Finance reviewer: validates allocation logic, cost basis, and valuation assumptions
- Executive: reads the summary and makes approve/hold/reject decisions

## UX Structure

### 1. Executive dashboard

Purpose: give a decision maker a fast read of business attractiveness.

Content:

- project name, version, status
- approval state
- ABC total allocated cost
- DCF metrics: NPV, IRR, payback period
- risk flags and sensitivity snapshot
- latest reviewer comments

### 2. Detailed analysis page

Purpose: let planners and finance reviewers inspect and adjust assumptions.

Content:

- project profile
- department list and cost pools
- ABC allocation rule table
- cash flow assumptions
- DCF calculation details
- scenario comparison
- approval history

### 3. Supporting panels

- cost allocation detail drawer
- valuation assumptions editor
- audit timeline
- change comparison view

## Architecture

The system should use a modular monolith backend and a feature-based frontend.

### Frontend modules

- `app-shell`: routing, layout, navigation
- `features/dashboard`: executive summary cards and charts
- `features/project-form`: project creation and assumption editing
- `features/abc-allocation`: allocation tables and result views
- `features/dcf-evaluation`: valuation metrics and sensitivity display
- `features/approval-history`: review log and decision notes
- `shared/ui`: reusable inputs, cards, tables, charts, alerts
- `shared/api`: API client, types, error mapping

### Backend modules

- `project`: project lifecycle and metadata
- `allocation`: ABC calculation and allocation-rule handling
- `valuation`: DCF calculation and scenario processing
- `review`: approval state and reviewer comments
- `audit`: immutable event logging and change history
- `security`: authentication, authorization, and request filtering
- `common`: exception handling, response formatting, utilities

### Database entities

- `projects`
- `departments`
- `cost_pools`
- `allocation_rules`
- `cash_flows`
- `valuation_results`
- `scenarios`
- `review_comments`
- `audit_logs`

## Data Flow

1. A user creates a project and sets the business category.
2. The planner enters departments, cost pools, and cash-flow assumptions.
3. The backend calculates ABC cost allocation.
4. The backend calculates DCF results.
5. The frontend renders the executive summary and the detailed analysis view.
6. A reviewer adjusts assumptions and triggers recalculation.
7. The executive records approve/hold/reject decisions.
8. Every significant change is appended to the audit trail.

## Security Design

Security is a first-class requirement, not a separate polish item.

### Authentication

- Users must authenticate before accessing project data
- The system should map users to role-based access: planner, finance reviewer, executive
- Use Supabase Auth for login and token issuance
- Validate tokens and enforce privileges in Spring Security

### Authorization

- Authorization must be enforced on the server, not only in the UI
- Role checks should be applied at the method/service layer in Spring Boot
- Sensitive actions such as recalculation, approval, or export must require explicit privilege

### Data protection

- Never expose service credentials to the browser
- If Supabase is accessed directly from the frontend, RLS must be enabled on all exposed tables
- Prefer routing sensitive operations through the Spring API so the backend remains the trust boundary
- Restrict CORS to the Cloudflare Pages origin only
- Use CSRF protection if cookie-based sessions are used

### Audit logging

Record at least the following events:

- project creation
- allocation rule changes
- valuation recalculation
- scenario edits
- approval or rejection
- login and failed access attempts if feasible

Log entries should avoid secret material and should preserve who/what/when context.

## API Shape

Keep the API small and explicit.

### Core endpoints

- `POST /api/projects`
- `GET /api/projects/{id}`
- `POST /api/projects/{id}/allocate`
- `POST /api/projects/{id}/value`
- `POST /api/projects/{id}/scenarios`
- `POST /api/projects/{id}/review`
- `GET /api/projects/{id}/audit`

### Response rules

- All calculation endpoints return the normalized result plus a summary message
- Errors should be user-readable and mapped to field-level validation where possible
- The backend remains the source of truth for calculated results

## Calculation Rules

### ABC cost allocation

The MVP should use a small, explainable allocation model.

Suggested rules:

- allocate shared costs by driver ratio
- keep a visible allocation base for each department
- show before/after totals for each department
- preserve the calculation inputs that produced the final result

### DCF evaluation

The MVP should calculate:

- NPV
- IRR
- payback period

Suggested simplifications:

- use annual cash flows
- use a single discount rate per scenario
- allow one base scenario and one comparison scenario
- avoid exotic finance instruments in the MVP

## Testing Strategy

Test quality should match the submission goal: predictable, explainable behavior.

### Backend tests

- service tests for ABC and DCF calculations
- validation tests for input rules
- authorization tests for role-based access
- audit-log tests for critical changes

### Frontend tests

- rendering tests for the dashboard and detail page
- form validation tests
- loading and error state tests
- scenario comparison tests

### End-to-end checks

- create project
- update assumptions
- recalculate
- approve or reject
- verify audit trail

## Delivery Workflow

1. Freeze scope and the main dashboard layout.
2. Implement the backend calculation modules first.
3. Connect the frontend to the backend.
4. Add authentication, authorization, and audit logging.
5. Polish the executive dashboard and detail page.
6. Run end-to-end verification on the final submission flow.

## Success Criteria

The project is done when:

- a user can create one project and evaluate it end-to-end,
- ABC and DCF results are both visible and internally consistent,
- roles are enforced,
- the audit trail records key changes,
- the app works as a real Cloudflare Pages + Spring Boot + Supabase stack,
- the submission artifacts are complete and coherent.

## Final Submission Artifacts

- planning document
- development document
- working web application
- implementation notes for security and workflow
