-- Generated from database/migrations/providers/supabase/20261127020015_auth_bootstrap_trigger.sql; edit the source and run npm run db:prepare.
create trigger buildtrail_bootstrap_supabase_identity after insert on auth.users for each row execute function private.bootstrap_supabase_identity();
