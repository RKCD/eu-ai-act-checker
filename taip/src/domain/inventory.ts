import { taipConfig, type InventoryTemplateItem } from "@config/taip.config";
import type { InventoryItem } from "./types";

export type ShoppingLine = { templateKey?: string; name: string; quantity: number; unit: string; query: string; reason: "expiring" | "missing" };

export function recommendedQuantity(t: InventoryTemplateItem, householdSize: number): number {
  return (t.perPerson ?? 0) * Math.max(1, householdSize) + (t.perHousehold ?? 0);
}

/** Soovituslik varu leibkonna suuruse järgi. */
export function templateFor(householdSize: number) {
  return taipConfig.inventory.template.map((t) => ({ ...t, recommended: recommendedQuantity(t, householdSize) }));
}

export function expiringItems(items: InventoryItem[], today: string, days = taipConfig.inventory.expiryReminderDays) {
  const limit = new Date(today + "T00:00:00Z");
  limit.setUTCDate(limit.getUTCDate() + days);
  const lim = limit.toISOString().slice(0, 10);
  return items.filter((i) => i.expiresAt && i.expiresAt <= lim);
}

/**
 * Täiendusnimekiri: aeguvad tooted asendatakse + puuduolevad kogused malli järgi.
 */
export function buildRestockList(items: InventoryItem[], householdSize: number, today: string): ShoppingLine[] {
  const lines: ShoppingLine[] = [];
  const expiring = new Set(expiringItems(items, today).map((i) => i.id));
  const tmpl = taipConfig.inventory.template;

  for (const i of items) {
    if (!expiring.has(i.id)) continue;
    const t = tmpl.find((x) => x.key === i.templateKey);
    lines.push({ templateKey: i.templateKey, name: i.name, quantity: i.quantity, unit: i.unit, query: t?.selverQuery ?? i.name, reason: "expiring" });
  }

  for (const t of tmpl) {
    const have = items
      .filter((i) => i.templateKey === t.key && !expiring.has(i.id))
      .reduce((s, i) => s + i.quantity, 0);
    const need = recommendedQuantity(t, householdSize) - have;
    const alreadyListed = lines.find((l) => l.templateKey === t.key);
    if (need > 0 && !alreadyListed) {
      lines.push({ templateKey: t.key, name: t.name, quantity: need, unit: t.unit, query: t.selverQuery, reason: "missing" });
    } else if (need > 0 && alreadyListed) {
      alreadyListed.quantity = Math.max(alreadyListed.quantity, need);
    }
  }
  return lines;
}
