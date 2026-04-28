# Arquitectura — Payefy Panel

Documento vivo · v3 · 2026-04-28 · para revisión de Juan

---

## 1. Resumen ejecutivo

Plataforma unificada que reemplaza al prototipo `payefy-merchant-nexus`. Cuando esté lista, se convierte en el nuevo `payefy.com.mx`.

**Alcance inicial — sólo alta de nuevos clientes:**
- Panel empleado con dashboard, 2 Kanbans (TPV y Tarjetas), cotizador con PDF, base de datos comercial, gestión de usuarios.
- Portal cliente con onboarding guiado, subida de documentos, correcciones, descarga de contrato.
- Revisión por Onboarding (Francisco Sosa) con aprobación / correcciones / rechazo.
- Notificaciones por email (Resend).

**Fuera de alcance inicial (explícito):**
- OCR automático · Integraciones API (DocuSign, Kushki, Transfer, emisor, CFDI) · Gestión post-activación · Sucursales / multi-comercio · WhatsApp / SMS.
- Todo lo externo es manual: el sistema solo registra el hito ("enviado a Kushki", "contrato firmado", "facturado").

---

## 2. Stack técnico

| Capa | Tecnología |
|---|---|
| Frontend + Backend | **Next.js 16 (App Router) + TypeScript** |
| DB + Auth + Storage | **Supabase** (proyecto `wxswrchmmsusywtanaoq`) |
| UI | shadcn/ui + Tailwind CSS |
| Formularios | React Hook Form + Zod |
| Kanban | @dnd-kit/core |
| PDFs | @react-pdf/renderer |
| Email | Resend |
| Hosting | Vercel |
| Package manager | pnpm |

---

## 3. Estructura de dominios (un solo dominio)

```
payefy.com.mx/
├── /login                          → auth unificado
├── /app/ ··························· panel EMPLEADOS
│   ├── /                           dashboard (KPIs + accesos)
│   ├── /leads/tpv                  kanban TPV
│   ├── /leads/tarjetas             kanban Tarjetas
│   ├── /leads/[id]                 detalle de lead (tabs)
│   ├── /cotizador                  calculadora + generador PDF
│   ├── /base-datos                 MCCs y precios
│   ├── /clientes                   clientes activos
│   ├── /usuarios                   (sólo admin)
│   └── /mi-comision                (sólo agente) proyección + histórico
└── /cliente/ ······················· portal CLIENTE
    ├── /onboarding                 wizard multipaso
    ├── /docs                       lista documentos + estado
    ├── /correcciones               docs a corregir
    └── /contrato                   descarga / estado
```

Middleware de Next.js redirige a `/app` o `/cliente` según rol tras login.

---

## 4. Roles

| Rol | Qué hace |
|---|---|
| `admin` | Todo · crea usuarios · edita MCCs y precios |
| `director_comercial` | Vende + supervisa · ve TODOS los leads · aprueba descuentos |
| `agente_comercial` | Solo SUS leads · calculadora · BDD de MCCs solo lectura · `/mi-comision` |
| `onboarding` | Revisa expedientes · aprueba/rechaza/pide correcciones (Francisco Sosa) |
| `cliente` | Portal `/cliente` — sube docs, corrige, descarga contrato |

RBAC en dos capas: middleware de rutas + Supabase RLS.

---

## 5. Modelo de datos (Supabase)

### 5.1 Auth + perfil

- **`profiles`** (extiende `auth.users`): `id`, `email`, `full_name`, `phone`, `role`, `is_active`, `created_at`.

### 5.2 Catálogo comercial

