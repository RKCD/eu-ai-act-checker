/**
 * Seemneandmed: fiktiivsed partnerid, varjumiskohad ja demokasutajad Harjumaal ja Valgamaal.
 * Kõik nimed ja kontaktid on väljamõeldud.
 */
import { taipConfig, type Category, type Urgency } from "@config/taip.config";
import type { FundEntry, Household, InventoryItem, Need, Offer, Partner, Shelter, User } from "@/domain/types";
import { priorityScore } from "@/domain/priority";

export const seedUsers = (): User[] => [
  { id: "u-mari", name: "Mari (Tallinn, pere)", role: "user", regionId: "tallinn", householdId: "h-mari", locale: "et" },
  { id: "u-olga", name: "Olga (Viimsi, eakas)", role: "user", regionId: "viimsi", householdId: "h-olga", locale: "ru" },
  { id: "u-taavi", name: "Taavi (Valga, maamaja)", role: "user", regionId: "valga-vald", householdId: "h-taavi", locale: "et" },
  { id: "u-firma", name: "OÜ Näidis (Harku, ettevõte)", role: "user", regionId: "harku", householdId: "h-firma", locale: "en" },
  { id: "u-kov-harju", name: "Harjumaa kriisijuht", role: "kov", regionId: "harju", locale: "et" },
  { id: "u-kov-valga", name: "Valgamaa kriisijuht", role: "kov", regionId: "valga", locale: "et" },
  { id: "u-pr", name: "Punase Risti operaator", role: "redcross", regionId: "harju", locale: "et" },
  { id: "u-p-toit", name: "Partner: Harju Toiduabi", role: "partner", regionId: "harju", partnerId: "p-toiduabi", locale: "et" },
  { id: "u-p-maamaja", name: "Partner: Otepää Metsamaja", role: "partner", regionId: "valga", partnerId: "p-maamaja", locale: "et" },
  { id: "u-admin1", name: "Admin Anu", role: "admin", regionId: "harju", locale: "et" },
  { id: "u-admin2", name: "Admin Peeter", role: "admin", regionId: "harju", locale: "et" },
];

export const seedHouseholds = (): Household[] => [
  { id: "h-mari", name: "Tamme pere", kind: "household", regionId: "tallinn", size: 4, specialNeeds: ["children"] },
  { id: "h-olga", name: "Olga leibkond", kind: "household", regionId: "viimsi", size: 1, specialNeeds: ["elderly"] },
  { id: "h-taavi", name: "Kase talu", kind: "household", regionId: "valga-vald", size: 3, specialNeeds: [] },
  { id: "h-firma", name: "OÜ Näidis", kind: "business", regionId: "harku", size: 12, specialNeeds: [] },
];

export const seedPartners = (): Partner[] => [
  { id: "p-selver", name: "e-Selver (mock)", kind: "food", regionIds: ["harju", "valga", "tartu"], contactEmail: "partner@example.ee" },
  { id: "p-toiduabi", name: "Harju Toiduabi MTÜ", kind: "food", regionIds: ["harju"], contactEmail: "toiduabi@example.ee" },
  { id: "p-redcross", name: "Eesti Punane Rist", kind: "other", regionIds: ["harju", "valga", "tartu"], contactEmail: "operaator@example.ee" },
  { id: "p-varjend-kesklinn", name: "Kesklinna Varjend OÜ", kind: "shelter", regionIds: ["tallinn"], contactEmail: "varjend@example.ee" },
  { id: "p-maamaja", name: "Otepää Metsamaja", kind: "accommodation", regionIds: ["valga"], contactEmail: "metsamaja@example.ee" },
  { id: "p-teraapia", name: "Rahu Teraapiakeskus", kind: "therapy", regionIds: ["harju", "valga"], contactEmail: "rahu@example.ee" },
  { id: "p-soojus", name: "Lõuna Soojus & Tehnika OÜ", kind: "contractor", regionIds: ["valga", "voru", "polva", "tartu"], contactEmail: "tehnika@example.ee" },
  { id: "p-harju-tehnika", name: "Harju Tehnosüsteemid OÜ", kind: "contractor", regionIds: ["harju"], contactEmail: "tehno@example.ee" },
];

