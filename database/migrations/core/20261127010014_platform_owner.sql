create table private.platform_owner (
  id smallint primary key check (id = 1),
  user_id uuid not null unique references private.app_users(id) on delete restrict
);
