begin;

alter table users
  add column if not exists username text;

update users
set username = split_part(lower(trim(email)), '@', 1)
where username is null or length(trim(username)) = 0;

alter table users
  alter column username set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'users_username_key'
  ) then
    alter table users add constraint users_username_key unique (username);
  end if;
end $$;

commit;
