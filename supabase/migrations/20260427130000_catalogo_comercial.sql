-- Catálogo comercial: MCCs, pricing_constants, msi_rates, terminals, commission_tiers.
-- RLS: lee staff (admin/director/agente/onboarding), escribe solo admin.

-- ============================================================================
-- 1. business_sectors (giros / MCCs)
-- ============================================================================
create table public.business_sectors (
  id uuid primary key default gen_random_uuid(),
  mcc_code text not null unique,
  name text not null,
  description text,
  base_rate_debit numeric(5,4) not null,
  base_rate_credit numeric(5,4) not null,
  base_rate_amex numeric(5,4) not null,
  base_rate_international numeric(5,4) not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index business_sectors_mcc_idx on public.business_sectors (mcc_code);
create index business_sectors_active_idx on public.business_sectors (is_active);

create trigger set_business_sectors_updated_at
  before update on public.business_sectors
  for each row execute function public.set_updated_at();

comment on table public.business_sectors is
  'Catálogo de giros (MCCs) con tasas base. Seed desde costos-oficial.csv en otra migración.';

-- ============================================================================
-- 2. pricing_constants (markups y fees globales)
-- ============================================================================
create table public.pricing_constants (
  key text primary key,
  value numeric(12,4) not null,
  unit text not null check (unit in ('percent','mxn')),
  description text not null,
  updated_at timestamptz not null default now()
);

create trigger set_pricing_constants_updated_at
  before update on public.pricing_constants
  for each row execute function public.set_updated_at();

comment on table public.pricing_constants is
  'Constantes globales de pricing. Editables solo por admin.';

insert into public.pricing_constants (key, value, unit, description) values
  ('markup_operacion',         0.0010, 'percent', 'Markup operación sobre tasa base'),
  ('markup_comercial',         0.0010, 'percent', 'Markup comercial sobre tasa base'),
  ('markup_utilidad_minima',   0.0010, 'percent', 'Utilidad mínima Payefy (piso)'),
  ('fee_contracargo',          150,    'mxn',     'Fee por contracargo'),
  ('fee_rechazada',            1.80,   'mxn',     'Fee por transacción rechazada'),
  ('fee_3ds',                  0.90,   'mxn',     'Fee 3D Secure'),
  ('fee_envio_terminal',       500,    'mxn',     'Costo de envío de terminal');

-- ============================================================================
-- 3. msi_rates (tasas MSI por emisor × plazo)
-- ============================================================================
create type public.msi_issuer as enum ('prosa', 'banamex', 'bbva');

create table public.msi_rates (
  id uuid primary key default gen_random_uuid(),
  issuer public.msi_issuer not null,
  months int not null check (months in (3, 6, 9, 12, 18, 24)),
  rate numeric(5,4) not null,
  is_available boolean not null default true,
  updated_at timestamptz not null default now(),
  unique (issuer, months)
);

create trigger set_msi_rates_updated_at
  before update on public.msi_rates
  for each row execute function public.set_updated_at();

-- Seed (PDF tasas-msi-payefy)
insert into public.msi_rates (issuer, months, rate, is_available) values
  ('prosa',   3,  0.0375, true),
  ('prosa',   6,  0.0575, true),
  ('prosa',   9,  0.0875, true),
  ('prosa',   12, 0.1175, true),
  ('prosa',   18, 0.1525, true),
  ('prosa',   24, 0,      false), -- N/A
  ('banamex', 3,  0.0395, true),
  ('banamex', 6,  0.0745, true),
  ('banamex', 9,  0.1025, true),
  ('banamex', 12, 0.1235, true),
  ('banamex', 18, 0.1715, true),
  ('banamex', 24, 0.2215, true),
  ('bbva',    3,  0.0395, true),
  ('bbva',    6,  0.0655, true),
  ('bbva',    9,  0.0905, true),
  ('bbva',    12, 0.1145, true),
  ('bbva',    18, 0.1755, true),
  ('bbva',    24, 0.2195, true);

-- ============================================================================
-- 4. terminals (catálogo de modelos)
-- ============================================================================
create table public.terminals (
  id uuid primary key default gen_random_uuid(),
  model text not null unique,
  description text,
  purchase_price numeric(10,2),
  rent_monthly_price numeric(10,2),
  insurance_monthly_price numeric(10,2),
  features text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_terminals_updated_at
  before update on public.terminals
  for each row execute function public.set_updated_at();

-- Seed básico (precios pendientes — se editan en admin UI)
insert into public.terminals (model, description, features) values
  ('BP Nano',  'Terminal compacta',                  array['contactless','chip','msi']),
  ('Sunmi P2', 'Terminal Android con impresora',     array['contactless','chip','msi','imprime']),
  ('BP Ultra', 'Terminal robusta multi-modalidad',   array['contactless','chip','msi','wifi']);

-- ============================================================================
-- 5. commission_tiers (tiers de comisión por volumen)
-- ============================================================================
create table public.commission_tiers (
  id uuid primary key default gen_random_uuid(),
  min_volume numeric(14,2) not null,
  max_volume numeric(14,2),
  rate numeric(5,4) not null,
  description text,
  display_order int not null,
  updated_at timestamptz not null default now()
);

create trigger set_commission_tiers_updated_at
  before update on public.commission_tiers
  for each row execute function public.set_updated_at();

insert into public.commission_tiers (min_volume, max_volume, rate, description, display_order) values
  (0,        500000,   0.25, 'Tier 1: $0 - $500k',     1),
  (500000,   2500000,  0.35, 'Tier 2: $500k - $2.5M',  2),
  (2500000,  null,     0.50, 'Tier 3: $2.5M+',         3);

-- ============================================================================
-- 6. RLS — staff lee, admin escribe
-- ============================================================================
-- Patrón: (auth.uid() is not null) corta a anon limpiamente sin error.

alter table public.business_sectors enable row level security;
create policy "business_sectors_staff_select" on public.business_sectors
  for select using (
    auth.uid() is not null
    and public.current_user_role() in ('admin','director_comercial','agente_comercial','onboarding')
  );
create policy "business_sectors_admin_all" on public.business_sectors
  for all using (
    auth.uid() is not null and public.current_user_role() = 'admin'
  )
  with check (
    auth.uid() is not null and public.current_user_role() = 'admin'
  );

alter table public.pricing_constants enable row level security;
create policy "pricing_constants_staff_select" on public.pricing_constants
  for select using (
    auth.uid() is not null
    and public.current_user_role() in ('admin','director_comercial','agente_comercial','onboarding')
  );
create policy "pricing_constants_admin_all" on public.pricing_constants
  for all using (
    auth.uid() is not null and public.current_user_role() = 'admin'
  )
  with check (
    auth.uid() is not null and public.current_user_role() = 'admin'
  );

alter table public.msi_rates enable row level security;
create policy "msi_rates_staff_select" on public.msi_rates
  for select using (
    auth.uid() is not null
    and public.current_user_role() in ('admin','director_comercial','agente_comercial','onboarding')
  );
create policy "msi_rates_admin_all" on public.msi_rates
  for all using (
    auth.uid() is not null and public.current_user_role() = 'admin'
  )
  with check (
    auth.uid() is not null and public.current_user_role() = 'admin'
  );

alter table public.terminals enable row level security;
create policy "terminals_staff_select" on public.terminals
  for select using (
    auth.uid() is not null
    and public.current_user_role() in ('admin','director_comercial','agente_comercial','onboarding')
  );
create policy "terminals_admin_all" on public.terminals
  for all using (
    auth.uid() is not null and public.current_user_role() = 'admin'
  )
  with check (
    auth.uid() is not null and public.current_user_role() = 'admin'
  );

alter table public.commission_tiers enable row level security;
create policy "commission_tiers_staff_select" on public.commission_tiers
  for select using (
    auth.uid() is not null
    and public.current_user_role() in ('admin','director_comercial','agente_comercial','onboarding')
  );
create policy "commission_tiers_admin_all" on public.commission_tiers
  for all using (
    auth.uid() is not null and public.current_user_role() = 'admin'
  )
  with check (
    auth.uid() is not null and public.current_user_role() = 'admin'
  );
