begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select no_plan();
select has_table('private', 'app_users', 'application identity is provider independent');
select has_table('private', 'auth_identities', 'provider identities map to application users');
select has_table('public', 'profiles', 'profiles exist');
select has_table('public', 'user_preferences', 'preferences exist');
select has_table('private', 'user_quotas', 'quotas are private');
select has_table('private', 'platform_owner', 'owner is private');
select ok(not exists (
  select 1 from pg_constraint c
  where c.contype='f' and c.confrelid='auth.users'::regclass
    and c.conrelid in ('private.app_users'::regclass,'private.auth_identities'::regclass,
      'public.profiles'::regclass,'public.user_preferences'::regclass,
      'private.user_quotas'::regclass,'private.platform_owner'::regclass)
), 'core identity/data has no auth.users foreign key');
select ok(pg_has_role('authenticated','buildtrail_user','member'),'provider role inherits core learner capability');

-- The provider must be configured before it may create application identities.
delete from private.supabase_auth_config;
select throws_ok($$insert into auth.users(id,email) values('10000000-0000-4000-8000-000000000099','no-config@example.test')$$,
  '42501', null, 'unconfigured provider bootstrap fails closed');
insert into private.supabase_auth_config(singleton,issuer) values(true,'http://127.0.0.1:54321/auth/v1');
insert into auth.users(id, email, raw_user_meta_data)
values ('10000000-0000-4000-8000-000000000001','a@example.test','{"role":"owner","account_state":"active","display_name":{"invalid":true}}'),
       ('10000000-0000-4000-8000-000000000002','b@example.test','{}');
select set_config('test.app_a',(select user_id::text from private.auth_identities where provider='supabase' and issuer='http://127.0.0.1:54321/auth/v1' and subject='10000000-0000-4000-8000-000000000001'),true);
select set_config('test.app_b',(select user_id::text from private.auth_identities where provider='supabase' and issuer='http://127.0.0.1:54321/auth/v1' and subject='10000000-0000-4000-8000-000000000002'),true);
select isnt(current_setting('test.app_a'),'10000000-0000-4000-8000-000000000001','application ID is independent from provider subject');
select isnt(current_setting('test.app_a'),current_setting('test.app_b'),'distinct subjects create distinct application identities');
select is((select count(*)::integer from public.profiles where user_id in(current_setting('test.app_a')::uuid,current_setting('test.app_b')::uuid)),2,'application trigger bootstraps profiles');
select is((select count(*)::integer from private.user_quotas where user_id in(current_setting('test.app_a')::uuid,current_setting('test.app_b')::uuid)),2,'application trigger bootstraps quotas');
select ok(not exists(select 1 from private.platform_owner where user_id in(current_setting('test.app_a')::uuid,current_setting('test.app_b')::uuid)),'signup metadata never assigns owner');
select is((select text_bytes from private.user_quotas where user_id=current_setting('test.app_a')::uuid),0::bigint,'initial quota zero');
select is((select display_name from public.profiles where user_id=current_setting('test.app_a')::uuid),null::text,'untrusted metadata not copied');

