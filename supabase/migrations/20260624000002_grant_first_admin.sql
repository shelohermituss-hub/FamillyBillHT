-- Bootstrap RPC: lets the first user self-promote to super_admin.
-- Safe: fails if any admin already exists, so only works once.
create or replace function grant_self_admin()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  admin_count int;
begin
  -- Count existing admins/super_admins
  select count(*) into admin_count
  from wise_users
  where role in ('admin', 'super_admin');

  if admin_count > 0 then
    return 'already_exists';
  end if;

  update wise_users
  set role = 'super_admin'
  where id = auth.uid();

  return 'granted';
end;
$$;
