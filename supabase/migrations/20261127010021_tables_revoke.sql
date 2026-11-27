-- Generated from database/migrations/core/20261127010021_tables_revoke.sql; edit the source and run npm run db:prepare.
revoke all on public.profiles, public.user_preferences, private.app_users, private.auth_identities, private.user_quotas, private.platform_owner from public, buildtrail_user;
