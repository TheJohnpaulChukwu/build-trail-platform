create function private.bootstrap_identity()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(user_id) values(new.id);
  insert into private.user_quotas(user_id) values(new.id);
  return new;
end;
$$;