- **`business_sectors`** (46 MCCs cargados del CSV viejo): `mcc_code`, `name`, `description`, `base_rate_debit`, `base_rate_credit`, `base_rate_amex`, `base_rate_international`.
- **`pricing_constants`**: markup operación/comercial/utilidad mínima (0.10% cada uno), fees (contracargos $150, rechazada $1.80, 3DS $0.90, envío $500), pisos Amex/internacional.
- **`msi_rates`**: sobretasas por emisor × plazo (PROSA, Banamex, BBVA × 3/6/9/12/18/24 meses).
- **`terminals`**: BP Nano, Sunmi P2, BP Ultra · precios compra/renta/seguro · features.
- **`commission_tiers`**: 25% ($0-500k), 35% ($500k-2.5M), 50% ($2.5M+).
- **`competitors`**: catálogo de agregadores en México (Mercado Pago, Clip, Conekta, Sr. Pago, Banorte, Banamex Adquirente, BBVA Adquirente, Santander Adquirente, Scotiabank Adquirente, Banregio Adquirente, Inbursa, Openpay, Stripe, "Otro"). Solo `name` + `display_order`. Las tasas no se almacenan aquí porque varían por cliente — el agente las captura por cotización.

### 5.3 Leads y cotizaciones

- **`leads`**: `product_interest` (tpv/tarjeta/ambos), `assigned_agent_id`, `entity_type`, `razon_social`, contacto, `business_sector_id`, `monthly_volume_projection`, `average_ticket`, `operation_type`, `status_tpv`, `status_tarjeta` (nullable según producto), `source`, `notes`.
- **`quotes`** (histórico por lead): tarifas Payefy (`rate_debito`, `rate_credito`, `rate_amex`, `rate_international` — los dos últimos heredan del MCC), `competitor_id` + `competitor_rate_debito` + `competitor_rate_credito` (capturados por el agente a partir de lo que reporta el cliente), `monthly_savings`, `annual_savings`, `savings_pct`, `msi_issuers[]`, `msi_months[]`, `terminal_modality` (`comodato` / `renta`, derivada del volumen — ver §13), `terminal_id`, `terminal_quantity`, `projected_weighted_utility`, `projected_monthly_commission`, `commission_tier_applied`, `pdf_url`, `generated_by`, `created_at`, `valid_until` (= `created_at + 30 días`). El mix débito/crédito 50/50 NO se persiste — es constante de negocio (ver §13).

### 5.4 Portal del cliente

- **`client_portals`**: `lead_id` (UNIQUE), `user_id`, `invited_at`, `activated_at`, `onboarding_progress` (0-100 calculado).
- **`document_requirements`**: matriz de qué se pide — `key`, `display_name`, `product` (`tpv`/`tarjeta`/`*`), `entity_type` (`fisica`/`moral`/`*`), `modality` (`tarjeta_presente`/`e_commerce`/`*`), `condition` (string libre, ej: `bc=si`, `if_aplica`), `is_required`, `is_multi` (uno por cada elemento de una lista — reps legales, accionistas, administradores), `caducidad_meses` (null/2/3/1), `accepted_formats` (`jpg`/`pdf`/`jpg|pdf`), `template_url` (si el cliente debe descargar y rellenar), `order`. Seed inicial: ver §12.F.
- **`client_documents`**: `portal_id`, `requirement_key`, `subject_id` (null o UUID — para multi: id del rep/accionista/admin/BC al que aplica), `file_url`, `status` (uploaded/approved/rejected), `rejection_reason`, `uploaded_at`, `reviewed_by`.
- **`client_form_data`**: datos sin doc en estructura flexible JSONB:
  - Datos empresa: `razon_social`, `rfc_empresa`, `telefono`, `email_funcional`, `website_url`.
  - `reps_legales[]`: `{id, nombre, curp, rfc}`.
  - `accionistas[]`: `{id, nombre, tipo: pf|pm, rfc, curp?, porcentaje}` (solo ≥25%).
  - `administradores[]`: `{id, nombre}`.
  - `bc`: `{existe: bool, datos?: {nombre, fecha_nac, pais_nac, nacionalidad, ocupacion, domicilio, telefono, email, curp, rfc, identificacion: {tipo, autoridad, numero}}}`.
  - `info_complementaria`: JSON con todos los campos de §12.C paso 19. El sistema lo renderiza a PDF al enviar.

### 5.5 Operaciones

