/**
 * Piirkonnad: maakonnad ja (MVP-s osa) omavalitsusi.
 * Kasutaja asukoht on alati omavalitsus; kriisi saab välja kuulutada
 * kas maakonnale või omavalitsusele.
 */

export type RegionKind = "county" | "municipality";

export type Region = {
  id: string;
  name: string;
  kind: RegionKind;
  /** Omavalitsuse maakond. */
  parentId?: string;
  /** Ligikaudne keskpunkt kaardi jaoks. */
  lat: number;
  lng: number;
};

export const REGIONS: Region[] = [
  { id: "harju", name: "Harjumaa", kind: "county", lat: 59.33, lng: 24.75 },
  { id: "hiiu", name: "Hiiumaa", kind: "county", lat: 58.92, lng: 22.6 },
  { id: "ida-viru", name: "Ida-Virumaa", kind: "county", lat: 59.2, lng: 27.4 },
  { id: "jogeva", name: "Jõgevamaa", kind: "county", lat: 58.75, lng: 26.4 },
  { id: "jarva", name: "Järvamaa", kind: "county", lat: 58.88, lng: 25.57 },
  { id: "laane", name: "Läänemaa", kind: "county", lat: 58.95, lng: 23.75 },
  { id: "laane-viru", name: "Lääne-Virumaa", kind: "county", lat: 59.25, lng: 26.35 },
  { id: "polva", name: "Põlvamaa", kind: "county", lat: 58.06, lng: 27.07 },
  { id: "parnu", name: "Pärnumaa", kind: "county", lat: 58.38, lng: 24.5 },
  { id: "rapla", name: "Raplamaa", kind: "county", lat: 58.99, lng: 24.79 },
  { id: "saare", name: "Saaremaa", kind: "county", lat: 58.4, lng: 22.5 },
  { id: "tartu", name: "Tartumaa", kind: "county", lat: 58.38, lng: 26.72 },
  { id: "valga", name: "Valgamaa", kind: "county", lat: 57.9, lng: 26.1 },
  { id: "viljandi", name: "Viljandimaa", kind: "county", lat: 58.36, lng: 25.6 },
  { id: "voru", name: "Võrumaa", kind: "county", lat: 57.83, lng: 27.0 },

  { id: "tallinn", name: "Tallinn", kind: "municipality", parentId: "harju", lat: 59.437, lng: 24.745 },
  { id: "viimsi", name: "Viimsi vald", kind: "municipality", parentId: "harju", lat: 59.5, lng: 24.83 },
  { id: "harku", name: "Harku vald", kind: "municipality", parentId: "harju", lat: 59.39, lng: 24.57 },
  { id: "valga-vald", name: "Valga vald", kind: "municipality", parentId: "valga", lat: 57.78, lng: 26.05 },
  { id: "otepaa", name: "Otepää vald", kind: "municipality", parentId: "valga", lat: 58.06, lng: 26.5 },
  { id: "tartu-linn", name: "Tartu linn", kind: "municipality", parentId: "tartu", lat: 58.378, lng: 26.729 },
];

const byId = new Map(REGIONS.map((r) => [r.id, r]));

export function getRegion(id: string): Region | undefined {
  return byId.get(id);
}

export function countyOf(regionId: string): string | undefined {
  const r = byId.get(regionId);
  if (!r) return undefined;
  return r.kind === "county" ? r.id : r.parentId;
}

/**
 * Kas piirkond `regionId` asub piirkonnas `scopeId`?
 * (Sama piirkond või omavalitsus maakonna sees.)
 */
export function isWithin(regionId: string, scopeId: string): boolean {
  if (regionId === scopeId) return true;
  const r = byId.get(regionId);
  return !!r && r.kind === "municipality" && r.parentId === scopeId;
}
