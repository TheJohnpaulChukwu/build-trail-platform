-- Generated from database/migrations/core/20261127010010_identity_user_index.sql; edit the source and run npm run db:prepare.
create index auth_identities_user_id_idx on private.auth_identities(user_id);
