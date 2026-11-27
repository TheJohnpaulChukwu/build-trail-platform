begin;
do $$ begin
  assert to_regclass('private.app_users') is not null, 'application identity table required';
  assert to_regclass('private.auth_identities') is not null, 'provider mapping required';
  assert to_regnamespace('auth') is null, 'core test must not have Supabase Auth';
end $$;
insert into private.app_users(id) values ('10000000-0000-4000-8000-000000000001'), ('10000000-0000-4000-8000-000000000002');
insert into private.auth_identities(provider,issuer,subject,user_id) values
  ('alternate','https://identity.example.test','subject-one','10000000-0000-4000-8000-000000000001'),
  ('alternate','https://second.example.test','subject-one','10000000-0000-4000-8000-000000000002');
insert into public.user_preferences(user_id,theme,revision) values ('10000000-0000-4000-8000-000000000001','dark',9007199254740993);
insert into private.platform_owner(id,user_id) values(1,'10000000-0000-4000-8000-000000000001');
do $$ begin
  assert (select count(*) from public.profiles)=2, 'atomic profile bootstrap';
  assert (select count(*) from private.user_quotas)=2, 'atomic quota bootstrap';
  begin
    insert into private.auth_identities(provider,issuer,subject,user_id) values ('alternate','https://identity.example.test','subject-one','10000000-0000-4000-8000-000000000002');
    raise exception 'duplicate identity was accepted';
  exception when unique_violation then null; end;
  begin
    delete from private.app_users where id='10000000-0000-4000-8000-000000000001';
    raise exception 'owner deletion was accepted';
  exception when integrity_constraint_violation then null; end;
end $$;
delete from private.auth_identities where issuer='https://identity.example.test';
do $$ begin
  assert exists(select 1 from public.user_preferences where user_id='10000000-0000-4000-8000-000000000001' and theme='dark'), 'unlink must retain work';
end $$;
delete from private.app_users where id='10000000-0000-4000-8000-000000000002';
do $$ begin
  assert (select count(*) from private.auth_identities)=0, 'application deletion cascades mappings';
  assert (select count(*) from public.profiles)=1, 'application deletion cascades profile';
  assert (select count(*) from private.user_quotas)=1, 'application deletion cascades quota';
end $$;
set local role buildtrail_user;
do $$ begin
  assert (select count(*) from public.profiles)=0, 'unconfigured adapter denies profile reads';
  assert (select count(*) from public.user_preferences)=0, 'unconfigured adapter denies preference reads';
  begin
    perform private.read_account_context();
    raise exception 'unconfigured identity resolver allowed account read';
  exception when insufficient_privilege then null; end;
  begin
    update public.profiles set display_name='forged';
    raise exception 'direct profile write allowed';
  exception when insufficient_privilege then null; end;
  begin
    perform * from private.auth_identities;
    raise exception 'mapping inspection allowed';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
