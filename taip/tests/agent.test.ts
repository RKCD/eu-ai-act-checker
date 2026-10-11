import { describe, expect, it } from "vitest";
import { runAgentStep, type AgentTurn } from "@/agent/agent";
import { detectDangerSigns } from "@/domain/triage";
import { setup } from "./helpers";

const ctx = { locale: "et" as const, defaultHouseholdSize: 4, defaultSpecialNeeds: ["children" as const] };

async function converse(first: string, answers: string[]) {
  const turns: AgentTurn[] = [{ role: "user", text: first }];
  let steps = 0;
  for (;;) {
    steps++;
    const r = await runAgentStep(turns, ctx, { useLlm: false });
    if (r.kind !== "question") return { r, steps };
    turns.push({ role: "assistant", text: r.text, questionKind: r.questionKind });
    turns.push({ role: "user", text: answers.shift() ?? "ei tea" });
    if (steps > 10) throw new Error("lõputu vestlus");
  }
}

describe("ohumärgid → 112", () => {
  it.each([
    ["Mehel on tugev rinnavalu ja higistab"],
    ["Mu ema ei saa hingata"],
    ["Он потерял сознание"],
    ["I want to kill myself"],
    ["Вона без свідомості, допоможіть"],
    ["Ma ei taha enam elada"],
  ])("tuvastab: %s", async (text) => {
    expect(detectDangerSigns(text).length).toBeGreaterThan(0);
    const r = await runAgentStep([{ role: "user", text }], ctx, { useLlm: false });
    expect(r.kind).toBe("emergency");
  });

  it("ohumärk hilisemas vastuses peatab samuti voo", async () => {
    const { r } = await converse("Vajame abi", ["Tegelikult isal on rinnavalu"]);
    expect(r.kind).toBe("emergency");
  });

  it("ei anna valehäiret tavalisele toiduvajadusele", () => {
    expect(detectDangerSigns("Toit saab homme otsa, meil on 2 last")).toEqual([]);
  });

  it("kriitiline päring ei saa vasteid ega tellimusvoogu", async () => {
    const { svc, u } = setup();
    const mari = u("u-mari");
    const need = svc.confirmNeed(mari, { categories: ["medical"], urgency: "critical", householdSize: 1, specialNeeds: [], summary: "x", healthConsent: false });
    expect(need.status).toBe("emergency");
    expect(svc.matchesFor(mari, need.id)).toEqual([]);
    await expect(svc.selectMatch(mari, need.id, "o-apteek")).rejects.toThrow(/112/);
  });
});

describe("vabatekstist ≤ 3 sammuga kinnitatud vajadus", () => {
  it("selge kirjeldus → kokkuvõte kohe (1 samm)", async () => {
    const { r, steps } = await converse("Kodus pole elektrit ega sooja ja toit saab homme otsa", []);
    expect(steps).toBe(1);
    expect(r.kind).toBe("summary");
    if (r.kind === "summary") {
      expect(r.need.categories).toEqual(expect.arrayContaining(["food", "heating"]));
      expect(r.need.urgency).toBe("urgent");
    }
  });

  it("ebamäärane kirjeldus → täpsustused, kuid kokku ≤ 3 sammu", async () => {
    const { r, steps } = await converse("Vajame abi", ["toitu", "jah"]);
    expect(steps).toBeLessThanOrEqual(3);
    expect(r.kind).toBe("summary");
    if (r.kind === "summary") {
      expect(r.need.categories).toContain("food");
      expect(r.need.urgency).toBe("urgent");
    }
  });

  it("isegi kui vastused ei aita, tuleb kokkuvõte hiljemalt 3. küsimuse järel", async () => {
    const { r, steps } = await converse("hmm", ["?", "?", "?", "?"]);
    expect(r.kind).toBe("summary");
    expect(steps).toBeLessThanOrEqual(4);
  });

  it("mitmekeelne: vene ja ukraina", async () => {
    const ru = await runAgentStep([{ role: "user", text: "Сегодня нет отопления, очень холодно" }], { ...ctx, locale: "ru" }, { useLlm: false });
    expect(ru.kind === "summary" && ru.need.categories.includes("heating")).toBe(true);
    const uk = await runAgentStep([{ role: "user", text: "Нам потрібна їжа сьогодні" }], { ...ctx, locale: "uk" }, { useLlm: false });
    expect(uk.kind === "summary" && uk.need.categories.includes("food")).toBe(true);
  });

  it("kokkuvõte → kinnitus → järjestatud vasted hinna ja makseallikaga", async () => {
    const { svc, u } = setup();
    const { r } = await converse("Toit saab täna otsa", []);
    if (r.kind !== "summary") throw new Error("expected summary");
    const need = svc.confirmNeed(u("u-mari"), { ...r.need, healthConsent: false });
    const matches = svc.matchesFor(u("u-mari"), need.id);
    expect(matches.length).toBeGreaterThan(0);
    expect(matches.map((m) => m.rank)).toEqual(matches.map((_, i) => i + 1));
    for (const m of matches) {
      expect(m.payment.reduce((s, p) => s + p.amountCents, 0)).toBe(m.totalCents);
    }
    // tasuta abi enne tasulist samas kategoorias
    expect(matches[0].outOfPocketCents).toBe(0);
  });
});
