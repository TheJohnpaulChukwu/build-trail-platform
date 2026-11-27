create table private.user_quotas (
  user_id uuid primary key references private.app_users(id) on delete cascade,
  text_bytes bigint not null default 0 check (text_bytes between 0 and 10485760),
  study_record_count integer not null default 0 check (study_record_count between 0 and 10000),
  enrollment_count integer not null default 0 check (enrollment_count between 0 and 1000)
);
