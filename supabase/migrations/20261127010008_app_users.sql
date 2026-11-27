-- Generated from database/migrations/core/20261127010008_app_users.sql; edit the source and run npm run db:prepare.
create table private.app_users (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);
