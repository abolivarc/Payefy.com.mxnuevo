@AGENTS.md

# Payefy Panel — notas para futuras sesiones

## Qué es
Panel interno + portal cliente para alta KYC de TPV y Tarjetas Payefy. Reconstruido desde cero (reemplaza `payefy-merchant-nexus`). Documento de arquitectura completo: `./payefy-arquitectura.md` (en la raíz del repo).

## Stack
Next.js 16 App Router + TS + pnpm · Supabase (auth/db/storage) · shadcn/ui + Tailwind 4 · RHF + Zod · @dnd-kit · @react-pdf/renderer · Resend · Vercel.

## Convenciones importantes
- **`proxy.ts` en vez de `middleware.ts`** (Next 16 deprecó middleware). La función se llama `proxy`, no `middleware`.
- **`cookies()` es async**: siempre `await cookies()`.
- **Supabase SSR pattern**: `lib/supabase/client.ts` (browser) y `lib/supabase/server.ts` (server, async). Nunca mezcles.
- **Auth flow**: Server Actions + `useActionState`. Ver `app/(auth)/login/actions.ts`.
- **RBAC dos capas**: `proxy.ts` + `app/(empleado)/app/layout.tsx` + Supabase RLS. Nunca confíes solo en una.
- **Rutas en español** (`/cotizador`, `/usuarios`, `/base-datos`, `/leads/tpv`) — no las anglicises.

## Integraciones (todas manuales en fase inicial)
- DocuSign, Kushki, Transfer (Mario), emisor tarjetas, CFDI = MANUAL. Solo registramos el hito.
- **Único servicio externo real**: Resend (emails).

## Scope explícito FUERA en S1-S8
- OCR · APIs externas · post-activación · sucursales · WhatsApp/SMS.

## Emails
- TPV completado → `e.lopez@payefy.me`
- Tarjetas completado → `francisco.sosa@payefy.me`
- Producto "ambos" → a los dos
- Sender → `no-reply@payefy.me`

## Comisión agente
- 50/50 débito/crédito (fijo en proyección)
- Tiers: 25% ($0-500k) / 35% ($500k-2.5M) / 50% ($2.5M+)
- Amex/Internacional NO pesan en proyección (salen en PDF pero no en comisión)
- Agente no puede bajar del piso (`base_rate` del MCC); solo cotiza por encima

## Comandos
- `pnpm dev` — dev server (puerto default 3000)
- `pnpm build` — build de producción
- `pnpm lint` — ESLint