insert into private.app_users(id) values('30000000-0000-4000-8000-000000000001');
select is((select count(*)::integer from public.profiles where user_id='30000000-0000-4000-8000-000000000001'),1,'core user creation bootstraps without any provider identity');
select is((select count(*)::integer from private.user_quotas where user_id='30000000-0000-4000-8000-000000000001'),1,'core user creation bootstraps quota without auth');
select throws_ok($$insert into public.user_preferences(user_id,theme) values(current_setting('test.app_a')::uuid,'invalid')$$,'23514',null,'invalid theme rejected');
select throws_ok($$insert into public.user_preferences(user_id,revision) values(current_setting('test.app_a')::uuid,0)$$,'23514',null,'stored zero revision rejected');
select throws_ok($$update private.user_quotas set text_bytes=-1 where user_id=current_setting('test.app_a')::uuid$$,'23514',null,'negative quota rejected');
select throws_ok($$update private.user_quotas set study_record_count=10001 where user_id=current_setting('test.app_a')::uuid$$,'23514',null,'record ceiling enforced');
select throws_ok($$update private.user_quotas set enrollment_count=1001 where user_id=current_setting('test.app_a')::uuid$$,'23514',null,'enrollment ceiling enforced');
insert into private.platform_owner(id,user_id) values(1,current_setting('test.app_a')::uuid);
select throws_ok($$delete from private.app_users where id=current_setting('test.app_a')::uuid$$,'23503',null,'sole application owner cannot be deleted');
select throws_ok($$insert into private.platform_owner(id,user_id) values(2,current_setting('test.app_b')::uuid)$$,'23514',null,'owner is singleton');

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000001","iss":"http://127.0.0.1:54321/auth/v1"}',true);
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
select is((select count(*)::integer from public.profiles),1,'owner only sees own application profile');
select is((select user_id::text from public.profiles),current_setting('test.app_a'),'RLS resolves mapping rather than comparing auth subject');
select throws_ok($$update public.profiles set account_state='deleting'$$,'42501',null,'browser cannot change account state');
select throws_ok($$select * from private.user_quotas$$,'42501',null,'browser cannot read quota table');
select throws_ok($$select * from private.auth_identities$$,'42501',null,'browser cannot inspect provider mappings');
select throws_ok($$insert into private.auth_identities(provider,issuer,subject,user_id) values('supabase','http://127.0.0.1:54321/auth/v1','forged',current_setting('test.app_a')::uuid)$$,'42501',null,'browser cannot create identity mapping');
select throws_ok($$update private.auth_identities set user_id=current_setting('test.app_a')::uuid$$,'42501',null,'browser cannot remap an identity');
select throws_ok($$delete from private.auth_identities$$,'42501',null,'browser cannot delete identity mappings');
select throws_ok($$select * from private.supabase_auth_config$$,'42501',null,'browser cannot read provider configuration');
select is(public.account_context()->>'subject','10000000-0000-4000-8000-000000000001','provider envelope carries verified subject');
select is(public.account_context()->>'issuer','http://127.0.0.1:54321/auth/v1','provider envelope carries trusted issuer');
select is(public.account_context()->'account'->>'userId',current_setting('test.app_a'),'account DTO uses independent application ID');
select is(public.account_context()->'account'->'preferences'->>'revision','0','absent preference has virtual revision');
select is(public.account_context()->'account'->>'isOwner','true','owner derives from application identity');
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000001","iss":"https://wrong.example.test/auth/v1"}',true);
select is((select count(*)::integer from public.profiles),0,'wrong issuer cannot resolve even a known subject');
select throws_ok($$select public.account_context()$$,'42501',null,'wrong issuer RPC fails closed');
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000001"}',true);
select throws_ok($$select public.account_context()$$,'42501',null,'missing issuer RPC fails closed');
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000001","iss":"http://127.0.0.1:54321/auth/v1"}',true);
reset role;

-- Configuration and mapping absence must never fall back to auth.uid as user ID.
delete from private.supabase_auth_config;
set local role authenticated;
select throws_ok($$select public.account_context()$$,'42501',null,'missing provider configuration denies account access');
reset role;
insert into private.supabase_auth_config(singleton,issuer) values(true,'http://127.0.0.1:54321/auth/v1');
delete from private.auth_identities where provider='supabase' and issuer='http://127.0.0.1:54321/auth/v1' and subject='10000000-0000-4000-8000-000000000001';
set local role authenticated;
select is((select count(*)::integer from public.profiles),0,'missing mapping cannot read a profile');
select throws_ok($$select public.account_context()$$,'42501',null,'missing mapping RPC fails closed');
reset role;
insert into private.auth_identities(provider,issuer,subject,user_id) values('supabase','http://127.0.0.1:54321/auth/v1','10000000-0000-4000-8000-000000000001',current_setting('test.app_a')::uuid);
select throws_ok($$insert into private.auth_identities(provider,issuer,subject,user_id) values('supabase','http://127.0.0.1:54321/auth/v1','10000000-0000-4000-8000-000000000001',current_setting('test.app_b')::uuid)$$,'23505',null,'same issuer and subject cannot map to two application users');
-- A subject with a different issuer is a separate identity, never an override.
insert into private.auth_identities(provider,issuer,subject,user_id) values('supabase','https://other.example.test/auth/v1','10000000-0000-4000-8000-000000000001',current_setting('test.app_b')::uuid);
set local role authenticated;
select is(public.account_context()->'account'->>'userId',current_setting('test.app_a'),'another issuer mapping cannot hijack the configured identity');
reset role;

