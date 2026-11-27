create policy preferences_select_self_active on public.user_preferences for select to buildtrail_user
using(user_id=(select private.current_app_user_id()) and (select private.is_active_user()));
