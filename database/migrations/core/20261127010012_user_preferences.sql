create table public.user_preferences (
  user_id uuid primary key references private.app_users(id) on delete cascade,
  theme text not null default 'system' check (theme in ('system', 'light', 'dark')),
  reading_size text not null default 'normal' check (reading_size in ('normal', 'large', 'extra_large')),
  reading_font text not null default 'mono' check (reading_font in ('mono', 'proportional')),
  focus boolean not null default false,
  revision bigint not null default 1 check (revision >= 1),
  updated_at timestamptz not null default now()
);