export const seedShelters = (): Shelter[] => [
  {
    id: "s-kesklinn", name: "Kesklinna avalik varjumiskoht", kind: "public", regionId: "tallinn",
    address: "Näidise 1, Tallinn", lat: 59.436, lng: 24.75, capacity: 120,
    equipment: { heating: true, water: true, comms: true, accessible: true },
    contact: "+372 600 0000", validUntil: "2027-12-31",
  },
  {
    id: "s-viimsi-kool", name: "Viimsi kooli keldrivarjend", kind: "public", regionId: "viimsi",
    address: "Kooli tee 5, Viimsi", lat: 59.5, lng: 24.83, capacity: 60,
    equipment: { heating: true, water: true, comms: false, accessible: false },
    contact: "+372 600 0001", validUntil: "2027-06-30",
  },
  {
    id: "s-erakelder", name: "Kesklinna Varjend – erakelder", kind: "private", regionId: "tallinn", partnerId: "p-varjend-kesklinn",
    address: "Varjendi 3, Tallinn", lat: 59.43, lng: 24.76, capacity: 16,
    equipment: { heating: true, water: true, comms: true, accessible: false },
    contact: "varjend@example.ee", validUntil: "2027-12-31", twoNightsPriceCentsPerPerson: 3500,
  },
  {
    id: "s-valga-kultuurimaja", name: "Valga kultuurimaja varjumiskoht", kind: "public", regionId: "valga-vald",
    address: "Kesk 1, Valga", lat: 57.776, lng: 26.047, capacity: 80,
    equipment: { heating: true, water: true, comms: true, accessible: true },
    contact: "+372 600 0002", validUntil: "2027-12-31",
  },
  {
    id: "s-metsamaja", name: "Otepää Metsamaja (maamaja)", kind: "cottage", regionId: "otepaa", partnerId: "p-maamaja",
    address: "Metsa talu, Otepää vald", lat: 58.05, lng: 26.48, capacity: 10,
    equipment: { heating: true, water: true, comms: false, accessible: false },
    contact: "metsamaja@example.ee", validUntil: "2027-12-31", twoNightsPriceCentsPerPerson: 4500,
  },
];

export const seedOffers = (): Offer[] => [
  { id: "o-selver-pakk", partnerId: "p-selver", category: "food", title: "Toidupakk 3 päevaks (kojuvedu)", description: "Põhitoiduained leibkonnale, kohaletoimetamine 24 h jooksul.", priceCents: 3900, regionIds: ["harju", "valga"] },
  { id: "o-toiduabi", partnerId: "p-toiduabi", category: "food", title: "Tasuta toiduabi pakk", description: "Toidupank, järeletulek või vabatahtliku kohaletoimetamine.", priceCents: 0, regionIds: ["harju"] },
  { id: "o-pr-abi", partnerId: "p-redcross", category: "other", title: "Punase Risti abi (operaator võtab ühendust)", description: "Operaator vaatab päringu üle ja leiab sobiva abi.", priceCents: 0, regionIds: ["harju", "valga", "tartu"], viaRedCross: true },
  { id: "o-pr-toit", partnerId: "p-redcross", category: "food", title: "Punase Risti toiduabi", description: "Kriisiolukorras jagatav toiduabi.", priceCents: 0, regionIds: ["harju", "valga", "tartu"], viaRedCross: true },
  { id: "o-pr-shelter", partnerId: "p-redcross", category: "shelter", title: "Punase Risti ajutine majutus", description: "Operaator leiab ajutise peavarju.", priceCents: 0, regionIds: ["harju", "valga", "tartu"], viaRedCross: true },
  { id: "o-varjend-kesklinn", partnerId: "p-varjend-kesklinn", category: "shelter", title: "Koht erakeldris (öö)", description: "Köetud keldriruum, vesi ja side.", priceCents: 2500, regionIds: ["tallinn"], shelterId: "s-erakelder" },
  { id: "o-avalik-kesklinn", partnerId: "p-redcross", category: "shelter", title: "Avalik varjumiskoht – Kesklinn", description: "Tasuta avalik varjumiskoht.", priceCents: 0, regionIds: ["tallinn"], shelterId: "s-kesklinn", crisisOnly: true },
  { id: "o-avalik-valga", partnerId: "p-redcross", category: "shelter", title: "Avalik varjumiskoht – Valga kultuurimaja", description: "Tasuta avalik varjumiskoht.", priceCents: 0, regionIds: ["valga-vald"], shelterId: "s-valga-kultuurimaja", crisisOnly: true },
  { id: "o-metsamaja", partnerId: "p-maamaja", category: "accommodation", title: "Majutus maamajas (öö)", description: "Ahiküttega maamaja, kaev, saun.", priceCents: 4500, regionIds: ["valga"], shelterId: "s-metsamaja" },
  { id: "o-teraapia", partnerId: "p-teraapia", category: "mental_health", title: "Kriisinõustamine (45 min, veebis)", description: "Psühholoogiline esmaabi ja nõustamine.", priceCents: 0, regionIds: ["harju", "valga"] },
  { id: "o-teraapia-tasuline", partnerId: "p-teraapia", category: "mental_health", title: "Teraapiaseanss (60 min)", description: "Jätkuteraapia.", priceCents: 6000, regionIds: ["harju", "valga"] },
  { id: "o-apteek", partnerId: "p-selver", category: "medical", title: "Käsimüügiravimid ja esmaabi (kojuvedu)", description: "Ainult käsimüügitooted.", priceCents: 2500, regionIds: ["harju", "valga"] },
  { id: "o-kute", partnerId: "p-soojus", category: "heating", title: "Ajutine küttelahendus (õhksoojuspump/puhur)", description: "Tehnik tuleb 24–48 h jooksul.", priceCents: 9000, regionIds: ["valga"] },
  { id: "o-kute-harju", partnerId: "p-harju-tehnika", category: "heating", title: "Avariiküte (elektripuhur rent)", description: "Kohaletoimetamine samal päeval.", priceCents: 4000, regionIds: ["harju"] },
];

