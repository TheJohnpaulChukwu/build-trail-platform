create trigger buildtrail_bootstrap_identity after insert on private.app_users for each row execute function private.bootstrap_identity();