insert into public.user_preferences(user_id,theme,revision) values(current_setting('test.app_a')::uuid,'dark',9007199254740993);
update private.auth_identities set user_id=current_setting('test.app_a')::uuid where provider='supabase' and issuer='http://127.0.0.1:54321/auth/v1' and subject='10000000-0000-4000-8000-000000000002';
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000002","iss":"http://127.0.0.1:54321/auth/v1"}',true);
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',true);
select is(public.account_context()->'account'->>'userId',current_setting('test.app_a'),'trusted remapping resolves existing application account');
select is(public.account_context()->'account'->'preferences'->>'revision','9007199254740993','remapping preserves application preferences exactly');
reset role;
select is((select count(*)::integer from private.app_users where id=current_setting('test.app_b')::uuid),1,'remapping does not delete former application account');
update private.auth_identities set user_id=current_setting('test.app_b')::uuid where provider='supabase' and issuer='http://127.0.0.1:54321/auth/v1' and subject='10000000-0000-4000-8000-000000000002';
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000001","iss":"http://127.0.0.1:54321/auth/v1"}',true);
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);

delete from private.user_quotas where user_id=current_setting('test.app_a')::uuid;
set local role authenticated;
select throws_ok($$select public.account_context()$$,'42501',null,'missing quota RPC fails closed');
reset role;
insert into private.user_quotas(user_id) values(current_setting('test.app_a')::uuid);
update public.profiles set account_state='deleting' where user_id=current_setting('test.app_a')::uuid;
set local role authenticated;
select is((select count(*)::integer from public.profiles),0,'deleting account cannot read');
select throws_ok($$select public.account_context()$$,'42501',null,'deleting account RPC denied');
reset role;
update public.profiles set account_state='active' where user_id=current_setting('test.app_a')::uuid;
select ok(not has_function_privilege('anon','public.account_context()','execute'),'anonymous RPC grant denied');
select ok((select bool_and(relrowsecurity) from pg_class where oid in('public.profiles'::regclass,'public.user_preferences'::regclass)),'all exposed tables have RLS');
select lives_ok($$delete from auth.users where id='10000000-0000-4000-8000-000000000001'$$,'provider unlink is allowed even for an application owner');
select is((select count(*)::integer from private.platform_owner where user_id=current_setting('test.app_a')::uuid),1,'provider deletion preserves owner protection');
select is((select count(*)::integer from public.user_preferences where user_id=current_setting('test.app_a')::uuid),1,'provider deletion retains preferences');
select is((select count(*)::integer from private.user_quotas where user_id=current_setting('test.app_a')::uuid),1,'provider deletion retains quota');
select is((select count(*)::integer from private.auth_identities where provider='supabase' and issuer='http://127.0.0.1:54321/auth/v1' and subject='10000000-0000-4000-8000-000000000001'),0,'provider deletion removes only matching realm mapping');
select is((select count(*)::integer from private.auth_identities where issuer='https://other.example.test/auth/v1' and subject='10000000-0000-4000-8000-000000000001'),1,'provider deletion does not remove another issuer mapping');
set local role authenticated;
select throws_ok($$select public.account_context()$$,'42501',null,'deleted provider mapping makes direct RPC fail closed');
reset role;
select * from finish();
rollback;
