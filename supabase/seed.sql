-- Payefy Panel — seed
-- Correr después de la migración inicial y de que el admin haya hecho signUp.
--
-- Flujo:
--   1. Aplicar migración 20260423000000_initial.sql
--   2. El admin se registra vía UI con a.santibanez@payefy.me
--   3. El trigger crea automáticamente su profile con role='cliente'
--   4. Correr este seed para promoverlo a admin

update public.profiles
set
  role = 'admin',
  full_name = coalesce(full_name, 'Alejandro Santibáñez')
where email = 'a.santibanez@payefy.me';

-- Cuando Juan me pase el correo del Director Comercial, se agrega aquí:
-- update public.profiles
-- set role = 'director_comercial', full_name = '<nombre>'
-- where email = '<correo>';