- **`onboarding_reviews`**: cada revisión — `portal_id`, `reviewer_id`, `decision` (approved/rejected/corrections_requested), `notes`.
- **`contracts`**: `lead_id`, `contract_type` (servicio_tpv/comercial/tarjetas), `pdf_url`, `signed_at`, `uploaded_by`.
- **`terminal_deliveries`**: `lead_id`, `quantity`, `terminal_id`, `modality`, `delivery_address` (JSONB), `scheduled_date`, `delivered_at`, `status`.
- **`card_orders`**: `lead_id`, `quantity`, hitos manuales (`speiout_enabled_at`, `contracts_signed_at`, `ordered_to_issuer_at`, `shipped_at`, `delivered_at`, `invoiced_at`, `paid_at`).

### 5.6 Auditoría y correos

- **`activity_log`**: `entity_type`, `entity_id`, `actor_id`, `action`, `details` (JSONB) — todo hito importante.
- **`email_log`**: `to`, `template`, `status`, `resend_id`, `sent_at`, `error`.

### 5.7 Storage buckets

- `client-documents` (privado · RLS por `portal_id`)
- `contracts` (privado · admin + onboarding + cliente dueño)
- `proposals` (privado · agente que lo generó + cliente vía link firmado)
- `assets` (público · logos)

---

## 6. Flujos de estado

### 6.1 Kanban TPV (`status_tpv`)

```
cotizacion_enviada → en_alta → en_validacion → en_revision
                                                   ↓
                                         pending_corrections (loop)
                                                   ↓
                                              aprobado
                                                   ↓
                                         contrato_firmado
                                                   ↓
                                         afiliacion_kushki
                                                   ↓
                                              entrega
                                                   ↓
                                              activo
                                      (rechazado = terminal)
```

### 6.2 Kanban Tarjetas (`status_tarjeta`)

```
en_alta → subiendo_docs (0-100%) → docs_completos
                                         ↓
                              en_revision_onboarding
                                         ↓
                                   correcciones (loop)
                                         ↓
                              aprobado_onboarding
                                         ↓
                              enviado_cumplimiento (mario@claro.pay.com)
                                         ↓
                              speiout_habilitado
                                         ↓
                              contratos_firmados (DocuSign manual)
                                         ↓
                              tarjetas_solicitadas
                                         ↓
                              tarjetas_entregadas
                                         ↓
                              facturado → activo
                              (rechazado = terminal)
```

Clientes con `product_interest = ambos` viven en **los dos Kanbans** con estados independientes.

---

## 7. Lógica de la calculadora

### 7.1 Inputs

- Giro (MCC) → suministra `base_rate_debit`, `base_rate_credit`, `base_rate_amex`, `base_rate_international`.
- Volumen mensual proyectado, ticket promedio.
- Competidor + tasa débito/crédito que el cliente reporta — el agente captura ambas (varían caso por caso, no hay default por competidor).
- Tarifas Payefy a cotizar: débito y crédito (≥ piso del MCC). AMEX e internacional se autocompletan desde el MCC.
- Modelo de terminal + cantidad. La modalidad (`comodato` / `renta`) se calcula automáticamente según el volumen (ver §13).
- MSI: emisores × plazos a incluir.

### 7.2 Constantes de negocio (no son inputs)

```
DEBIT_CREDIT_MIX = 0.5      // mix débito/crédito 50/50 — inmutable, ver §13
MX_IVA           = 0.16     // IVA México 16% — hardcoded, ver §13
COMODATO_VOL     = 300_000  // umbral volumen para comodato — ver §13
QUOTE_VALID_DAYS = 30       // vigencia cotización — ver §13
```

### 7.3 Fórmulas

**Pisos y márgenes Payefy:**
```
piso_debito          = business_sectors.base_rate_debit
piso_credito         = business_sectors.base_rate_credit
margen_debito        = rate_debito_payefy − piso_debito
margen_credito       = rate_credito_payefy − piso_credito
utilidad_ponderada   = (margen_debito + margen_credito) × DEBIT_CREDIT_MIX
```

