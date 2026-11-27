-- Generated from database/migrations/providers/supabase/20261127020010_default_private_functions.sql; edit the source and run npm run db:prepare.
alter default privileges in schema private revoke execute on functions from public, anon, authenticated, service_role;
