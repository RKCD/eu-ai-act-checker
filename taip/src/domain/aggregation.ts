import { taipConfig } from "@config/taip.config";
import { isWithin } from "@config/regions";
import type { Category, Need, Urgency } from "./types";

export type AggregateCell = {
  regionId: string;
  category: Category;
  urgency: Urgency;
  /** null = peidetud (alla k-anonüümsuse läve). */
  count: number | null;
};

export type DailyPoint = { date: string; count: number };

/**
 * Agregeeritud, anonüümitud vaade. Sisendiks on ainult vajaduse struktuursed väljad;
 * väljundis ei ole ühtegi isiku- ega leibkonnatunnust.
 */
export function aggregateNeeds(needs: Pick<Need, "regionId" | "categories" | "urgency" | "createdAt">[], scopeRegionId: string, minCell = taipConfig.needsMap.minCellSize) {
  const scoped = needs.filter((n) => isWithin(n.regionId, scopeRegionId));
  const map = new Map<string, AggregateCell>();
  for (const n of scoped) {
    for (const c of n.categories) {
      const key = `${n.regionId}|${c}|${n.urgency}`;
      const cell = map.get(key) ?? { regionId: n.regionId, category: c, urgency: n.urgency, count: 0 };
      cell.count = (cell.count ?? 0) + 1;
      map.set(key, cell);
    }
  }
  const cells = [...map.values()].map((c) => ({ ...c, count: (c.count ?? 0) < minCell ? null : c.count }));

  const byDay = new Map<string, number>();
  for (const n of scoped) byDay.set(n.createdAt.slice(0, 10), (byDay.get(n.createdAt.slice(0, 10)) ?? 0) + 1);
  const daily: DailyPoint[] = [...byDay.entries()].sort().map(([date, count]) => ({ date, count }));

  const byRegion = new Map<string, { total: number; critical: number; urgent: number }>();
  for (const n of scoped) {
    const r = byRegion.get(n.regionId) ?? { total: 0, critical: 0, urgent: 0 };
    r.total++;
    if (n.urgency === "critical") r.critical++;
    if (n.urgency === "urgent") r.urgent++;
    byRegion.set(n.regionId, r);
  }
  const regions = [...byRegion.entries()].map(([regionId, v]) => ({
    regionId,
    total: v.total < minCell ? null : v.total,
    critical: v.critical,
    urgent: v.urgent,
  })).map((r) => (r.total === null ? { ...r, critical: null, urgent: null } : r));

  return { total: scoped.length, cells, daily, regions };
}

export function toCsv(cells: AggregateCell[], regionName: (id: string) => string): string {
  const rows = [["piirkond", "kategooria", "kiireloomulisus", "arv"]];
  for (const c of cells) rows.push([regionName(c.regionId), c.category, c.urgency, c.count === null ? `<${taipConfig.needsMap.minCellSize}` : String(c.count)]);
  return rows.map((r) => r.map((v) => `"${v.replaceAll('"', '""')}"`).join(",")).join("\n");
}