**Comisión proyectada del agente:**
```
utilidad_mensual_payefy     = utilidad_ponderada × volumen_mensual
tier                        = commission_tiers.rate aplicable a volumen_mensual
comision_mensual_proyectada = utilidad_mensual_payefy × tier
```

**Comparativa con competidor (montos en MXN ya con IVA):**
```
rate_avg_payefy          = (rate_debito_payefy + rate_credito_payefy) × DEBIT_CREDIT_MIX
rate_avg_competidor      = (competitor_rate_debito + competitor_rate_credito) × DEBIT_CREDIT_MIX

costo_mensual_payefy     = volumen_mensual × rate_avg_payefy     × (1 + MX_IVA)
costo_mensual_competidor = volumen_mensual × rate_avg_competidor × (1 + MX_IVA)

ahorro_mensual           = costo_mensual_competidor − costo_mensual_payefy
ahorro_anual             = ahorro_mensual × 12
ahorro_pct               = ahorro_anual / (costo_mensual_competidor × 12)
```

### 7.4 Reglas operativas

- Ni director ni agente pueden bajar del piso. Solo cotizan por encima.
- AMEX e internacional **siempre se incluyen** en el PDF (sección "Todas las tasas Payefy") pero **NO entran** en la comparativa de ahorro ni en la proyección de comisión.
- MSI: la sobretasa la paga el comercio. No impacta el margen Payefy del débito/crédito.
- Tasas en pantalla y PDF se muestran como `X.XX% + IVA` (texto). Los montos $$ ya incluyen IVA.
- Vigencia de la cotización = `QUOTE_VALID_DAYS` días desde `created_at`.

---

## 8. Integraciones externas

| Servicio | Rol | Implementación |
|---|---|---|
| **Resend** | Emails transaccionales | API directa desde Route Handlers |
| Google Places | Autocompletar dirección | Opcional — postergable |
| DocuSign | Firmas | Manual · se sube PDF firmado |
| Kushki | Afiliación TPV | Manual · solo se registra hito |
| Transfer (Mario) | Habilita SPEIOUT tarjetas | Manual · email + registro hito |
| Emisor tarjetas | Emisión física | Manual · registro hito |
| CFDI | Facturación | Manual · solo campo `invoiced_at` |

---

## 9. Estructura del repo

```
payefy-panel/
├── app/
│   ├── (auth)/login/
│   ├── (empleado)/app/
│   │   ├── page.tsx                # Dashboard
│   │   ├── leads/tpv/
│   │   ├── leads/tarjetas/
│   │   ├── leads/[id]/
│   │   ├── cotizador/
│   │   ├── base-datos/
│   │   ├── clientes/
│   │   ├── usuarios/
│   │   └── mi-comision/
│   ├── (cliente)/cliente/
│   │   ├── onboarding/
│   │   ├── docs/
│   │   ├── correcciones/
│   │   └── contrato/
│   └── api/
│       ├── emails/
│       ├── pdf/propuesta/
│       └── leads/[id]/status/
├── components/
│   ├── ui/                         # shadcn (generado)
│   ├── kanban/
│   ├── cotizador/
│   ├── proposal-pdf/               # @react-pdf
│   ├── client/
│   ├── operations/
│   └── shared/
├── lib/
│   ├── supabase/                   # server.ts + browser.ts
│   ├── rbac/
│   ├── commission/
│   ├── documents/                  # matriz de requerimientos
│   └── email/                      # plantillas Resend
├── supabase/
│   ├── migrations/
│   └── seed.sql                    # MCCs, pricing, terminals, doc_requirements
└── proxy.ts                       # RBAC gating (Next 16: reemplaza middleware.ts)
```

---

## 10. Roadmap por fases

