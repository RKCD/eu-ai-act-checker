import { taipConfig } from "@config/taip.config";
import { isWithin } from "@config/regions";
import type { Category, Need, Offer, PaymentPart, Partner } from "./types";
import { planPayment, type WalletState } from "./wallet";

export type RankedMatch = {
  offer: Offer;
  partner?: Partner;
  totalCents: number;
  payment: PaymentPart[];
  /** Kui palju kasutaja ise peab maksma (otsemakse). */
  outOfPocketCents: number;
  rank: number;
};

/**
 * Järjestab vasted:
 *  1. kriisirežiimis tõusevad konfis määratud kategooriad (varjumine, toit) esikohale;
 *  2. kasutaja enda kategooriate järjekord;
 *  3. omavalitsuse-täpne vaste enne maakonna-vastet;
 *  4. väiksem omaosalus enne.
 */
export function rankOffers(params: {
  need: Pick<Need, "categories" | "regionId" | "householdSize">;
  offers: Offer[];
  partners: Partner[];
  crisisActive: boolean;
  wallet: WalletState;
}): RankedMatch[] {
  const { need, offers, partners, crisisActive, wallet } = params;
  const wanted = new Set<Category>(need.categories);
  const prioCats = crisisActive ? taipConfig.crisisPriorityCategories : [];

  const catRank = (c: Category) => {
    const p = prioCats.indexOf(c);
    if (p >= 0) return p;
    const u = need.categories.indexOf(c);
    return prioCats.length + (u >= 0 ? u : 99);
  };

  const candidates = offers.filter(
    (o) =>
      wanted.has(o.category) &&
      (crisisActive || !o.crisisOnly) &&
      o.regionIds.some((r) => isWithin(need.regionId, r)),
  );

  const scored = candidates.map((offer) => {
    const totalCents = offer.priceCents;
    const payment = planPayment(totalCents, offer.category, wallet);
    const outOfPocketCents = payment.filter((p) => p.source === "direct").reduce((s, p) => s + p.amountCents, 0);
    const exactRegion = offer.regionIds.includes(need.regionId) ? 0 : 1;
    return {
      offer,
      partner: partners.find((p) => p.id === offer.partnerId),
      totalCents,
      payment,
      outOfPocketCents,
      key: [catRank(offer.category), exactRegion, outOfPocketCents, totalCents] as number[],
    };
  });

  scored.sort((a, b) => {
    for (let i = 0; i < a.key.length; i++) if (a.key[i] !== b.key[i]) return a.key[i] - b.key[i];
    return a.offer.id.localeCompare(b.offer.id);
  });

  return scored.map(({ key: _k, ...m }, i) => ({ ...m, rank: i + 1 }));
}
