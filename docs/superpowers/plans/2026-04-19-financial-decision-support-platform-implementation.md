# Financial Decision Support Platform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a submission-ready insurance/financial decision support platform that combines ABC cost allocation, DCF valuation, role-based access, and audit logging in a React + Spring + Supabase stack.

**Architecture:** Use a modular monolith Spring Boot backend as the trust boundary, a feature-based React frontend for the executive dashboard and detail workflow, and Supabase PostgreSQL for storage and identity. Keep calculations on the backend, keep the UI thin, and enforce authorization in Spring Security with RLS only where direct database access is unavoidable.

**Tech Stack:** Java 21, Spring Boot 3.x, Spring Security, PostgreSQL, Supabase Auth, React 18, TypeScript, Tailwind CSS, Cloudflare Pages.

---

### Task 1: Create the project skeleton and shared conventions

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/src/app/README.md`
- Create: `frontend/src/features/README.md`
- Create: `frontend/src/shared/README.md`
- Create: `frontend/src/styles/README.md`
- Create: `backend/build.gradle`
- Create: `backend/src/main/java/README.md`
- Create: `backend/src/main/resources/application.yml`
- Create: `supabase/migrations/001_init.sql`
- Create: `supabase/seed.sql`

- [ ] **Step 1: Create the directory placeholders and root metadata**

Create the folders `frontend/`, `backend/`, and `supabase/` with the README placeholders above so the repository has a clear implementation boundary before code lands.

- [ ] **Step 2: Verify the skeleton exists**

Run: `Get-ChildItem frontend, backend, supabase -Force`
Expected: each folder exists and contains the placeholder README or configuration files listed above.

- [ ] **Step 3: Commit the skeleton**

```bash
git add frontend backend supabase
git commit -m "chore: add project skeleton for finance platform"
```

### Task 2: Define the database schema and row-level security

**Files:**
- Create: `supabase/migrations/001_init.sql`
- Modify: `supabase/seed.sql`

- [ ] **Step 1: Write the schema migration**

```sql
create table projects (
  id uuid primary key,
  name text not null,
  business_category text not null,
  status text not null default 'draft',
  created_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table departments (
  id uuid primary key,
  project_id uuid not null references projects(id) on delete cascade,
  name text not null,
  allocation_base numeric(18,4) not null default 0,
  allocation_ratio numeric(18,6) not null default 0
);

create table cost_pools (
  id uuid primary key,
  project_id uuid not null references projects(id) on delete cascade,
  name text not null,
  amount numeric(18,2) not null,
  driver_type text not null
);

create table allocation_rules (
  id uuid primary key,
  project_id uuid not null references projects(id) on delete cascade,
  department_id uuid not null references departments(id) on delete cascade,
  cost_pool_id uuid not null references cost_pools(id) on delete cascade,
  rule_type text not null,
  rule_value numeric(18,6) not null
);

create table scenarios (
  id uuid primary key,
  project_id uuid not null references projects(id) on delete cascade,
  name text not null,
  is_base boolean not null default false,
  version integer not null,
  created_at timestamptz not null default now()
);

create table cash_flows (
  id uuid primary key,
  project_id uuid not null references projects(id) on delete cascade,
  scenario_id uuid not null references scenarios(id) on delete cascade,
  year_index integer not null,
  cash_inflow numeric(18,2) not null default 0,
  cash_outflow numeric(18,2) not null default 0
);

create table valuation_results (
  id uuid primary key,
  project_id uuid not null references projects(id) on delete cascade,
  scenario_id uuid not null references scenarios(id) on delete cascade,
  npv numeric(18,2) not null,
  irr numeric(10,6) not null,
  payback_period numeric(10,2) not null,
  discount_rate numeric(10,6) not null
);

create table review_comments (
  id uuid primary key,
  project_id uuid not null references projects(id) on delete cascade,
  author_id uuid not null,
  role text not null,
  decision text not null,
  comment text not null,
  created_at timestamptz not null default now()
);

create table audit_logs (
  id uuid primary key,
  project_id uuid not null references projects(id) on delete cascade,
  actor_id uuid not null,
  action_type text not null,
  entity_type text not null,
  entity_id uuid,
  summary text not null,
  created_at timestamptz not null default now()
);

alter table projects enable row level security;
alter table departments enable row level security;
alter table cost_pools enable row level security;
alter table allocation_rules enable row level security;
alter table scenarios enable row level security;
alter table cash_flows enable row level security;
alter table valuation_results enable row level security;
alter table review_comments enable row level security;
alter table audit_logs enable row level security;
```

- [ ] **Step 2: Add a minimal seed dataset**

Seed one project named `2026 신규 사업 타당성 검토`, three departments, three cost pools, one base scenario, and one comparison scenario so the app can render meaningful demo data on first run.

- [ ] **Step 3: Verify schema and seed load cleanly**

Run: `psql` or the Supabase SQL editor against the migration file, then confirm the tables exist and the seed rows insert without foreign-key failures.

- [ ] **Step 4: Commit the database work**

```bash
git add supabase/migrations/001_init.sql supabase/seed.sql
git commit -m "feat: add finance platform database schema"
```

### Task 3: Implement backend project, allocation, and valuation services

**Files:**
- Create: `backend/src/main/java/com/costwise/platform/project/ProjectController.java`
- Create: `backend/src/main/java/com/costwise/platform/project/ProjectService.java`
- Create: `backend/src/main/java/com/costwise/platform/project/ProjectRepository.java`
- Create: `backend/src/main/java/com/costwise/platform/allocation/AllocationController.java`
- Create: `backend/src/main/java/com/costwise/platform/allocation/AllocationService.java`
- Create: `backend/src/main/java/com/costwise/platform/valuation/ValuationController.java`
- Create: `backend/src/main/java/com/costwise/platform/valuation/ValuationService.java`
- Create: `backend/src/main/java/com/costwise/platform/common/ApiError.java`
- Create: `backend/src/main/java/com/costwise/platform/common/GlobalExceptionHandler.java`
- Create: `backend/src/main/resources/application.yml`

- [ ] **Step 1: Write service-level tests first**

Create backend tests that assert:

```java
@Test
void allocation_distributes_shared_costs_by_ratio() {
    var result = allocationService.allocate(projectId);
    assertThat(result.departmentTotals()).hasSize(3);
    assertThat(result.totalAllocatedCost()).isEqualByComparingTo("1000000.00");
}

@Test
void valuation_returns_npv_irr_and_payback() {
    var result = valuationService.evaluate(projectId);
    assertThat(result.npv()).isNotNull();
    assertThat(result.irr()).isNotNull();
    assertThat(result.paybackPeriod()).isNotNull();
}
```

- [ ] **Step 2: Run the tests and confirm they fail initially**

Run: `./gradlew test` or `mvn test`
Expected: tests fail because the services are not implemented yet.

- [ ] **Step 3: Implement the minimum service logic**

Implement the controllers and services so that:

- `POST /api/projects` creates a project record.
- `GET /api/projects/{id}` returns the latest project summary.
- `POST /api/projects/{id}/allocate` calculates department totals from the configured allocation ratios.
- `POST /api/projects/{id}/value` calculates NPV, IRR, and payback period from annual cash flows.

- [ ] **Step 4: Re-run backend tests**

Run: `./gradlew test` or `mvn test`
Expected: tests pass for project creation, allocation, and valuation.

- [ ] **Step 5: Commit the backend domain services**

```bash
git add backend/src/main/java backend/src/test/java backend/src/main/resources/application.yml
git commit -m "feat: implement finance platform core services"
```

### Task 4: Add Spring Security, Supabase token validation, CORS, and audit logging

**Files:**
- Create: `backend/src/main/java/com/costwise/platform/security/SecurityConfig.java`
- Create: `backend/src/main/java/com/costwise/platform/security/SupabaseJwtFilter.java`
- Create: `backend/src/main/java/com/costwise/platform/security/RoleAuthorizationService.java`
- Create: `backend/src/main/java/com/costwise/platform/audit/AuditService.java`
- Modify: `backend/src/main/java/com/costwise/platform/allocation/AllocationService.java`
- Modify: `backend/src/main/java/com/costwise/platform/valuation/ValuationService.java`
- Modify: `backend/src/main/java/com/costwise/platform/review/ReviewService.java`

- [ ] **Step 1: Write security tests**

Add tests for:

```java
@Test
void planner_can_edit_assumptions_but_cannot_approve() { }

@Test
void executive_can_approve_but_cannot_change_allocation_rules() { }

@Test
void invalid_origin_is_rejected_by_cors_policy() { }
```

- [ ] **Step 2: Implement the security configuration**

Implement:

- JWT validation for Supabase-issued tokens
- `@EnableMethodSecurity`
- CORS allowance only for the Cloudflare Pages origin
- CSRF protection when cookie sessions are used
- service-method guards for approval and recalculation actions

- [ ] **Step 3: Implement audit logging**

Record `project creation`, `assumption edit`, `allocation recalculation`, `valuation recalculation`, `decision`, and `permission denied` as immutable audit rows.

- [ ] **Step 4: Re-run tests**

Run: `./gradlew test` or `mvn test`
Expected: security and audit tests pass.

- [ ] **Step 5: Commit the security layer**

```bash
git add backend/src/main/java backend/src/test/java
git commit -m "feat: add security and audit controls"
```

### Task 5: Build the React executive dashboard and detail workflow

**Files:**
- Create: `frontend/src/app/App.tsx`
- Create: `frontend/src/app/routes.tsx`
- Create: `frontend/src/features/dashboard/DashboardPage.tsx`
- Create: `frontend/src/features/project-form/ProjectFormPage.tsx`
- Create: `frontend/src/features/abc-allocation/AllocationPanel.tsx`
- Create: `frontend/src/features/dcf-evaluation/ValuationPanel.tsx`
- Create: `frontend/src/features/approval-history/ApprovalHistoryPanel.tsx`
- Create: `frontend/src/shared/api/client.ts`
- Create: `frontend/src/shared/api/types.ts`
- Create: `frontend/src/shared/ui/*.tsx`
- Create: `frontend/src/styles/tailwind.css`

- [ ] **Step 1: Write UI tests for the main flows**

Create tests that assert:

```tsx
render(<DashboardPage />);
expect(screen.getByText("NPV")).toBeInTheDocument();
expect(screen.getByText("IRR")).toBeInTheDocument();

render(<ProjectFormPage />);
expect(screen.getByRole("button", { name: /recalculate/i })).toBeEnabled();
```

- [ ] **Step 2: Implement the executive dashboard**

The dashboard must show:

- approval status
- ABC total allocated cost
- DCF result cards
- risk snapshot
- reviewer comments

- [ ] **Step 3: Implement the detail workflow**

The detail page must allow:

- project metadata editing
- allocation input editing
- scenario editing
- recalculate
- approve/hold/reject decision submission

- [ ] **Step 4: Connect the frontend to the backend**

Use a single API client that attaches auth tokens and normalizes API errors into field-level messages.

- [ ] **Step 5: Re-run frontend tests**

Run: `npm test` or `pnpm test`
Expected: dashboard and workflow tests pass.

- [ ] **Step 6: Commit the UI layer**

```bash
git add frontend/src
git commit -m "feat: build finance platform dashboard and workflow"
```

### Task 6: Wire deployment, environment variables, and production checks

**Files:**
- Create: `frontend/.env.example`
- Create: `backend/.env.example`
- Modify: `frontend/package.json`
- Modify: `backend/build.gradle`

- [ ] **Step 1: Define environment variables**

Frontend:

```env
VITE_API_BASE_URL=https://api.example.com
VITE_SUPABASE_URL=https://example.supabase.co
VITE_SUPABASE_ANON_KEY=public_anon_key
```

Backend:

```env
SUPABASE_JWT_SECRET=secret_value
SUPABASE_SERVICE_ROLE_KEY=backend_only_secret
ALLOWED_ORIGIN=https://your-pages-domain.pages.dev
```

- [ ] **Step 2: Add production build checks**

Verify:

- frontend builds successfully
- backend starts with production settings
- CORS is limited to the Pages origin
- audit logging writes expected entries

- [ ] **Step 3: Run an end-to-end submission flow**

Exercise the full path:

1. create a project
2. enter assumptions
3. run ABC
4. run DCF
5. submit a decision
6. verify the audit trail

- [ ] **Step 4: Commit the deployment wiring**

```bash
git add frontend/.env.example backend/.env.example frontend/package.json backend/build.gradle
git commit -m "chore: add deployment and production checks"
```

### Task 7: Polish the submission artifacts

**Files:**
- Modify: `docs/superpowers/specs/2026-04-19-financial-decision-support-platform-design.md`
- Modify: `docs/superpowers/plans/2026-04-19-financial-decision-support-platform-development.md`
- Create or modify: `docs/README.md` if the repository uses one

- [ ] **Step 1: Align the final wording with the shipped implementation**

Ensure the docs match the actual product boundaries, the actual stack, and the actual screen count.

- [ ] **Step 2: Verify there are no stale plan gaps**

Confirm every in-scope item in the spec maps to a task above:

- ABC allocation
- DCF valuation
- role-based access
- audit logging
- executive summary view
- detail workflow

- [ ] **Step 3: Commit the final documentation updates**

```bash
git add docs/superpowers/specs docs/superpowers/plans
git commit -m "docs: finalize finance platform plan"
```