| Semana | Entregable |
|---|---|
| **S1** | Repo · Next · Supabase conectado · Login funcional · Layout con sidebar · Admin + Director preseed · `profiles` + RLS |
| **S2** | Base de datos comercial (46 MCCs) · Calculadora funcional · Proyección de comisión · UI de BDD |
| **S3** | Leads CRUD · Kanban TPV con DnD · Generación PDF de propuesta |
| **S4** | Portal cliente · Onboarding wizard · Subida de docs · Matriz de requerimientos · Progreso 0-100% |
| **S5** | Revisión de expedientes · Flujo de correcciones · Emails automáticos a Francisco/cliente |
| **S6** | Kanban Tarjetas · Flujo Transfer (Mario) · Orden tarjetas · Facturación/pago (registro) |
| **S7** | Contratos manuales (upload) · Entrega de terminales · Activación · Email compliance final |
| **S8** | Dashboard con KPIs · Reportes de comisión · Pulido visual · Deploy producción |

---

## 11. Puntos abiertos a validar antes de empezar S1

1. ✅ Resuelto (v2): mix 50/50 ignora Amex e Internacional para comisión.
2. ⏳ PDF de propuesta — pendiente decidir branding.
3. ⏳ Emails — listado base confirmado (ver §6); falta definir si hay recordatorio por inactividad.
4. ⏳ Director Comercial — pendiente correo.
5. ✅ Resuelto: repo en `https://github.com/abolivarc/Payefy.com.mxnuevo` (cuenta `abolivarc`).

---

## 12. Specs cerrados de flujos KYC (revisión 2026-04-27)

Cierra los puntos abiertos respecto a la documentación KYC. Reglas comunes:

- **Caducidad de docs:** comprobante de domicilio ≤3m · constancia situación fiscal ≤2m · estado de cuenta ≤2m (carátula).
- **ID oficial:** INE/IFE en JPG · Pasaporte en JPG o PDF.
- **Comprobante de domicilio aceptado:** CFE, agua, teléfono.
- **Estado de cuenta:** cualquier banco, **solo carátula** (no movimientos).
- **Reps. legales / accionistas / administradores:** se capturan como **listas multi-elemento** en formulario, con botón "+ Agregar".
- **Accionistas obligatorios:** solo los que tengan ≥25% de participación. Pueden ser PF o PM (RFC obligatorio para ambos; CURP solo si PF).
- **Email del cliente:** editable durante el wizard, con advertencia "será correo funcional ligado a la cuenta".
- **Calidad de fotos** (negocio, prueba de vida): aviso UI exigiendo buena iluminación y legibilidad.
- **URL del sitio web** (e-commerce): se valida solo formato — no se hace HTTP check.
- **Tarjeta solo aplica a PM.** Si un lead PF pide "ambos", el sistema fuerza ajuste antes del wizard.

### 12.A — TPV / Persona Física

Modalidad: `tarjeta_presente` | `e_commerce` | ambas (suma docs). Reviewer: `e.lopez@payefy.me`.

Pasos:
1. Bienvenida + selección de modalidad
2. Confirmar contacto (tel + email — advertencia)
3. Subir identificación oficial (INE JPG / pasaporte JPG o PDF)
4. Subir comprobante de domicilio (≤3m)
5. Subir constancia de situación fiscal (≤2m)
6. Subir estado de cuenta (≤2m, carátula)
7a. Si TP → 2 fotos interior + 2 fotos exterior del negocio
7b. Si EC → URL del sitio web
8. Resumen + envío a revisión

### 12.B — TPV / Persona Moral

Modalidad: igual que A. Reviewer: `e.lopez@payefy.me`.

Pasos:
1. Bienvenida + modalidad
2. Datos empresa (razón social, RFC, contacto)
3. Lista de **representantes legales** (multi: nombre, CURP, RFC)
4. Subir acta constitutiva
5. Subir última actualización del acta (si aplica)
6. Subir inscripción en RPC
7. Subir ID de cada rep. legal de la lista (multi)
8. Subir comprobante de domicilio empresa (≤3m)
9. Subir constancia situación fiscal (≤2m)
10. Subir estado de cuenta (≤2m)
11a. Si TP → 2 int + 2 ext
11b. Si EC → URL
12. Resumen + envío

### 12.C — Tarjeta / Persona Moral (única opción)

No aplica a PF. No tiene modalidades. Reviewer: `francisco.sosa@payefy.me`.

