-- Generated from database/migrations/providers/supabase/20261127020000_auth_config.sql; edit the source and run npm run db:prepare.
create table private.supabase_auth_config (
  singleton boolean primary key default true check(singleton),
  issuer text not null check(char_length(issuer) between 1 and 2048)
);
