-- Generated from database/migrations/core/20261127010031_read_account_context.sql; edit the source and run npm run db:prepare.
create function private.read_account_context()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  actor uuid := private.current_app_user_id();
  result jsonb;
begin
  if actor is null then
    raise exception using errcode = '42501', message = 'Account unavailable';
  end if;

  -- A missing profile or quota is fail-closed. All data comes from one statement snapshot.
  select jsonb_build_object(
    'userId', p.user_id,
    'displayName', p.display_name,
    'preferences', jsonb_build_object(
      'theme', coalesce(pref.theme, 'system'),
      'readingSize', coalesce(pref.reading_size, 'normal'),
      'readingFont', coalesce(pref.reading_font, 'mono'),
      'focus', coalesce(pref.focus, false),
      'revision', coalesce(pref.revision::text, '0')
    ),
    'usage', jsonb_build_object(
      'textBytes', q.text_bytes,
      'studyRecordCount', q.study_record_count,
      'enrollmentCount', q.enrollment_count
    ),
    'isOwner', exists (select 1 from private.platform_owner o where o.user_id = actor)
  ) into result
  from public.profiles p
  join private.user_quotas q on q.user_id = p.user_id
  left join public.user_preferences pref on pref.user_id = p.user_id
  where p.user_id = actor and p.account_state = 'active';

  if result is null then
    raise exception using errcode = '42501', message = 'Account unavailable';
  end if;
  return result;
end;
$$;