Pasos:
1. Datos empresa (razón social, RFC, contacto)
2. Lista de **representantes legales** (nombre, CURP, RFC)
3. Lista de **accionistas con ≥25%** (nombre, tipo PF/PM, RFC, CURP si PF, % participación)
4. Lista de **administradores** (nombre)
5. **¿Existe Beneficiario Controlador? Sí/No**. Si Sí → captura datos del BC (nombre, fecha y país de nacimiento, nacionalidad, ocupación, domicilio, tel, email, CURP, RFC, datos de identificación)
6. Subir acta constitutiva
7. Última actualización del acta (si aplica)
8. Poder legal (si aplica)
9. Constancia e.firma de la empresa
10. CIF de la empresa
11. Comprobante de domicilio empresa (≤3m)
12. ID de cada accionista PF de la lista (si es PM, no se pide ID — solo el RFC ya capturado)
13. ID de cada rep. legal
14. **Prueba de vida** de cada rep. legal (selfie con ID, JPG)
15. ID de cada administrador
16. Declaración anual del último ejercicio
17. Opinión de cumplimiento del SAT (≤1 mes)
18. Si BC = Sí → ID, CSF, comprobante de domicilio (≤3m) del BC
19. **Llenar formulario de Información Complementaria** en plataforma (organigrama, datos PEP, datos empresa, clientes/proveedores, sucursales, participación accionaria, grupo empresarial). El sistema genera el PDF al cierre y lo incluye en el ZIP a Francisco.
20. Descargar template **Constancia Beneficiario Controlador** (`/public/templates/Constancia_Beneficiario_Controlador.docx`), llenar a mano, firmar, subir como PDF o scan firmado.
21. Resumen + envío

### 12.D — Ambos (TPV + Tarjeta) / Persona Moral

Solo PM. **Wizard único secuencial** — el cliente sube todo de una vez. Reviewers en paralelo: E. López (TPV) + Francisco Sosa (Tarjeta).

Deduplicación:
- **Comunes (se piden una sola vez):** razón social, RFC, contacto, lista reps legales, IDs reps legales, acta constitutiva, actualización del acta, comprobante de domicilio empresa.
- **TPV-only:** inscripción RPC, constancia situación fiscal, estado de cuenta, modalidad (fotos / URL).
- **Tarjeta-only:** poder legal, constancia e.firma, CIF, lista accionistas, lista administradores, IDs accionistas/admins, prueba de vida, declaración anual, opinión SAT, BC + datos BC, info complementaria, constancia BC.

Estados (`status_tpv` y `status_tarjeta`) avanzan en paralelo. Email "expediente recibido" se dispara dos veces al enviar — uno a cada reviewer.

### 12.E — Sub-flujo de Ampliación (cliente activo)

Cliente con un solo producto puede ampliar al otro desde el portal:
- Botón permanente en esquina del portal: "Agregar Tarjeta Payefy" o "Agregar TPV" según el caso.
- Abre wizard que pide solo los docs faltantes del producto adicional, reutilizando datos comunes ya capturados.
- Genera un **lead complementario** vinculado al original, con `product_interest = ambos` y los hitos del producto nuevo independientes.

### 12.F — Matriz consolidada de `document_requirements` (seed)

