-- Generated from database/migrations/core/20261127010014_platform_owner.sql; edit the source and run npm run db:prepare.
create table private.platform_owner (
  id smallint primary key check (id = 1),
  user_id uuid not null unique references private.app_users(id) on delete restrict
);
