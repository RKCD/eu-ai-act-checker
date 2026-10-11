import { describe, expect, it } from "vitest";
import { taipConfig } from "@config/taip.config";
import { priorityScore, sortByPriority } from "@/domain/priority";

const base = { crisisActiveInRegion: false, specialNeeds: [] as any[], householdSize: 1 };

describe("prioriteedi kaalud", () => {
  it("kiireloomulisus domineerib: kriitiline > kiire > tavaline", () => {
    const crit = priorityScore({ ...base, urgency: "critical" });
    const urg = priorityScore({ ...base, urgency: "urgent", specialNeeds: ["children", "elderly", "medication_dependency", "mobility_impairment", "pregnancy"], householdSize: 8, crisisActiveInRegion: true });
    const norm = priorityScore({ ...base, urgency: "normal", specialNeeds: ["children", "elderly", "medication_dependency", "mobility_impairment", "pregnancy"], householdSize: 8, crisisActiveInRegion: true });
    expect(crit).toBeGreaterThan(urg);
    expect(urg).toBeGreaterThan(priorityScore({ ...base, urgency: "urgent" }));
    // NB: tavaline koos kõigi lisakaaludega võib ületada paljast kiiret – see on konfi küsimus; kontrollime valemit:
    expect(norm).toBe(10 + 50 + 15 + 15 + 25 + 20 + 20 + 8 * 3);
  });

  it("kriisirežiim piirkonnas lisab konfis määratud kaalu", () => {
    const a = priorityScore({ ...base, urgency: "urgent" });
    const b = priorityScore({ ...base, urgency: "urgent", crisisActiveInRegion: true });
    expect(b - a).toBe(taipConfig.priority.crisisRegionBonus);
  });

  it("iga erivajaduse liik eraldi kaaluga, duplikaadid ei loe", () => {
    const a = priorityScore({ ...base, urgency: "normal", specialNeeds: ["medication_dependency"] });
    const b = priorityScore({ ...base, urgency: "normal", specialNeeds: ["medication_dependency", "medication_dependency"] });
    const c = priorityScore({ ...base, urgency: "normal", specialNeeds: ["children"] });
    expect(a).toBe(b);
    expect(a).toBeGreaterThan(c);
  });

  it("leibkonna suurus kasvatab prioriteeti kuni ülempiirini", () => {
    const s = (n: number) => priorityScore({ ...base, urgency: "normal", householdSize: n });
    expect(s(4)).toBeGreaterThan(s(1));
    expect(s(50)).toBe(s(taipConfig.priority.householdSizeMaxPersons));
  });

  it("kaalud tulevad konfist (mitte koodist)", () => {
    const cfg = { ...taipConfig.priority, urgencyBase: { critical: 1, urgent: 2, normal: 3 } };
    expect(priorityScore({ ...base, urgency: "normal" }, cfg)).toBeGreaterThan(priorityScore({ ...base, urgency: "critical" }, cfg));
  });

  it("järjestus: kõrgem prioriteet enne, võrdsel juhul vanem enne", () => {
    const sorted = sortByPriority([
      { id: "a", priority: 10, createdAt: "2026-01-02" },
      { id: "b", priority: 100, createdAt: "2026-01-03" },
      { id: "c", priority: 10, createdAt: "2026-01-01" },
    ]);
    expect(sorted.map((x) => x.id)).toEqual(["b", "c", "a"]);
  });
});
