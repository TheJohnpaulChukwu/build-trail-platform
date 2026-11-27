create function private.unlink_supabase_identity()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  delete from private.auth_identities where provider='supabase' and subject=old.id::text
    and issuer=(select issuer from private.supabase_auth_config where singleton);
  return old;
end;
$$;
