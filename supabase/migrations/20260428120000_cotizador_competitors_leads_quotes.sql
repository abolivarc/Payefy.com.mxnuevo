-- Cotizador: catálogo de competidores + tablas leads y quotes.
-- Mix débito/crédito 50/50 e IVA 16% NO viven aquí — son constantes de
-- negocio en `lib/commission/calculate.ts` (ver §13 de payefy-arquitectura.md).

-- ============================================================================
-- 1. competitors (catálogo de agregadores en MX)
-- ============================================================================
create table public.competitors (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  display_order int not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.competitors (name, display_order) values
  ('Mercado Pago', 1),
  ('Clip', 2),
  ('Conekta', 3),
  ('Sr. Pago', 4),
  ('Banorte', 5),
  ('Banamex Adquirente', 6),
  ('BBVA Adquirente', 7),
  ('Santander Adquirente', 8),
  ('Scotiabank Adquirente', 9),
  ('Banregio Adquirente', 10),
  ('Inbursa', 11),
  ('Openpay', 12),
  ('Stripe', 13),
  ('Otro', 99);

alter table public.competitors enable row level security;
create policy "competitors_staff_select" on public.competitors
  for select using (
    auth.uid() is not null
    and public.current_user_role() in ('admin','director_comercial','agente_comercial','onboarding')
  );
create policy "competitors_admin_all" on public.competitors
  for all using (auth.uid() is not null and public.current_user_role() = 'admin')
  with check (auth.uid() is not null and public.current_user_role() = 'admin');

-- ============================================================================
-- 2. Enums para leads/quotes
-- ============================================================================
create type public.product_interest as enum ('tpv', 'tarjeta', 'ambos');
create type public.entity_type as enum ('fisica', 'moral');
create type public.tpv_modality as enum ('tarjeta_presente', 'e_commerce', 'ambas');

create type public.tpv_status as enum (
  'cotizacion_enviada','en_alta','en_validacion','en_revision',
  'pending_corrections','aprobado','contrato_firmado','afiliacion_kushki',
  'entrega','activo','rechazado'
);

create type public.tarjeta_status as enum (
  'en_alta','subiendo_docs','docs_completos','en_revision_onboarding',
  'correcciones','aprobado_onboarding','enviado_cumplimiento',
  'speiout_habilitado','contratos_firmados','tarjetas_solicitadas',
  'tarjetas_entregadas','facturado','activo','rechazado'
);

create type public.terminal_modality as enum ('comodato', 'renta');

-- ============================================================================
-- 3. leads
-- ============================================================================
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  product_interest public.product_interest not null,
  entity_type public.entity_type not null,
  razon_social text not null,
  contact_name text,
  contact_email text not null,
  contact_phone text not null,
  business_sector_id uuid not null references public.business_sectors(id),
  monthly_volume_projection numeric(14,2) not null check (monthly_volume_projection >= 0),
  average_ticket numeric(14,2) not null check (average_ticket >= 0),
  tpv_modality public.tpv_modality,
  assigned_agent_id uuid not null references public.profiles(id),
  status_tpv public.tpv_status,
  status_tarjeta public.tarjeta_status,
  source text not null default 'cotizador',
  notes text,
  constraint leads_tpv_status_consistent check (
    (product_interest in ('tpv','ambos') and status_tpv is not null)
    or (product_interest = 'tarjeta' and status_tpv is null)
  ),
  constraint leads_tarjeta_status_consistent check (
    (product_interest in ('tarjeta','ambos') and status_tarjeta is not null)
    or (product_interest = 'tpv' and status_tarjeta is null)
  ),
  constraint leads_tarjeta_requires_moral check (
    (product_interest = 'tpv') or (entity_type = 'moral')
  ),
  constraint leads_tpv_modality_consistent check (
    (product_interest in ('tpv','ambos') and tpv_modality is not null)
    or (product_interest = 'tarjeta' and tpv_modality is null)
  )
);

create index leads_assigned_agent_idx on public.leads (assigned_agent_id);
create index leads_status_tpv_idx on public.leads (status_tpv);
create index leads_status_tarjeta_idx on public.leads (status_tarjeta);
create index leads_business_sector_idx on public.leads (business_sector_id);
create index leads_created_at_idx on public.leads (created_at desc);

create trigger set_leads_updated_at
  before update on public.leads
  for each row execute function public.set_updated_at();

