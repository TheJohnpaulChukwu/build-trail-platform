-- Generated from database/migrations/providers/supabase/20261127020004_public_revoke.sql; edit the source and run npm run db:prepare.
revoke all on public.profiles, public.user_preferences from anon, authenticated;
