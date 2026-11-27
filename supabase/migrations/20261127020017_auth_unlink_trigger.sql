-- Generated from database/migrations/providers/supabase/20261127020017_auth_unlink_trigger.sql; edit the source and run npm run db:prepare.
create trigger buildtrail_unlink_supabase_identity after delete on auth.users for each row execute function private.unlink_supabase_identity();
