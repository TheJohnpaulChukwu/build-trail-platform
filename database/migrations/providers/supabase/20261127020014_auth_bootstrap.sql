create function private.bootstrap_supabase_identity()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform private.provision_supabase_identity(new.id);
  return new;
end;
$$;
