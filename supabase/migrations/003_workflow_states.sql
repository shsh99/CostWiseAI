begin;

create table if not exists workflow_states (
  project_id text primary key,
  status text not null check (status in ('DRAFT', 'REVIEW', 'APPROVED', 'REJECTED')),
  last_action text not null,
  updated_at timestamptz not null default now()
);

create index if not exists idx_workflow_states_updated_at
  on workflow_states (updated_at desc);

commit;
