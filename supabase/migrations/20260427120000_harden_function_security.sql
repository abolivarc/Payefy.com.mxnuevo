-- Hotfix de seguridad sobre la migración inicial.
-- Cierra warnings del database-linter:
--   1. function_search_path_mutable en set_updated_at
--   2. anon_security_definer_function_executable en current_user_role / handle_new_user

-- set_updated_at: search_path explícito
alter function public.set_updated_at() set search_path = public, pg_temp;

-- current_user_role: solo authenticated la necesita (para evaluar RLS).
-- Quitamos PUBLIC y anon.
revoke execute on function public.current_user_role() from public;
revoke execute on function public.current_user_role() from anon;

-- handle_new_user: solo el trigger en auth.users debe correrla.
-- La revocamos completamente; el trigger corre como supabase_auth_admin.
revoke execute on function public.handle_new_user() from public;
revoke execute on function public.handle_new_user() from anon;
revoke execute on function public.handle_new_user() from authenticated;
