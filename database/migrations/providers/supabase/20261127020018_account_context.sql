create function public.account_context()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  return jsonb_build_object('issuer',auth.jwt()->>'iss', 'subject',auth.uid()::text,
    'account',private.read_account_context());
end;
$$;
