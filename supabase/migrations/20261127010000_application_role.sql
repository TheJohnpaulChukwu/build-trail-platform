-- Generated from database/migrations/core/20261127010000_application_role.sql; edit the source and run npm run db:prepare.
do $$ begin
  if not exists(select 1 from pg_roles where rolname='buildtrail_user') then
    create role buildtrail_user nologin nosuperuser nobypassrls;
  elsif exists(select 1 from pg_roles where rolname='buildtrail_user' and (rolcanlogin or rolsuper or rolbypassrls or rolcreaterole or rolcreatedb or rolreplication)) then
    raise exception 'Existing buildtrail_user role has unsafe capabilities';
  elsif exists(select 1 from pg_auth_members m join pg_roles r on r.oid=m.member where r.rolname='buildtrail_user') then
    raise exception 'Existing buildtrail_user role inherits other roles';
  end if;
end $$;
