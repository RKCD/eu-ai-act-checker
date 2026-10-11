import type { Category, CrisisAllowance, PaymentPart } from "./types";

export class PaymentError extends Error {}

export type WalletState = {
  /** Leibkonna aktiivsed kriisisaldod (võib olla mitu, kui kattuvad kriisid). */
  allowances: CrisisAllowance[];
  personalReserveCents: number;
};

/**
 * Maksete järjekord: kriisisaldo → isiklik reserv → otsemakse.
 *
 * Kriisisaldot kasutatakse AINULT lubatud kategooriates. Kui kategooria pole
 * lubatud, jäetakse kriisisaldo vahele (sellega ei saa maksta).
 */
export function planPayment(totalCents: number, category: Category, wallet: WalletState): PaymentPart[] {
  if (!Number.isInteger(totalCents) || totalCents < 0) throw new PaymentError("Vigane summa");
  const parts: PaymentPart[] = [];
  let left = totalCents;

  for (const a of wallet.allowances) {
    if (left === 0) break;
    if (a.status !== "active" || a.remainingCents <= 0) continue;
    if (!a.allowedCategories.includes(category)) continue;
    const take = Math.min(left, a.remainingCents);
    parts.push({ source: "crisis_allowance", amountCents: take, allowanceId: a.id });
    left -= take;
  }

  if (left > 0 && wallet.personalReserveCents > 0) {
    const take = Math.min(left, wallet.personalReserveCents);
    parts.push({ source: "personal_reserve", amountCents: take });
    left -= take;
  }

  if (left > 0) parts.push({ source: "direct", amountCents: left });
  return parts;
}

/** Kas kriisisaldot tohib selles kategoorias kasutada? */
export function allowanceCovers(a: CrisisAllowance, category: Category): boolean {
  return a.status === "active" && a.allowedCategories.includes(category);
}

/** Rakendab makseplaani rahakotile (muteerimata – tagastab uue oleku). */
export function applyPayment(wallet: WalletState, parts: PaymentPart[], category: Category): WalletState {
  const allowances = wallet.allowances.map((a) => ({ ...a }));
  let reserve = wallet.personalReserveCents;
  for (const p of parts) {
    if (p.source === "crisis_allowance") {
      const a = allowances.find((x) => x.id === p.allowanceId);
      if (!a || !allowanceCovers(a, category)) throw new PaymentError("Kriisisaldot ei saa selles kategoorias kasutada");
      if (a.remainingCents < p.amountCents) throw new PaymentError("Kriisisaldo ei ole piisav");
      a.remainingCents -= p.amountCents;
    } else if (p.source === "personal_reserve") {
      if (reserve < p.amountCents) throw new PaymentError("Isiklik reserv ei ole piisav");
      reserve -= p.amountCents;
    }
  }
  return { allowances, personalReserveCents: reserve };
}
