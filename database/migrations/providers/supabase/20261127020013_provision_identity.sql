create function private.provision_supabase_identity(subject uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare realm text; app_id uuid;
begin
  select issuer into realm from private.supabase_auth_config where singleton;
  if realm is null then
    raise exception using errcode='42501', message='Authentication issuer is not configured';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(realm || ':' || subject::text,0));
  select user_id into app_id from private.auth_identities
    where provider='supabase' and issuer=realm and auth_identities.subject=provision_supabase_identity.subject::text;
  if app_id is null then
    insert into private.app_users default values returning id into app_id;
    insert into private.auth_identities(provider,issuer,subject,user_id) values('supabase',realm,subject::text,app_id);
  end if;
  return app_id;
end;
$$;
