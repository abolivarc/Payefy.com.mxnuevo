// Cálculos del cotizador. Funciones puras, sin I/O ni acceso a DB.
// Todas las "tasas" se manejan como decimales: 0.025 = 2.50%.
// Todos los "montos" son MXN.

// ============================================================================
// Constantes de negocio (locks — ver §13 de payefy-arquitectura.md)
// ============================================================================
// Estas constantes son reglas comerciales inmutables. NO convertir en parámetros
// del form, NO almacenar en pricing_constants, NO exponer como toggle.
// Si en el futuro hay que cambiarlas, requiere decisión de producto + PR.

/** Mix débito/crédito 50/50. Regla de negocio inmutable, no se calcula desde uso real. */
export const DEBIT_CREDIT_MIX = 0.5 as const;

/** IVA México 16%. Aplica a montos en MXN del cotizador y PDF. */
export const MX_IVA = 0.16 as const;

/** Volumen mensual mínimo (MXN) para entregar terminal en comodato. Aplica a cualquier modelo. */
export const COMODATO_VOL = 300_000 as const;

/** Vigencia de la cotización en días desde created_at. */
export const QUOTE_VALID_DAYS = 30 as const;

// ============================================================================
// Tipos
// ============================================================================

export type CommissionTier = {
  minVolume: number;
  /** null = sin tope superior */
  maxVolume: number | null;
  rate: number;
};

export type QuoteInput = {
  /** Pisos del MCC (decimales) */
  baseRateDebit: number;
  baseRateCredit: number;
  /** Tarifas Payefy a cotizar (decimales, deben ser ≥ piso) */
  rateDebito: number;
  rateCredito: number;
  /** Tasas que el cliente reporta del competidor (decimales) */
  competitorRateDebito: number;
  competitorRateCredito: number;
  /** Volumen mensual proyectado en MXN */
  monthlyVolume: number;
  /** Tiers de comisión disponibles (ordenados por minVolume ascendente) */
  tiers: CommissionTier[];
};

export type QuoteResult = {
  // Márgenes y utilidad Payefy
  marginDebito: number;
  marginCredito: number;
  weightedUtility: number; // utilidad ponderada (decimal)
  monthlyPayefyUtility: number; // MXN
  // Comisión del agente
  tier: CommissionTier;
  monthlyAgentCommission: number; // MXN
  // Comparativa con competidor (montos con IVA)
  monthlyCostPayefy: number; // MXN con IVA
  monthlyCostCompetitor: number; // MXN con IVA
  monthlySavings: number; // MXN con IVA
  annualSavings: number; // MXN con IVA
  savingsPct: number; // 0.0–1.0
};

// ============================================================================
// Validación
// ============================================================================

export type FloorValidation = {
  valid: boolean;
  errors: string[];
};

/** Verifica que las tarifas Payefy estén ≥ piso del MCC. */
export function validateRatesAboveFloor(input: {
  rateDebito: number;
  rateCredito: number;
  baseRateDebit: number;
  baseRateCredit: number;
}): FloorValidation {
  const errors: string[] = [];
  if (input.rateDebito < input.baseRateDebit) {
    errors.push(
      `Tarifa débito ${pct(input.rateDebito)} es menor al piso ${pct(input.baseRateDebit)}`,
    );
  }
  if (input.rateCredito < input.baseRateCredit) {
    errors.push(
      `Tarifa crédito ${pct(input.rateCredito)} es menor al piso ${pct(input.baseRateCredit)}`,
    );
  }
  return { valid: errors.length === 0, errors };
}

// ============================================================================
// Selección de tier
// ============================================================================

/** Encuentra el tier de comisión aplicable según el volumen. Asume tiers ordenados ascendente. */
export function pickCommissionTier(
  tiers: CommissionTier[],
  monthlyVolume: number,
): CommissionTier {
  for (const t of tiers) {
    const inMin = monthlyVolume >= t.minVolume;
    const inMax = t.maxVolume === null || monthlyVolume < t.maxVolume;
    if (inMin && inMax) return t;
  }
  throw new Error(`Ningún tier coincide con volumen=${monthlyVolume}`);
}

