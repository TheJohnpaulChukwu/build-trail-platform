-- Generated from database/migrations/providers/supabase/20261127020006_private_functions_revoke.sql; edit the source and run npm run db:prepare.
revoke execute on all functions in schema private from public, anon, authenticated, service_role;
