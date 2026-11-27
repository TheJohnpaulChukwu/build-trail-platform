-- Generated from database/migrations/core/20261127010016_auth_identities_rls.sql; edit the source and run npm run db:prepare.
alter table private.auth_identities enable row level security;
