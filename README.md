# Payefy Panel

Panel interno y portal de cliente para el alta KYC de los dos productos de Payefy: **Terminales Punto de Venta (TPV)** y **Tarjetas Payefy**.

Sustituye al prototipo `payefy-merchant-nexus`. Cuando esté lista, reemplaza a `payefy.com.mx`.

## Stack

- **Next.js 16** (App Router) + TypeScript · pnpm
- **Supabase** (Auth + Postgres + Storage)
- **shadcn/ui** + Tailwind 4
- **React Hook Form + Zod** para formularios
- **@dnd-kit** para los Kanbans (TPV y Tarjetas)
- **@react-pdf/renderer** para el PDF de propuesta
- **Resend** para emails transaccionales
- **Vercel** para deploy

## Setup inicial

1. Clona e instala:
   ```bash
   git clone https://github.com/abolivarc/payefy-panel.git
   cd payefy-panel
   pnpm install
   ```
2. Copia el ejemplo de variables:
   ```bash
   cp .env.local.example .env.local
   ```
3. Llena los valores en `.env.local` con las keys del dashboard de Supabase y la API key de Resend.
4. Aplica las migraciones en Supabase (ver `supabase/migrations/`). Opciones:
   - Pegarlas en el SQL Editor del dashboard, **o**
   - Instalar el CLI de Supabase: `pnpm dlx supabase link --project-ref wxswrchmmsusywtanaoq && pnpm dlx supabase db push`.
5. Corre el dev server:
   ```bash
   pnpm dev
   ```

## Primera vez

1. Visita `http://localhost:3000/login`, entra en "Crear cuenta" y regístrate con el correo admin.
2. En el SQL Editor de Supabase, ejecuta `supabase/seed.sql` para promover tu usuario a rol `admin`.
3. Vuelve a la app — ahora deberías ver el dashboard con sidebar completo.

## Estructura

```
app/
├── (auth)/login/              Auth unificado (empleados + clientes)
├── (empleado)/app/            Panel interno por rol
└── (cliente)/cliente/         Portal del cliente
components/                    UI reutilizable + componentes por feature
lib/supabase/                  Clients browser/server + helper de proxy
proxy.ts                       RBAC gating (Next 16: reemplaza a middleware.ts)
supabase/migrations/           SQL versionado
supabase/seed.sql              Promoción de roles iniciales
```

## Roles

- `admin` — todo
- `director_comercial` — vende + supervisa todos los leads
- `agente_comercial` — solo sus leads; ve BDD y calculadora
- `onboarding` — revisa expedientes (Francisco Sosa para tarjetas, E. López para TPV)
- `cliente` — portal de alta KYC

Ver `~/Desktop/payefy-arquitectura.md` para el documento completo.

## Roadmap

- **S1 ✓** Repo · bootstrap · login · RBAC · profiles + RLS
- **S2** Base de datos comercial + Calculadora + proyección comisión
- **S3** Leads + Kanban TPV + PDF propuesta
- **S4** Portal cliente + subida documentos
- **S5** Revisión onboarding + correcciones + emails
- **S6** Kanban Tarjetas + flujo Transfer/Mario
- **S7** Contratos manuales + entregas + activación
- **S8** Dashboard KPIs + reportes comisión + deploy producción