comment on table public.leads is
  'Leads comerciales. Se crean desde el cotizador. status_tpv/status_tarjeta nullable según product_interest.';

-- ============================================================================
-- 4. RLS de leads
-- ============================================================================
alter table public.leads enable row level security;

create policy "leads_agent_own_select" on public.leads
  for select using (
    auth.uid() is not null
    and public.current_user_role() = 'agente_comercial'
    and assigned_agent_id = auth.uid()
  );

create policy "leads_staff_select" on public.leads
  for select using (
    auth.uid() is not null
    and public.current_user_role() in ('admin','director_comercial','onboarding')
  );

create policy "leads_agent_insert" on public.leads
  for insert with check (
    auth.uid() is not null
    and public.current_user_role() = 'agente_comercial'
    and assigned_agent_id = auth.uid()
  );

create policy "leads_staff_insert" on public.leads
  for insert with check (
    auth.uid() is not null
    and public.current_user_role() in ('admin','director_comercial')
  );

create policy "leads_agent_own_update" on public.leads
  for update using (
    auth.uid() is not null
    and public.current_user_role() = 'agente_comercial'
    and assigned_agent_id = auth.uid()
  )
  with check (assigned_agent_id = auth.uid());

create policy "leads_staff_update" on public.leads
  for update using (
    auth.uid() is not null
    and public.current_user_role() in ('admin','director_comercial','onboarding')
  );

-- ============================================================================
-- 5. quotes
-- ============================================================================
create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  generated_by uuid not null references public.profiles(id),
  valid_until timestamptz not null default (now() + interval '30 days'),
  rate_debito numeric(5,4) not null,
  rate_credito numeric(5,4) not null,
  rate_amex numeric(5,4) not null,
  rate_international numeric(5,4) not null,
  competitor_id uuid not null references public.competitors(id),
  competitor_rate_debito numeric(5,4) not null,
  competitor_rate_credito numeric(5,4) not null,
  monthly_savings numeric(14,2) not null,
  annual_savings numeric(14,2) not null,
  savings_pct numeric(5,4) not null,
  msi_config jsonb not null default '{}',
  terminal_id uuid not null references public.terminals(id),
  terminal_quantity int not null check (terminal_quantity > 0),
  terminal_modality public.terminal_modality not null,
  projected_weighted_utility numeric(14,4) not null,
  projected_monthly_commission numeric(14,2) not null,
  commission_tier_applied numeric(5,4) not null,
  pdf_url text,
  constraint quotes_rates_positive check (
    rate_debito >= 0 and rate_credito >= 0
    and rate_amex >= 0 and rate_international >= 0
    and competitor_rate_debito >= 0 and competitor_rate_credito >= 0
  )
);

create index quotes_lead_id_idx on public.quotes (lead_id);
create index quotes_generated_by_idx on public.quotes (generated_by);
create index quotes_created_at_idx on public.quotes (created_at desc);
create index quotes_competitor_idx on public.quotes (competitor_id);

create trigger set_quotes_updated_at
  before update on public.quotes
  for each row execute function public.set_updated_at();

comment on table public.quotes is
  'Cotizaciones generadas. Múltiples cotizaciones por lead (histórico). Mix 50/50 e IVA 16% son constantes de negocio en código (ver §13 arquitectura).';

-- ============================================================================
-- 6. RLS de quotes (deriva del acceso al lead)
-- ============================================================================
alter table public.quotes enable row level security;

create policy "quotes_select" on public.quotes
  for select using (
    auth.uid() is not null
    and exists (
      select 1 from public.leads l
      where l.id = quotes.lead_id
      and (
        public.current_user_role() in ('admin','director_comercial','onboarding')
        or (public.current_user_role() = 'agente_comercial' and l.assigned_agent_id = auth.uid())
      )
    )
  );

create policy "quotes_insert" on public.quotes
  for insert with check (
    auth.uid() is not null
    and generated_by = auth.uid()
    and exists (
      select 1 from public.leads l
      where l.id = lead_id
      and (
        public.current_user_role() in ('admin','director_comercial')
        or (public.current_user_role() = 'agente_comercial' and l.assigned_agent_id = auth.uid())
      )
    )
  );

create policy "quotes_update" on public.quotes
  for update using (
    auth.uid() is not null
    and (
      generated_by = auth.uid()
      or public.current_user_role() in ('admin','director_comercial')
    )
  );
