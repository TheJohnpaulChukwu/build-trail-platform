-- Generated from database/migrations/core/20261127010024_bootstrap_trigger.sql; edit the source and run npm run db:prepare.
create trigger buildtrail_bootstrap_identity after insert on private.app_users for each row execute function private.bootstrap_identity();
