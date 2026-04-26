begin;

alter table users
  add column if not exists password_hash text;

update users
set password_hash = crypt('ChangeMe123!', gen_salt('bf'))
where password_hash is null or length(trim(password_hash)) = 0;

alter table users
  alter column password_hash set not null;

commit;