// ============================================================================
// Modalidad de terminal (comodato vs renta)
// ============================================================================

/** Comodato si volumen ≥ COMODATO_VOL ($300k). Aplica a cualquier modelo. */
export function getTerminalModality(
  monthlyVolume: number,
): "comodato" | "renta" {
  return monthlyVolume >= COMODATO_VOL ? "comodato" : "renta";
}

// ============================================================================
// Vigencia
// ============================================================================

/** Devuelve la fecha de vencimiento (created_at + QUOTE_VALID_DAYS). */
export function getValidUntil(createdAt: Date = new Date()): Date {
  const d = new Date(createdAt.getTime());
  d.setDate(d.getDate() + QUOTE_VALID_DAYS);
  return d;
}

// ============================================================================
// Cálculo principal
// ============================================================================

/**
 * Cálculo del cotizador. Ver §7 de payefy-arquitectura.md.
 *
 * Asume tarifas Payefy ≥ piso del MCC (validar antes con validateRatesAboveFloor).
 *
 * Comparativa con competidor usa IVA (MX_IVA): los montos resultantes ya
 * incluyen el IVA, las tasas se manejan internamente en decimal.
 *
 * Mix débito/crédito = 50/50 inmutable (DEBIT_CREDIT_MIX).
 */
export function quoteCalc(input: QuoteInput): QuoteResult {
  const {
    baseRateDebit,
    baseRateCredit,
    rateDebito,
    rateCredito,
    competitorRateDebito,
    competitorRateCredito,
    monthlyVolume,
    tiers,
  } = input;

  // Márgenes y utilidad ponderada
  const marginDebito = rateDebito - baseRateDebit;
  const marginCredito = rateCredito - baseRateCredit;
  const weightedUtility = (marginDebito + marginCredito) * DEBIT_CREDIT_MIX;

  // Utilidad Payefy mensual (decimal × MXN = MXN)
  const monthlyPayefyUtility = weightedUtility * monthlyVolume;

  // Comisión del agente
  const tier = pickCommissionTier(tiers, monthlyVolume);
  const monthlyAgentCommission = monthlyPayefyUtility * tier.rate;

  // Comparativa con competidor (con IVA)
  const rateAvgPayefy = (rateDebito + rateCredito) * DEBIT_CREDIT_MIX;
  const rateAvgCompetitor =
    (competitorRateDebito + competitorRateCredito) * DEBIT_CREDIT_MIX;

  const ivaMultiplier = 1 + MX_IVA;
  const monthlyCostPayefy = monthlyVolume * rateAvgPayefy * ivaMultiplier;
  const monthlyCostCompetitor =
    monthlyVolume * rateAvgCompetitor * ivaMultiplier;

  const monthlySavings = monthlyCostCompetitor - monthlyCostPayefy;
  const annualSavings = monthlySavings * 12;
  const savingsPct =
    monthlyCostCompetitor > 0
      ? annualSavings / (monthlyCostCompetitor * 12)
      : 0;

  return {
    marginDebito,
    marginCredito,
    weightedUtility,
    monthlyPayefyUtility,
    tier,
    monthlyAgentCommission,
    monthlyCostPayefy,
    monthlyCostCompetitor,
    monthlySavings,
    annualSavings,
    savingsPct,
  };
}

// ============================================================================
// Helpers de formato (no modifican lógica)
// ============================================================================

/** Formatea decimal a string "X.XX%" sin sufijo de IVA. */
export function pct(decimal: number, fractionDigits = 2): string {
  return `${(decimal * 100).toFixed(fractionDigits)}%`;
}

/** Formatea monto MXN con separador de miles y 2 decimales. */
export function mxn(amount: number): string {
  return amount.toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 2,
  });
}
