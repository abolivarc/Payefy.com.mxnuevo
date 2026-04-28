import { describe, expect, it } from "vitest";

import {
  COMODATO_VOL,
  DEBIT_CREDIT_MIX,
  MX_IVA,
  QUOTE_VALID_DAYS,
  getTerminalModality,
  getValidUntil,
  mxn,
  pct,
  pickCommissionTier,
  quoteCalc,
  validateRatesAboveFloor,
  type CommissionTier,
} from "./calculate";

const TIERS: CommissionTier[] = [
  { minVolume: 0, maxVolume: 500_000, rate: 0.25 },
  { minVolume: 500_000, maxVolume: 2_500_000, rate: 0.35 },
  { minVolume: 2_500_000, maxVolume: null, rate: 0.5 },
];

describe("constantes (locks)", () => {
  it("DEBIT_CREDIT_MIX = 0.5", () => {
    expect(DEBIT_CREDIT_MIX).toBe(0.5);
  });
  it("MX_IVA = 0.16", () => {
    expect(MX_IVA).toBe(0.16);
  });
  it("COMODATO_VOL = 300000", () => {
    expect(COMODATO_VOL).toBe(300_000);
  });
  it("QUOTE_VALID_DAYS = 30", () => {
    expect(QUOTE_VALID_DAYS).toBe(30);
  });
});

describe("getTerminalModality", () => {
  it("renta cuando volumen < 300k", () => {
    expect(getTerminalModality(0)).toBe("renta");
    expect(getTerminalModality(299_999)).toBe("renta");
  });
  it("comodato exactamente en 300k", () => {
    expect(getTerminalModality(300_000)).toBe("comodato");
  });
  it("comodato cuando volumen > 300k", () => {
    expect(getTerminalModality(1_000_000)).toBe("comodato");
  });
});

describe("pickCommissionTier", () => {
  it("Tier 1 hasta 500k exclusivo", () => {
    expect(pickCommissionTier(TIERS, 0).rate).toBe(0.25);
    expect(pickCommissionTier(TIERS, 100_000).rate).toBe(0.25);
    expect(pickCommissionTier(TIERS, 499_999).rate).toBe(0.25);
  });
  it("Tier 2 en 500k hasta 2.5M exclusivo", () => {
    expect(pickCommissionTier(TIERS, 500_000).rate).toBe(0.35);
    expect(pickCommissionTier(TIERS, 1_500_000).rate).toBe(0.35);
    expect(pickCommissionTier(TIERS, 2_499_999).rate).toBe(0.35);
  });
  it("Tier 3 en 2.5M en adelante", () => {
    expect(pickCommissionTier(TIERS, 2_500_000).rate).toBe(0.5);
    expect(pickCommissionTier(TIERS, 50_000_000).rate).toBe(0.5);
  });
  it("Tier 3 también captura volumen muy alto sin tope", () => {
    const t = pickCommissionTier(TIERS, 999_999_999);
    expect(t.maxVolume).toBeNull();
    expect(t.rate).toBe(0.5);
  });
});

describe("validateRatesAboveFloor", () => {
  it("válido cuando ambas tasas ≥ piso", () => {
    const r = validateRatesAboveFloor({
      rateDebito: 0.025,
      rateCredito: 0.026,
      baseRateDebit: 0.0175,
      baseRateCredit: 0.0236,
    });
    expect(r.valid).toBe(true);
    expect(r.errors).toEqual([]);
  });
  it("inválido cuando débito < piso", () => {
    const r = validateRatesAboveFloor({
      rateDebito: 0.01,
      rateCredito: 0.026,
      baseRateDebit: 0.0175,
      baseRateCredit: 0.0236,
    });
    expect(r.valid).toBe(false);
    expect(r.errors).toHaveLength(1);
    expect(r.errors[0]).toMatch(/débito/);
  });
  it("inválido con ambos errores", () => {
    const r = validateRatesAboveFloor({
      rateDebito: 0.01,
      rateCredito: 0.02,
      baseRateDebit: 0.0175,
      baseRateCredit: 0.0236,
    });
    expect(r.valid).toBe(false);
    expect(r.errors).toHaveLength(2);
  });
});

