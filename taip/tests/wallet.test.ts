import { describe, expect, it } from "vitest";
import { applyPayment, PaymentError, planPayment } from "@/domain/wallet";
import type { CrisisAllowance } from "@/domain/types";

const allowance = (remaining: number): CrisisAllowance => ({
  id: "al1", crisisId: "c1", householdId: "h1", grantedCents: remaining, remainingCents: remaining,
  allowedCategories: ["food", "shelter", "medical"], status: "active",
});

describe("maksete järjekord: kriisisaldo → isiklik reserv → otsemakse", () => {
  it("kasutab esmalt kriisisaldot", () => {
    expect(planPayment(1000, "food", { allowances: [allowance(5000)], personalReserveCents: 5000 }))
      .toEqual([{ source: "crisis_allowance", amountCents: 1000, allowanceId: "al1" }]);
  });

  it("jagab summa kolme allika vahel õiges järjekorras", () => {
    const parts = planPayment(10000, "food", { allowances: [allowance(3000)], personalReserveCents: 2000 });
    expect(parts).toEqual([
      { source: "crisis_allowance", amountCents: 3000, allowanceId: "al1" },
      { source: "personal_reserve", amountCents: 2000 },
      { source: "direct", amountCents: 5000 },
    ]);
  });

  it("kriisisaldoga ei saa maksta väljaspool lubatud kategooriaid", () => {
    const parts = planPayment(4000, "accommodation", { allowances: [allowance(9000)], personalReserveCents: 1000 });
    expect(parts.some((p) => p.source === "crisis_allowance")).toBe(false);
    expect(parts).toEqual([{ source: "personal_reserve", amountCents: 1000 }, { source: "direct", amountCents: 3000 }]);
  });

  it("aegunud kriisisaldot ei kasutata", () => {
    const a = { ...allowance(5000), status: "expired" as const };
    expect(planPayment(100, "food", { allowances: [a], personalReserveCents: 0 })).toEqual([{ source: "direct", amountCents: 100 }]);
  });

  it("applyPayment keeldub käsitsi koostatud plaanist, mis kasutab saldot keelatud kategoorias", () => {
    const w = { allowances: [allowance(5000)], personalReserveCents: 0 };
    expect(() => applyPayment(w, [{ source: "crisis_allowance", amountCents: 100, allowanceId: "al1" }], "mental_health")).toThrow(PaymentError);
  });

  it("applyPayment vähendab saldosid", () => {
    const w = { allowances: [allowance(3000)], personalReserveCents: 2000 };
    const next = applyPayment(w, planPayment(4000, "food", w), "food");
    expect(next.allowances[0].remainingCents).toBe(0);
    expect(next.personalReserveCents).toBe(1000);
    expect(w.allowances[0].remainingCents).toBe(3000); // muteerimata
  });
});
