-- Generated from database/migrations/providers/supabase/20261127020019_account_context_revoke.sql; edit the source and run npm run db:prepare.
revoke all on function public.account_context() from public, anon, authenticated, service_role;
