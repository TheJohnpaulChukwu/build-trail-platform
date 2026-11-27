create table private.auth_identities (
  provider text not null check (char_length(provider) between 1 and 100 and provider=btrim(provider)),
  issuer text not null check (char_length(issuer) between 1 and 2048 and issuer=btrim(issuer)),
  subject text not null check (char_length(subject) between 1 and 500 and subject=btrim(subject)),
  user_id uuid not null references private.app_users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (provider, issuer, subject)
);
