"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { taipConfig, type Locale } from "@config/taip.config";
import { runAgentStep, type AgentTurn, type StructuredNeed } from "@/agent/agent";
import { structureUpgrade } from "@/agent/upgrade";
import type { Role, SpecialNeed, User } from "@/domain/types";
import { currentUser, service, SESSION_COOKIE } from "@/lib/session";
import { log } from "@/lib/log";

async function requireUser(...roles: Role[]): Promise<User> {
  const u = await currentUser();
  if (!u) redirect("/login");
  if (roles.length && !roles.includes(u.role)) redirect("/");
  return u;
}

/** Vormitoimingud: viga → tagasi samale lehele ?viga=… (ilma isikuandmeteta). */
async function formAction(path: string, fn: () => Promise<unknown> | unknown, okMsg?: string) {
  let target = path;
  try {
    await fn();
    if (okMsg) target = `${path}?ok=${encodeURIComponent(okMsg)}`;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Viga";
    log("form.error", { error: msg });
    target = `${path}?viga=${encodeURIComponent(msg)}`;
  }
  revalidatePath(path);
  redirect(target);
}

// ───────── sessioon ─────────

export async function loginAs(formData: FormData) {
  const id = String(formData.get("userId") ?? "");
  const u = service().user(id);
  if (!u) redirect("/login");
  const jar = await cookies();
  jar.set(SESSION_COOKIE, u.id, { httpOnly: true, sameSite: "lax", path: "/" });
  jar.delete("taip_locale");
  redirect("/");
}

export async function setLocale(formData: FormData) {
  const loc = String(formData.get("locale") ?? "et");
  if ((taipConfig.locales as readonly string[]).includes(loc)) {
    (await cookies()).set("taip_locale", loc, { sameSite: "lax", path: "/" });
  }
  redirect(String(formData.get("back") ?? "/"));
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}

// ───────── abivajaja voog ─────────

export async function agentStep(turns: AgentTurn[], locale: Locale) {
  const user = await requireUser("user");
  const h = service().householdOf(user);
  const safeTurns = turns.slice(0, 2 * taipConfig.agent.maxClarifyingQuestions + 1).map((t) => ({
    role: t.role === "assistant" ? ("assistant" as const) : ("user" as const),
    text: String(t.text).slice(0, 2000),
    questionKind: t.questionKind,
  }));
  const started = Date.now();
  const result = await runAgentStep(safeTurns, { locale, defaultHouseholdSize: h.size, defaultSpecialNeeds: h.specialNeeds });
  log("agent.step", { step: safeTurns.length, status: result.kind, durationMs: Date.now() - started });
  return result;
}

export async function confirmNeed(input: StructuredNeed & { healthConsent: boolean; healthNotes?: string }) {
  const user = await requireUser("user");
  const svc = service();
  const need = svc.confirmNeed(user, {
    categories: input.categories,
    urgency: input.urgency,
    householdSize: input.householdSize,
    specialNeeds: input.specialNeeds as SpecialNeed[],
    summary: input.summary,
    healthConsent: !!input.healthConsent,
    healthNotes: input.healthNotes?.slice(0, 500),
  });
  const matches = svc.matchesFor(user, need.id).map((m) => ({
    offerId: m.offer.id,
    title: m.offer.title,
    description: m.offer.description,
    category: m.offer.category,
    partner: m.partner?.name ?? "",
    totalCents: m.totalCents,
    outOfPocketCents: m.outOfPocketCents,
    payment: m.payment.map((p) => ({ source: p.source, amountCents: p.amountCents })),
    viaRedCross: !!m.offer.viaRedCross,
    rank: m.rank,
  }));
  return { needId: need.id, status: need.status, matches };
}

export async function chooseMatch(needId: string, offerId: string) {
  const user = await requireUser("user");
  try {
    const r = await service().selectMatch(user, needId, offerId);
    revalidatePath("/rahakott");
    return { ok: true as const, via: r.delivery.via, bookingId: r.booking?.id, orderTotal: r.order?.totalCents ?? 0 };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Viga" };
  }
}

// ───────── rahakott ─────────

export async function topUp(formData: FormData) {
  const user = await requireUser("user");
  await formAction("/rahakott", () => service().topUpReserve(user, Number(formData.get("amount"))), "Reserv täiendatud (test mode)");
}

// ───────── varud ─────────

