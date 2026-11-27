create trigger buildtrail_bootstrap_supabase_identity after insert on auth.users for each row execute function private.bootstrap_supabase_identity();
