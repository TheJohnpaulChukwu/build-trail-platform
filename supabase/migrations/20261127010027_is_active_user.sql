-- Generated from database/migrations/core/20261127010027_is_active_user.sql; edit the source and run npm run db:prepare.
create function private.is_active_user()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.profiles where user_id=(select private.current_app_user_id()) and account_state='active');
$$;