export async function addItem(formData: FormData) {
  const user = await requireUser("user");
  await formAction("/varud", () =>
    service().addInventoryItem(user, {
      name: String(formData.get("name") ?? ""),
      quantity: Number(formData.get("quantity")),
      unit: String(formData.get("unit") ?? "tk"),
      expiresAt: String(formData.get("expiresAt") ?? "") || undefined,
      templateKey: String(formData.get("templateKey") ?? "") || undefined,
    }),
  );
}

export async function removeItem(formData: FormData) {
  const user = await requireUser("user");
  await formAction("/varud", () => service().removeInventoryItem(user, String(formData.get("id"))));
}

export async function restockOrder() {
  const user = await requireUser("user");
  await formAction("/varud", () => service().restock(user, "order"), "Täiendustellimus edastatud e-Selveri adapterisse (mock)");
}

// ───────── varjumine ─────────

export async function setPlan(formData: FormData) {
  const user = await requireUser("user");
  const id = String(formData.get("shelterId") ?? "");
  await formAction("/varjumine", () => service().setShelterPlan(user, id || null), id ? "Lisatud sinu varjumisplaani" : undefined);
}

export async function bookCrisis(formData: FormData) {
  const user = await requireUser("user");
  await formAction("/varjumine", () => service().bookCrisisShelter(user, String(formData.get("shelterId")), Number(formData.get("people"))), "Koht broneeritud");
}

export async function bookTwoNights(formData: FormData) {
  const user = await requireUser("user");
  await formAction(
    "/varjumine",
    () => service().bookTwoNights(user, String(formData.get("shelterId")), String(formData.get("from")), Number(formData.get("people"))),
    "Broneering ootab partneri kinnitust",
  );
}

export async function cancelBooking(formData: FormData) {
  const user = await requireUser("user");
  await formAction("/varjumine", () => service().cancelBooking(user, String(formData.get("bookingId"))), "Broneering tühistatud");
}

// ───────── upgrade ─────────

export async function sendUpgrade(formData: FormData) {
  const user = await requireUser("user");
  const description = String(formData.get("description") ?? "").slice(0, 2000);
  await formAction("/upgrade", async () => {
    if (description.trim().length < 10) throw new Error("Kirjelda ruumi veidi täpsemalt");
    const s = await structureUpgrade(description);
    const r = await service().createUpgradeRequest(user, {
      spaceType: (String(formData.get("spaceType") || s.spaceType) as "basement"),
      description,
      dimensions: String(formData.get("dimensions") ?? "") || s.dimensions,
      needs: {
        ventilation: formData.get("ventilation") === "on" || s.needs.ventilation,
        heating: formData.get("heating") === "on" || s.needs.heating,
        water: formData.get("water") === "on" || s.needs.water,
        comms: formData.get("comms") === "on" || s.needs.comms,
      },
    });
    return r;
  }, "Päring edastatud tehnopartnerile");
}

// ───────── Punane Rist / partner ─────────

export async function takeNeed(formData: FormData) {
  const user = await requireUser("redcross");
  await formAction("/punane-rist", () => service().takeIntoWork(user, String(formData.get("needId"))));
}

export async function resolveNeed(formData: FormData) {
  const user = await requireUser("redcross", "partner");
  const path = user.role === "redcross" ? "/punane-rist" : "/partner";
  await formAction(path, () => service().setNeedStatus(user, String(formData.get("needId")), "resolved"));
}

export async function confirmBooking(formData: FormData) {
  const user = await requireUser("partner", "admin");
  await formAction("/partner", () => service().partnerConfirmBooking(user, String(formData.get("bookingId"))), "Broneering kinnitatud");
}

// ───────── admin ─────────

export async function requestCrisis(formData: FormData) {
  const user = await requireUser("admin");
  await formAction("/admin", () =>
    service().requestCrisis(user, {
      regionId: String(formData.get("regionId")),
      title: String(formData.get("title") ?? ""),
      officialSource: String(formData.get("officialSource") ?? ""),
    }), "Kriis ootab teise admini kinnitust");
}

export async function approveCrisis(formData: FormData) {
  const user = await requireUser("admin");
  await formAction("/admin", () => service().approveCrisis(user, String(formData.get("crisisId"))));
}

export async function endCrisis(formData: FormData) {
  const user = await requireUser("admin");
  await formAction("/admin", () => service().endCrisis(user, String(formData.get("crisisId"))), "Kriis lõpetatud, jääk naasis fondi");
}

export async function deposit(formData: FormData) {
  const user = await requireUser("admin");
  await formAction("/admin", () =>
    service().fundDeposit(
      user,
      String(formData.get("type")) as "donation",
      Math.round(Number(formData.get("amountEur")) * 100),
      String(formData.get("note") ?? ""),
    ), "Sissemakse lisatud");
}
