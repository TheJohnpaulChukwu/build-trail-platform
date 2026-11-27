create table private.supabase_auth_config (
  singleton boolean primary key default true check(singleton),
  issuer text not null check(char_length(issuer) between 1 and 2048)
);
