-- Generated from database/migrations/providers/supabase/20261127020009_default_private_tables.sql; edit the source and run npm run db:prepare.
alter default privileges in schema private revoke all on tables from anon, authenticated;
