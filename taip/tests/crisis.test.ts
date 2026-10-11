import { describe, expect, it } from "vitest";
import { taipConfig } from "@config/taip.config";
import { fundBalance } from "@/domain/crisis";
import { activateCrisis, setup } from "./helpers";

describe("kriisirežiim ja reservfond", () => {
  it("aktiveerimine nõuab kahe ERINEVA admini kinnitust ja ametliku allika viidet", () => {
    const { svc, u } = setup();
    expect(() => svc.requestCrisis(u("u-admin1"), { regionId: "harju", title: "x", officialSource: "" })).toThrow();
    const c = svc.requestCrisis(u("u-admin1"), { regionId: "harju", title: "Torm", officialSource: "VV korraldus nr 123" });
    expect(c.status).toBe("pending");
    expect(() => svc.approveCrisis(u("u-admin1"), c.id)).toThrow(/kaks korda/);
    expect(() => svc.approveCrisis(u("u-mari"), c.id)).toThrow(/ligipääs/);
    expect(svc.approveCrisis(u("u-admin2"), c.id).status).toBe("active");
  });

  it("kõik sammud logitakse auditilogisse ilma isikuandmeteta", () => {
    const { svc, u, db } = setup();
    activateCrisis(svc, u, "harju");
    const actions = db.audit.map((a) => a.action);
    expect(actions).toEqual(expect.arrayContaining(["crisis.requested", "crisis.approved", "crisis.activated"]));
    expect(JSON.stringify(db.audit)).not.toMatch(/Mari|Tamme|Olga/);
  });

  it("Harjumaa kriis → Harjumaa kasutaja näeb saldot; Valgamaa kasutaja ei näe muutust", () => {
    const { svc, u } = setup();
    const before = svc.wallet("h-taavi");
    activateCrisis(svc, u, "harju");

    const mari = svc.wallet("h-mari");
    expect(mari.allowances).toHaveLength(1);
    const a = taipConfig.crisis.allowance;
    expect(mari.allowances[0].remainingCents).toBe(a.perHouseholdCents + 4 * a.perPersonCents);
    expect(svc.activeCrises("tallinn")).toHaveLength(1);

    expect(svc.wallet("h-taavi")).toEqual(before);
    expect(svc.activeCrises("valga-vald")).toHaveLength(0);
  });

  it("Harjumaa kriis → varjumine ja toit on Harjumaa kasutaja vastetes esikohal", () => {
    const { svc, u } = setup();
    const mari = u("u-mari");
    const need0 = svc.confirmNeed(mari, { categories: ["mental_health", "food", "shelter"], urgency: "urgent", householdSize: 4, specialNeeds: [], summary: "x", healthConsent: false });
    const beforeCats = svc.matchesFor(mari, need0.id).map((m) => m.offer.category);
    expect(beforeCats[0]).toBe("mental_health"); // tavaajal kasutaja enda järjekord

    activateCrisis(svc, u, "harju");
    const cats = svc.matchesFor(mari, need0.id).map((m) => m.offer.category);
    const isPrio = (c: string) => c === "shelter" || c === "food";
    const lastPrio = cats.map(isPrio).lastIndexOf(true);
    const firstOther = cats.findIndex((c) => !isPrio(c));
    expect(cats[0]).toBe("shelter");
    expect(lastPrio).toBeLessThan(firstOther);
    // avalik varjumiskoht ilmub ainult kriisi ajal
    expect(svc.matchesFor(mari, need0.id).some((m) => m.offer.crisisOnly)).toBe(true);
  });

  it("Valgamaa kasutaja tulemused ei muutu Harjumaa kriisist", () => {
    const { svc, u } = setup();
    const taavi = u("u-taavi");
    const n = svc.confirmNeed(taavi, { categories: ["heating", "food", "shelter"], urgency: "urgent", householdSize: 3, specialNeeds: [], summary: "x", healthConsent: false });
    const before = svc.matchesFor(taavi, n.id).map((m) => m.offer.id);
    activateCrisis(svc, u, "harju");
    expect(svc.matchesFor(taavi, n.id).map((m) => m.offer.id)).toEqual(before);
  });

  it("aktiveerimine tõstab piirkonna avatud päringute prioriteeti", () => {
    const { svc, u } = setup();
    const n = svc.confirmNeed(u("u-mari"), { categories: ["food"], urgency: "normal", householdSize: 4, specialNeeds: [], summary: "x", healthConsent: false });
    const p0 = n.priority;
    activateCrisis(svc, u, "harju");
    expect(n.priority).toBe(p0 + taipConfig.priority.crisisRegionBonus);
  });

  it("fondi pearaamat: eraldus väljamaksena, kriisi lõpus jääk naaseb fondi", async () => {
    const { svc, u, db } = setup();
    const start = fundBalance(db.fund);
    const c = activateCrisis(svc, u, "harju");
    const allocated = db.allowances.reduce((s, a) => s + a.grantedCents, 0);
    expect(allocated).toBeGreaterThan(0);
    expect(fundBalance(db.fund)).toBe(start - allocated);

    // Mari kulutab osa saldost toidule
    const mari = u("u-mari");
    const need = svc.confirmNeed(mari, { categories: ["food"], urgency: "urgent", householdSize: 4, specialNeeds: [], summary: "x", healthConsent: false });
    const { order } = await svc.selectMatch(mari, need.id, "o-selver-pakk");
    expect(order!.parts[0].source).toBe("crisis_allowance");
    const spent = order!.parts.filter((p) => p.source === "crisis_allowance").reduce((s, p) => s + p.amountCents, 0);

    const { returnedCents } = svc.endCrisis(u("u-admin1"), c.id);
    expect(returnedCents).toBe(allocated - spent);
    expect(fundBalance(db.fund)).toBe(start - spent);
    expect(svc.wallet("h-mari").allowances).toHaveLength(0);
    expect(db.allowances.every((a) => a.status === "expired" && a.remainingCents === 0)).toBe(true);
    expect(db.fund.at(-1)!.type).toBe("return");
  });

  it("kriisisaldoga ei saa maksta väljaspool lubatud kategooriaid (teenusekiht)", async () => {
    const { svc, u } = setup();
    activateCrisis(svc, u, "harju");
    const mari = u("u-mari");
    const need = svc.confirmNeed(mari, { categories: ["mental_health"], urgency: "normal", householdSize: 4, specialNeeds: [], summary: "x", healthConsent: false });
    const { order } = await svc.selectMatch(mari, need.id, "o-teraapia-tasuline");
    expect(order!.parts.map((p) => p.source)).not.toContain("crisis_allowance");
  });

  it("fondi puudujäägi korral skaleeritakse saldod, kriis aktiveerub siiski", () => {
    const { svc, u, db } = setup();
    db.fund = [{ id: "f", type: "donation", amountCents: 10000, note: "", at: "", actorId: "u-admin1" }];
    activateCrisis(svc, u, "harju");
    const total = db.allowances.reduce((s, a) => s + a.grantedCents, 0);
    expect(total).toBeLessThanOrEqual(10000);
    expect(fundBalance(db.fund)).toBeGreaterThanOrEqual(0);
  });

  it("omavalitsuse kriis ei mõjuta sama maakonna teisi omavalitsusi", () => {
    const { svc, u } = setup();
    activateCrisis(svc, u, "tallinn");
    expect(svc.wallet("h-mari").allowances).toHaveLength(1);
    expect(svc.wallet("h-olga").allowances).toHaveLength(0); // Viimsi
  });
});