| key | nombre visible | producto | entity_type | modalidad | obligatorio | caducidad | formato | template | multi |
|---|---|---|---|---|---|---|---|---|---|
| `id_oficial` | Identificación oficial | tpv | fisica | * | sí | vigente | jpg\|pdf | — | — |
| `comprobante_domicilio` | Comprobante de domicilio | tpv | * | * | sí | 3m | pdf | — | — |
| `constancia_sit_fiscal` | Constancia de situación fiscal | tpv | * | * | sí | 2m | pdf | — | — |
| `estado_cuenta` | Estado de cuenta (carátula) | tpv | * | * | sí | 2m | pdf | — | — |
| `foto_negocio_int` | Foto interior negocio (mín 2) | tpv | * | tarjeta_presente | sí | — | jpg | — | sí |
| `foto_negocio_ext` | Foto exterior negocio (mín 2) | tpv | * | tarjeta_presente | sí | — | jpg | — | sí |
| `acta_constitutiva` | Acta constitutiva | * | moral | * | sí | — | pdf | — | — |
| `actualizacion_acta` | Última actualización del acta | * | moral | * | si aplica | — | pdf | — | — |
| `inscripcion_rpc` | Inscripción RPC | tpv | moral | * | sí | — | pdf | — | — |
| `id_rep_legal` | ID rep. legal | * | moral | * | sí | vigente | jpg\|pdf | — | sí |
| `poder_legal` | Poder legal | tarjeta | moral | * | si aplica | — | pdf | — | — |
| `constancia_efirma` | Constancia e.firma | tarjeta | moral | * | sí | — | pdf | — | — |
| `cif_empresa` | CIF empresa | tarjeta | moral | * | sí | — | pdf | — | — |
| `id_accionista` | ID accionista (≥25%, solo PF) | tarjeta | moral | * | sí | vigente | jpg\|pdf | — | sí |
| `prueba_vida_rep_legal` | Selfie con ID rep. legal | tarjeta | moral | * | sí | — | jpg | — | sí |
| `id_administrador` | ID administrador | tarjeta | moral | * | sí | vigente | jpg\|pdf | — | sí |
| `declaracion_anual` | Declaración anual último ejercicio | tarjeta | moral | * | sí | — | pdf | — | — |
| `opinion_cumplimiento_sat` | Opinión cumplimiento SAT | tarjeta | moral | * | sí | 1m | pdf | — | — |
| `constancia_bc` | Constancia Beneficiario Controlador | tarjeta | moral | * | sí | — | pdf | ✅ | — |
| `id_bc` | ID del BC | tarjeta | moral | * | si bc=si | vigente | jpg\|pdf | — | — |
| `csf_bc` | Constancia Sit. Fiscal del BC | tarjeta | moral | * | si bc=si | — | pdf | — | — |
| `comprobante_domicilio_bc` | Comprobante de domicilio del BC | tarjeta | moral | * | si bc=si | 3m | pdf | — | — |

Nota: `info_complementaria` no es upload — se llena como formulario en `client_form_data.info_complementaria` y el sistema genera el PDF para el ZIP de Francisco.

---

## 13. Reglas inmutables del producto (locks)

Reglas de negocio que **no** se exponen como inputs, columnas configurables, ni flags. Si algún día hay que cambiarlas, requiere un cambio explícito en código + arquitectura, no un toggle en la UI.

| Lock | Valor | Donde vive | Por qué |
|---|---|---|---|
| Mix débito/crédito | **50/50** | `lib/commission/calculate.ts` como `DEBIT_CREDIT_MIX = 0.5` const | Regla comercial de Payefy. No se calcula desde uso real, no se promedia, no se ofrece como input. |
| IVA México | **16%** | `lib/commission/calculate.ts` como `MX_IVA = 0.16` const | Aplica a todos los montos en MXN del cotizador y PDF. Sin zonas fronterizas en alcance. |
| Comodato (sin renta mensual) | **Volumen mensual ≥ $300,000 MXN** | `lib/commission/calculate.ts` como `COMODATO_VOL = 300_000` const | Aplica a **cualquier modelo de terminal**. Si volumen < $300k → renta mensual del modelo. |
| Vigencia de cotización | **30 días** | `lib/commission/calculate.ts` como `QUOTE_VALID_DAYS = 30` const | Cada `quote.valid_until = created_at + 30 días`. Vencidas se marcan en UI pero no se borran. |
| Tarjeta Payefy → solo PM | Persona Moral únicamente | Validación en cotizador y portal cliente | Compliance del producto. Lead PF que pida "ambos" se ajusta a TPV. |
| Piso de tasa Payefy | `base_rate_*` del MCC | Validación en form (Zod) | Ni agente ni director pueden cotizar por debajo. |

Estas constantes **NO se almacenan en `pricing_constants`** porque modificarlas no es operación de día a día — es decisión de producto que requiere revisión.

---

_Fin del documento — revísalo y marca inline lo que quieras cambiar._
