import { taipConfig, type TaipConfig } from "@config/taip.config";
import { countyOf, isWithin } from "@config/regions";
import type { Crisis, CrisisAllowance, FundEntry, Household } from "./types";

export class CrisisError extends Error {}

/** Kas kriis katab antud omavalitsuse (kriis võib olla maakonnal või omavalitsusel)? */
export function crisisCoversRegion(crisis: Crisis, regionId: string): boolean {
  return crisis.status === "active" && isWithin(regionId, crisis.regionId);
}

export function activeCrisesFor(crises: Crisis[], regionId: string): Crisis[] {
  return crises.filter((c) => crisisCoversRegion(c, regionId));
}

/**
 * Admin lisab kinnituse. Kriis aktiveerub alles siis, kui on
 * `requiredApprovals` ERINEVAT admini (taotleja kinnitus loeb esimeseks).
 */
export function addApproval(
  crisis: Crisis,
  adminId: string,
  cfg: TaipConfig["crisis"] = taipConfig.crisis,
): { crisis: Crisis; activatedNow: boolean } {
  if (crisis.status !== "pending") throw new CrisisError("Kriis ei oota kinnitust");
  if (crisis.approvals.includes(adminId)) throw new CrisisError("Sama admin ei saa kinnitada kaks korda");
  const approvals = [...crisis.approvals, adminId];
  const activatedNow = approvals.length >= cfg.requiredApprovals;
  return {
    crisis: {
      ...crisis,
      approvals,
      status: activatedNow ? "active" : "pending",
      activatedAt: activatedNow ? new Date().toISOString() : undefined,
    },
    activatedNow,
  };
}

export function fundBalance(entries: FundEntry[]): number {
  return entries.reduce((s, e) => s + e.amountCents, 0);
}

export function allowanceAmountFor(household: Household, cfg: TaipConfig["crisis"] = taipConfig.crisis): number {
  return cfg.allowance.perHouseholdCents + cfg.allowance.perPersonCents * Math.max(1, household.size);
}

/**
 * Arvutab aktiveerimisel kriisisaldod piirkonna leibkondadele.
 * Kui fondis pole piisavalt raha, skaleeritakse kõik saldod proportsionaalselt
 * (kriisirežiim aktiveerub igal juhul – raha puudus ei tohi abi blokeerida).
 */
export function computeAllowances(
  crisis: Crisis,
  households: Household[],
  fundBalanceCents: number,
  cfg: TaipConfig["crisis"] = taipConfig.crisis,
  newId: () => string = () => crypto.randomUUID(),
): { allowances: CrisisAllowance[]; totalCents: number; scale: number } {
  const eligible = households.filter((h) => isWithin(h.regionId, crisis.regionId));
  const wanted = eligible.map((h) => allowanceAmountFor(h, cfg));
  const totalWanted = wanted.reduce((s, x) => s + x, 0);
  const scale = totalWanted === 0 ? 1 : Math.min(1, Math.max(0, fundBalanceCents) / totalWanted);
  const allowances = eligible.map<CrisisAllowance>((h, i) => {
    const cents = Math.floor(wanted[i] * scale);
    return {
      id: newId(),
      crisisId: crisis.id,
      householdId: h.id,
      grantedCents: cents,
      remainingCents: cents,
      allowedCategories: [...cfg.allowance.allowedCategories],
      status: "active",
    };
  });
  return { allowances, totalCents: allowances.reduce((s, a) => s + a.grantedCents, 0), scale };
}

/** Kriisi lõpus: saldod aeguvad, jääk naaseb fondi. */
export function expireAllowances(allowances: CrisisAllowance[], crisisId: string) {
  let returnedCents = 0;
  const updated = allowances.map((a) => {
    if (a.crisisId !== crisisId || a.status !== "active") return a;
    returnedCents += a.remainingCents;
    return { ...a, remainingCents: 0, status: "expired" as const };
  });
  return { allowances: updated, returnedCents };
}

export { countyOf };
