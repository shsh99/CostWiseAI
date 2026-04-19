begin;

create extension if not exists pgcrypto;

create table projects (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  business_type text not null default 'new_business',
  status text not null default 'draft' check (status in ('draft', 'in_review', 'approved', 'rejected', 'archived')),
  description text,
  created_at timestamptz not null default now()
);

create table departments (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  sort_order integer not null default 0
);

create table scenarios (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  name text not null,
  description text,
  is_baseline boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (project_id, name)
);

create table cost_pools (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  scenario_id uuid references scenarios (id) on delete set null,
  name text not null,
  category text not null check (category in ('personnel', 'it', 'vendor', 'shared', 'other')),
  amount numeric(14, 2) not null check (amount >= 0),
  currency char(3) not null default 'KRW',
  description text,
  created_at timestamptz not null default now()
);

create table allocation_rules (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  scenario_id uuid references scenarios (id) on delete set null,
  cost_pool_id uuid not null references cost_pools (id) on delete cascade,
  department_id uuid not null references departments (id),
  basis text not null check (basis in ('headcount', 'transaction_count', 'revenue', 'manual')),
  allocation_rate numeric(7, 6) not null check (allocation_rate >= 0 and allocation_rate <= 1),
  allocated_amount numeric(14, 2) not null check (allocated_amount >= 0),
  created_at timestamptz not null default now(),
  unique (scenario_id, cost_pool_id, department_id)
);

create table cash_flows (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  scenario_id uuid references scenarios (id) on delete set null,
  period_no integer not null check (period_no >= 0),
  period_label text not null,
  year_label text not null,
  operating_cash_flow numeric(14, 2) not null default 0,
  investment_cash_flow numeric(14, 2) not null default 0,
  financing_cash_flow numeric(14, 2) not null default 0,
  net_cash_flow numeric(14, 2) not null,
  discount_rate numeric(8, 6) not null check (discount_rate >= 0),
  created_at timestamptz not null default now(),
  unique (project_id, scenario_id, period_no)
);

create table valuation_results (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  scenario_id uuid references scenarios (id) on delete set null,
  discount_rate numeric(8, 6) not null check (discount_rate >= 0),
  npv numeric(14, 2) not null,
  irr numeric(8, 6) not null,
  payback_period numeric(8, 2) not null,
  decision text not null check (decision in ('recommend', 'review', 'reject')),
  assumptions jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (project_id, scenario_id)
);

create table approval_logs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  scenario_id uuid references scenarios (id) on delete set null,
  actor_role text not null check (actor_role in ('planner', 'finance_reviewer', 'executive', 'system')),
  actor_name text not null,
  action text not null check (action in ('created', 'allocated', 'evaluated', 'approved', 'rejected', 'commented')),
  comment text,
  created_at timestamptz not null default now()
);

create index idx_scenarios_project_id on scenarios (project_id);
create index idx_cost_pools_project_id on cost_pools (project_id);
create index idx_allocation_rules_project_id on allocation_rules (project_id);
create index idx_cash_flows_project_id on cash_flows (project_id);
create index idx_valuation_results_project_id on valuation_results (project_id);
create index idx_approval_logs_project_id on approval_logs (project_id);

commit;
