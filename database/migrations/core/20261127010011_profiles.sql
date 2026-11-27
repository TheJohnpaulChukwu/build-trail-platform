create table public.profiles (
  user_id uuid primary key references private.app_users(id) on delete cascade,
  display_name text check (display_name is null or char_length(display_name) <= 100),
  account_state text not null default 'active' check (account_state in ('active', 'deleting')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
