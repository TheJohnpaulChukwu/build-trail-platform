-- Generated from database/migrations/providers/supabase/20261127020020_account_context_grant.sql; edit the source and run npm run db:prepare.
grant execute on function public.account_context() to authenticated;
