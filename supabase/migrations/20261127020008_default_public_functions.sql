-- Generated from database/migrations/providers/supabase/20261127020008_default_public_functions.sql; edit the source and run npm run db:prepare.
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;
