-- Generated from database/migrations/providers/supabase/20261127020007_default_public_tables.sql; edit the source and run npm run db:prepare.
alter default privileges in schema public revoke all on tables from anon, authenticated;