describe("getValidUntil", () => {
  it("añade 30 días a la fecha base", () => {
    const base = new Date("2026-04-28T12:00:00Z");
    const due = getValidUntil(base);
    expect(due.toISOString()).toBe("2026-05-28T12:00:00.000Z");
  });
  it("no muta la fecha original", () => {
    const base = new Date("2026-04-28T00:00:00Z");
    const baseTime = base.getTime();
    getValidUntil(base);
    expect(base.getTime()).toBe(baseTime);
  });
});

describe("quoteCalc — caso del PDF de referencia", () => {
  // Restaurante prueba: volumen $10M, MP 3.5/3.5, Payefy 2.5/2.5
  // Ahorro mensual esperado: $116,000 (con IVA)
  // Cálculo: ((3.5 - 2.5) + (3.5 - 2.5)) / 2 * 10M = 100k sin IVA → 116k con IVA
  const input = {
    baseRateDebit: 0.0175,
    baseRateCredit: 0.0236,
    rateDebito: 0.025,
    rateCredito: 0.025,
    competitorRateDebito: 0.035,
    competitorRateCredito: 0.035,
    monthlyVolume: 10_000_000,
    tiers: TIERS,
  };

  const r = quoteCalc(input);

  it("ahorro mensual = $116,000 (con IVA)", () => {
    expect(r.monthlySavings).toBeCloseTo(116_000, 2);
  });
  it("ahorro anual = $1,392,000", () => {
    expect(r.annualSavings).toBeCloseTo(1_392_000, 2);
  });
  it("costo mensual Payefy = $290,000", () => {
    expect(r.monthlyCostPayefy).toBeCloseTo(290_000, 2);
  });
  it("costo mensual MP = $406,000", () => {
    expect(r.monthlyCostCompetitor).toBeCloseTo(406_000, 2);
  });
  it("ahorro % ≈ 28.57%", () => {
    expect(r.savingsPct).toBeCloseTo(116_000 / 406_000, 4);
  });
  it("aplica Tier 3 (50%) por volumen $10M", () => {
    expect(r.tier.rate).toBe(0.5);
  });
});

describe("quoteCalc — márgenes y utilidad", () => {
  // Volumen pequeño, tier 1 (25%)
  const input = {
    baseRateDebit: 0.0175,
    baseRateCredit: 0.0236,
    rateDebito: 0.022, // margen 0.0045
    rateCredito: 0.028, // margen 0.0044
    competitorRateDebito: 0.035,
    competitorRateCredito: 0.035,
    monthlyVolume: 200_000,
    tiers: TIERS,
  };

  const r = quoteCalc(input);

  it("margen débito = 0.0045", () => {
    expect(r.marginDebito).toBeCloseTo(0.0045, 6);
  });
  it("margen crédito = 0.0044", () => {
    expect(r.marginCredito).toBeCloseTo(0.0044, 6);
  });
  it("utilidad ponderada = (0.0045 + 0.0044) * 0.5 = 0.00445", () => {
    expect(r.weightedUtility).toBeCloseTo(0.00445, 6);
  });
  it("utilidad Payefy mensual = utilidad × volumen", () => {
    expect(r.monthlyPayefyUtility).toBeCloseTo(0.00445 * 200_000, 4);
  });
  it("comisión agente = utilidad × tier (25%)", () => {
    expect(r.tier.rate).toBe(0.25);
    expect(r.monthlyAgentCommission).toBeCloseTo(
      0.00445 * 200_000 * 0.25,
      4,
    );
  });
});

describe("helpers de formato", () => {
  it("pct redondea a 2 decimales por default", () => {
    expect(pct(0.025)).toBe("2.50%");
    expect(pct(0.0175)).toBe("1.75%");
    expect(pct(0.123456)).toBe("12.35%");
  });
  it("pct con fractionDigits custom", () => {
    expect(pct(0.0175, 4)).toBe("1.7500%");
  });
  it("mxn formatea con currency MX", () => {
    expect(mxn(1_392_000)).toContain("1,392,000");
    expect(mxn(116_000)).toMatch(/116,000/);
  });
});
