-- Generated from database/migrations/core/20261127010025_current_app_user_id.sql; edit the source and run npm run db:prepare.
-- The provider adapter must replace this fail-closed identity resolver.
create function private.current_app_user_id()
returns uuid language sql stable security definer set search_path = '' as $$
  select null::uuid;
$$;
