create table private.app_users (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);
