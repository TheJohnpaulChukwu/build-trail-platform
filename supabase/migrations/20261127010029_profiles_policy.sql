-- Generated from database/migrations/core/20261127010029_profiles_policy.sql; edit the source and run npm run db:prepare.
create policy profiles_select_self_active on public.profiles for select to buildtrail_user
using(user_id=(select private.current_app_user_id()) and account_state='active');
