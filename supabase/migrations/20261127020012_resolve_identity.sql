-- Generated from database/migrations/providers/supabase/20261127020012_resolve_identity.sql; edit the source and run npm run db:prepare.
create or replace function private.current_app_user_id()
returns uuid language sql stable security definer set search_path = '' as $$
  select i.user_id
  from private.auth_identities i
  join private.supabase_auth_config c on c.singleton and c.issuer=i.issuer
  where i.provider='supabase' and i.subject=(select auth.uid())::text
    and c.issuer=(select auth.jwt()->>'iss');
$$;
