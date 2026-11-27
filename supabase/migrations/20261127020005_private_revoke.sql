-- Generated from database/migrations/providers/supabase/20261127020005_private_revoke.sql; edit the source and run npm run db:prepare.
revoke all on private.app_users, private.auth_identities, private.user_quotas, private.platform_owner, private.supabase_auth_config from anon, authenticated;
