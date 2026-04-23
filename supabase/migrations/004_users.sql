begin;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  display_name text not null,
  role text not null,
  division text not null,
  status text not null,
  mfa_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (length(trim(email)) > 0),
  check (length(trim(display_name)) > 0),
  check (length(trim(role)) > 0),
  check (length(trim(division)) > 0),
  check (length(trim(status)) > 0)
);

create index if not exists idx_users_role_status
  on users (role, status);

create index if not exists idx_users_created_at
  on users (created_at desc);

create or replace function set_users_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_users_updated_at on users;

create trigger trg_users_updated_at
before update on users
for each row execute function set_users_updated_at();

commit;
