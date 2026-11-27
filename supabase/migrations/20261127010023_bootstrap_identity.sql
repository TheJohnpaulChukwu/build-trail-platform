-- Generated from database/migrations/core/20261127010023_bootstrap_identity.sql; edit the source and run npm run db:prepare.
create function private.bootstrap_identity()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(user_id) values(new.id);
  insert into private.user_quotas(user_id) values(new.id);
  return new;
end;
$$;
