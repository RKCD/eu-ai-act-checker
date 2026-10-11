import { describe, expect, it } from "vitest";
import { AccessError } from "@/domain/access";
import { setup } from "./helpers";

describe("õigused (rakenduse kiht, peegeldab RLS-i)", () => {
  it("KOV kriisijuht näeb ainult oma piirkonna agregeeritud andmeid", () => {
    const { svc, u } = setup({ withDemoNeeds: true });
    const harju = svc.needsMap(u("u-kov-harju"));
    expect(harju.scope).toBe("harju");
    expect(harju.regions.every((r) => ["harju", "tallinn", "viimsi", "harku"].includes(r.regionId))).toBe(true);

    // Valgamaa juht küsib Harjumaad → saab ikkagi ainult Valgamaa
    const valga = svc.needsMap(u("u-kov-valga"), "harju");
    expect(valga.scope).toBe("valga");
    expect(valga.regions.every((r) => ["valga", "valga-vald", "otepaa"].includes(r.regionId))).toBe(true);

    // Harju juht võib kitsendada oma omavalitsusele
    expect(svc.needsMap(u("u-kov-harju"), "tallinn").scope).toBe("tallinn");
  });

  it("agregaadis pole isikuandmeid ning väikesed lahtrid on peidetud", () => {
    const { svc, u } = setup({ withDemoNeeds: true });
    const m = svc.needsMap(u("u-kov-harju"));
    const json = JSON.stringify(m);
    expect(json).not.toMatch(/userId|householdId|summary|anon-/);
    for (const c of m.cells) expect(c.count === null || c.count >= 3).toBe(true);
  });

  it("tavakasutaja ega partner ei näe vajaduste kaarti", () => {
    const { svc, u } = setup();
    expect(() => svc.needsMap(u("u-mari"))).toThrow(AccessError);
    expect(() => svc.needsMap(u("u-p-toit"))).toThrow(AccessError);
  });

  it("isikuandmeid näeb ainult see partner, kellele päring on suunatud – ja ainult miinimumi", async () => {
    const { svc, u } = setup();
    const mari = u("u-mari");
    const n = svc.confirmNeed(mari, {
      categories: ["food"], urgency: "urgent", householdSize: 4, specialNeeds: ["children", "mobility_impairment"],
      summary: "Toit otsas", healthConsent: true, healthNotes: "ratastool",
    });
    await svc.selectMatch(mari, n.id, "o-toiduabi");
    const inbox = svc.partnerInbox(u("u-p-toit"));
    expect(inbox).toHaveLength(1);
    expect(inbox[0]).toEqual({
      id: n.id, categories: ["food"], urgency: "urgent", regionId: "tallinn", householdSize: 4, summary: "Toit otsas", accessibleNeeded: true,
    });
    expect(JSON.stringify(inbox)).not.toMatch(/ratastool|u-mari|h-mari|mobility/);

    // Punane Rist ei näe partnerile suunatud päringut
    expect(svc.redCrossQueue(u("u-pr")).find((x) => x.id === n.id)).toBeUndefined();
    expect(() => svc.takeIntoWork(u("u-pr"), n.id)).toThrow(AccessError);
    // teine kasutaja ei näe
    expect(() => svc.getOwnNeed(u("u-taavi"), n.id)).toThrow(AccessError);
  });

  it("terviseandmed salvestatakse ainult nõusolekul, eraldi ja krüpteeritult", () => {
    const { svc, u, db } = setup();
    const mari = u("u-mari");
    const without = svc.confirmNeed(mari, { categories: ["medical"], urgency: "urgent", householdSize: 1, specialNeeds: ["medication_dependency"], summary: "x", healthConsent: false, healthNotes: "insuliin" });
    expect(without.hasHealthDetails).toBe(false);
    expect(without.specialNeeds).not.toContain("medication_dependency");
    expect(db.healthDetails).toHaveLength(0);

    const withC = svc.confirmNeed(mari, { categories: ["medical"], urgency: "urgent", householdSize: 1, specialNeeds: ["medication_dependency"], summary: "x", healthConsent: true, healthNotes: "insuliin" });
    expect(withC.hasHealthDetails).toBe(true);
    expect(withC.priority).toBeGreaterThan(without.priority);
    expect(db.healthDetails).toHaveLength(1);
    expect(db.healthDetails[0].ciphertext).not.toMatch(/insuliin/);
    expect(JSON.stringify(db.needs)).not.toMatch(/insuliin|medication_dependency/);
  });

  it("Punase Risti järjekord on sorteeritud prioriteedi järgi; 'võta töösse' lukustab operaatorile", () => {
    const { svc, u } = setup({ withDemoNeeds: true });
    const q = svc.redCrossQueue(u("u-pr"));
    expect(q.length).toBeGreaterThan(1);
    for (let i = 1; i < q.length; i++) expect(q[i - 1].priority).toBeGreaterThanOrEqual(q[i].priority);
    const taken = svc.takeIntoWork(u("u-pr"), q[0].id);
    expect(taken.status).toBe("in_progress");
    expect(taken.assignedOperatorId).toBe("u-pr");
  });

  it("ainult admin saab kriisi algatada ja fondi hallata", () => {
    const { svc, u } = setup();
    for (const id of ["u-mari", "u-kov-harju", "u-pr", "u-p-toit"]) {
      expect(() => svc.requestCrisis(u(id), { regionId: "harju", title: "x", officialSource: "VV korraldus" })).toThrow(AccessError);
      expect(() => svc.fundLedger(u(id))).toThrow(AccessError);
    }
  });
});