export const seedFund = (): FundEntry[] => [
  { id: "f-1", type: "state", amountCents: 2_000_000, note: "Riiklik valmisolekutoetus (näidis)", at: "2026-09-01T10:00:00Z", actorId: "u-admin1" },
  { id: "f-2", type: "kov", amountCents: 500_000, note: "Tallinna linna eraldis (näidis)", at: "2026-09-15T10:00:00Z", actorId: "u-admin1" },
  { id: "f-3", type: "donation", amountCents: 125_000, note: "Eraannetused", at: "2026-10-01T10:00:00Z", actorId: "u-admin2" },
];

export const seedInventory = (): InventoryItem[] => [
  { id: "i-1", householdId: "h-mari", name: "Joogivesi", templateKey: "water", quantity: 30, unit: "l", expiresAt: "2026-10-20" },
  { id: "i-2", householdId: "h-mari", name: "Konservid", templateKey: "canned", quantity: 20, unit: "tk", expiresAt: "2027-08-01" },
  { id: "i-3", householdId: "h-mari", name: "Patareid (AA)", templateKey: "batteries", quantity: 8, unit: "tk", expiresAt: "2029-01-01" },
  { id: "i-4", householdId: "h-taavi", name: "Joogivesi", templateKey: "water", quantity: 60, unit: "l", expiresAt: "2027-03-01" },
  { id: "i-5", householdId: "h-taavi", name: "Näkileib / kuivikud", templateKey: "crispbread", quantity: 3, unit: "pk", expiresAt: "2026-10-18" },
];

/** Anonüümsed näidispäringud vajaduste kaardi jaoks (ilma isikuandmeteta). */
export function seedDemoNeeds(now = new Date()): Need[] {
  const rows: [string, Category[], Urgency, number][] = [
    ["tallinn", ["food"], "urgent", 4], ["tallinn", ["food"], "normal", 2], ["tallinn", ["food"], "urgent", 3],
    ["tallinn", ["shelter"], "urgent", 2], ["tallinn", ["shelter"], "urgent", 1], ["tallinn", ["shelter"], "urgent", 5],
    ["tallinn", ["mental_health"], "normal", 1], ["tallinn", ["food"], "urgent", 1], ["viimsi", ["heating"], "urgent", 2],
    ["viimsi", ["food"], "normal", 1], ["viimsi", ["food"], "normal", 3], ["viimsi", ["food"], "normal", 2],
    ["harku", ["medical"], "urgent", 1], ["valga-vald", ["heating"], "urgent", 3], ["valga-vald", ["heating"], "urgent", 2],
    ["valga-vald", ["heating"], "urgent", 4], ["valga-vald", ["food"], "normal", 2], ["otepaa", ["accommodation"], "normal", 4],
  ];
  return rows.map(([regionId, categories, urgency, size], i) => {
    const created = new Date(now.getTime() - (i % 6) * 86_400_000 - i * 3_600_000);
    return {
      id: `n-demo-${i + 1}`,
      userId: `anon-${i + 1}`,
      householdId: `anon-h-${i + 1}`,
      regionId,
      categories,
      urgency,
      householdSize: size,
      specialNeeds: [],
      summary: "Näidispäring",
      priority: priorityScore({ urgency, crisisActiveInRegion: false, specialNeeds: [], householdSize: size }),
      status: i % 4 === 0 ? "routed" : "confirmed",
      routedTo: i % 4 === 0 ? { kind: "redcross", id: "p-redcross" } : undefined,
      createdAt: created.toISOString(),
      hasHealthDetails: false,
      accessibleNeeded: false,
    } satisfies Need;
  });
}

export const seedPersonalReserves = (): Record<string, number> => ({ "h-mari": 2000, "h-olga": 0, "h-taavi": 5000, "h-firma": 20000 });

export { taipConfig };
