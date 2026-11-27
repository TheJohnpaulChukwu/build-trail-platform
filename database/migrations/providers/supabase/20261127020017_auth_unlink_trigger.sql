create trigger buildtrail_unlink_supabase_identity after delete on auth.users for each row execute function private.unlink_supabase_identity();
