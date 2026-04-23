-- Payefy Panel — migración inicial
-- Crea el enum de roles, la tabla profiles, trigger de alta automática,
-- y políticas RLS base.

-- ============================================================================
-- 1. Enum de roles
-- ============================================================================
create type public.user_role as enum (
  'admin',
  'director_comercial',
  'agente_comercial',
  'onboarding',
  'cliente'
);

-- ============================================================================
-- 2. Tabla profiles (extiende auth.users)
-- ============================================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text,
  phone text,
  role public.user_role not null default 'cliente',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is
  'Perfil extendido. Cada auth.users tiene un profile creado automáticamente por trigger.';

create index profiles_role_idx on public.profiles (role);
create index profiles_email_idx on public.profiles (email);

-- ============================================================================
-- 3. Trigger: auto-crear profile al alta de un auth.user
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', null)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- 4. updated_at automático
-- ============================================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ============================================================================
-- 5. Helper: rol del usuario actual (usado en policies)
-- ============================================================================
create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- ============================================================================
-- 6. RLS en profiles
-- ============================================================================
alter table public.profiles enable row level security;

-- Cada usuario puede leer su propio perfil
create policy "profile_self_select" on public.profiles
  for select using (auth.uid() = id);

-- Admin lee todos
create policy "profile_admin_select" on public.profiles
  for select using (public.current_user_role() = 'admin');

-- Director/Onboarding ven todos los empleados (no clientes)
create policy "profile_staff_select_employees" on public.profiles
  for select using (
    public.current_user_role() in ('director_comercial', 'onboarding')
    and role <> 'cliente'
  );

-- Director/Onboarding también leen clientes (para ver leads)
create policy "profile_staff_select_clients" on public.profiles
  for select using (
    public.current_user_role() in ('director_comercial', 'onboarding')
    and role = 'cliente'
  );

-- Agente ve su propio perfil (ya cubierto arriba) — no puede leer otros.

-- Update: usuario actualiza lo básico de su perfil
create policy "profile_self_update" on public.profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id);

-- Update: admin puede actualizar cualquiera
create policy "profile_admin_update" on public.profiles
  for update using (public.current_user_role() = 'admin');

-- Insert: bloqueado para todos (el trigger lo hace con security definer)
-- Delete: bloqueado (cascade desde auth.users ya borra)
