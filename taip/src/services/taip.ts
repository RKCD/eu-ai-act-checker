/**
 * Teenusekiht: kasutuslood, mis seovad domeeniloogika, andmekihi ja adapterid.
 * Iga avalik funktsioon kontrollib õigused (peegeldab RLS-i) ja logib ilma isikuandmeteta.
 */
import { HEALTH_SPECIAL_NEEDS, taipConfig } from "@config/taip.config";
import { getRegion, isWithin } from "@config/regions";
import { AccessError, canSeeAggregatesFor, canSeeNeedPersonalData, requireRole } from "@/domain/access";
import { aggregateNeeds } from "@/domain/aggregation";
import { addDays, assertCanBook, BookingError, freePlaces } from "@/domain/booking";
import { activeCrisesFor, addApproval, computeAllowances, CrisisError, expireAllowances, fundBalance } from "@/domain/crisis";
import { buildRestockList, expiringItems, templateFor } from "@/domain/inventory";
import { rankOffers } from "@/domain/matching";
import { priorityScore, sortByPriority } from "@/domain/priority";
import type {
  Booking, Category, Crisis, FundEntryType, Household, Need, Order, SpecialNeed, Urgency, UpgradeRequest, User,
} from "@/domain/types";
import { applyPayment, planPayment, type WalletState } from "@/domain/wallet";
import type { Db } from "@/data/db";
import { adapters as defaultAdapters } from "@/adapters/mock";
import type { MinimalNeedForPartner } from "@/adapters/types";
import { encryptHealth } from "@/lib/healthCrypto";
import { log } from "@/lib/log";

type Adapters = typeof defaultAdapters;

const now = () => new Date().toISOString();
const uid = (p: string) => `${p}-${crypto.randomUUID().slice(0, 8)}`;

export class TaipService {
  constructor(private db: Db, private adapters: Adapters = defaultAdapters) {}

  // ───────── kontekst ─────────

  user(id: string | undefined | null): User | null {
    return this.db.users.find((u) => u.id === id) ?? null;
  }

  householdOf(user: User): Household {
    const h = this.db.households.find((x) => x.id === user.householdId);
    if (!h) throw new AccessError("Kasutajal puudub leibkond");
    return h;
  }

  activeCrises(regionId: string): Crisis[] {
    return activeCrisesFor(this.db.crises, regionId);
  }

  wallet(householdId: string): WalletState {
    return {
      allowances: this.db.allowances.filter((a) => a.householdId === householdId && a.status === "active"),
      personalReserveCents: this.db.personalReserves[householdId] ?? 0,
    };
  }

  private audit(actorId: string, action: string, details: Record<string, string | number | boolean> = {}) {
    this.db.audit.push({ id: uid("a"), at: now(), actorId, action, details });
    log(action, details);
  }

  // ───────── 3.1 abivajaja voog ─────────

  /**
   * Kasutaja kinnitas agendi kokkuvõtte → salvestatakse struktureeritud vajadus.
   * Terviseandmed (art 9) salvestatakse ainult selgesõnalise nõusoleku korral,
   * eraldi ja krüpteeritult; ilma nõusolekuta need ära visatakse.
   */
  confirmNeed(
    user: User,
    input: {
      categories: Category[];
      urgency: Urgency;
      householdSize: number;
      specialNeeds: SpecialNeed[];
      summary: string;
      regionId?: string;
      healthConsent: boolean;
      healthNotes?: string;
    },
  ): Need {
    requireRole(user, "user");
    const household = this.householdOf(user);
    const regionId = input.regionId && getRegion(input.regionId) ? input.regionId : household.regionId;
    const healthNeeds = input.specialNeeds.filter((s) => HEALTH_SPECIAL_NEEDS.includes(s));
    const otherNeeds = input.specialNeeds.filter((s) => !HEALTH_SPECIAL_NEEDS.includes(s));
    const useHealth = input.healthConsent && (healthNeeds.length > 0 || !!input.healthNotes);
    const crisisActive = this.activeCrises(regionId).length > 0;

    const need: Need = {
      id: uid("n"),
      userId: user.id,
      householdId: household.id,
      regionId,
      categories: [...new Set(input.categories)],
      urgency: input.urgency,
      householdSize: Math.max(1, Math.round(input.householdSize || household.size)),
      specialNeeds: [...new Set(otherNeeds)],
      summary: input.summary.slice(0, 600),
      priority: priorityScore({
        urgency: input.urgency,
        crisisActiveInRegion: crisisActive,
        specialNeeds: [...otherNeeds, ...(useHealth ? healthNeeds : [])],
        householdSize: input.householdSize || household.size,
      }),
      status: input.urgency === "critical" ? "emergency" : "confirmed",
      createdAt: now(),
      hasHealthDetails: useHealth,
      accessibleNeeded: useHealth && healthNeeds.includes("mobility_impairment"),
    };
    this.db.needs.push(need);
    if (useHealth) {
      this.db.healthDetails.push({
        needId: need.id,
        consentAt: now(),
        ciphertext: encryptHealth({ specialNeeds: healthNeeds, notes: input.healthNotes ?? "" }),
      });
    }
    this.audit(user.id, "need.confirmed", { needId: need.id, urgency: need.urgency, regionId });
    return need;
  }

  getOwnNeed(user: User, needId: string): Need {
    const need = this.db.needs.find((n) => n.id === needId);
    if (!need || !canSeeNeedPersonalData(user, need)) throw new AccessError("Päringut ei leitud");
    return need;
  }

  matchesFor(user: User, needId: string) {
    const need = this.getOwnNeed(user, needId);
    if (need.urgency === "critical") return []; // 112 – tellimusvoogu ei pakuta
    return rankOffers({
      need,
      offers: this.db.offers,
      partners: this.db.partners,
      crisisActive: this.activeCrises(need.regionId).length > 0,
      wallet: this.wallet(need.householdId),
    });
  }

  /** Minimaalne andmestik partnerile – ainult broneeringuks/teenuseks vajalik. */
  private minimalForPartner(need: Need): MinimalNeedForPartner {
    // Diagnoosi ega terviseandmeid partnerile ei anta – ainult tuletatud ligipääsetavuse lipp.
    return {
      id: need.id, categories: need.categories, urgency: need.urgency, regionId: need.regionId,
      householdSize: need.householdSize, summary: need.summary, accessibleNeeded: need.accessibleNeeded,
    };
  }

  async selectMatch(user: User, needId: string, offerId: string) {
    const need = this.getOwnNeed(user, needId);
    if (need.urgency === "critical") throw new AccessError("Kriitilise olukorra korral helista 112");
    const offer = this.db.offers.find((o) => o.id === offerId);
    if (!offer || !need.categories.includes(offer.category)) throw new AccessError("Vastet ei leitud");

    let order: Order | undefined;
    let booking: Booking | undefined;

    const shelter = offer.shelterId ? this.db.shelters.find((s) => s.id === offer.shelterId) : undefined;
    if (shelter && this.activeCrises(shelter.regionId).length > 0) {
      booking = await this.bookCrisisShelter(user, shelter.id, need.householdSize, need.accessibleNeeded);
    }
    if (offer.priceCents > 0) {
      order = await this.pay(need.householdId, offer.priceCents, offer.category, offer.title, { needId: need.id, offerId: offer.id });
    }

    const target = offer.viaRedCross
      ? { kind: "redcross" as const, id: "p-redcross" }
      : { kind: "partner" as const, id: offer.partnerId };
    const delivery = await this.adapters.aid.forward(target, this.minimalForPartner(need));
    need.routedTo = target;
    need.status = "routed";
    this.audit(user.id, "need.routed", { needId: need.id, offerId: offer.id, partnerId: target.id });
    return { need, order, booking, delivery };
  }

  // ───────── maksed (3.2, 3.8) ─────────

  private async pay(householdId: string, totalCents: number, category: Category, description: string, refs: { needId?: string; offerId?: string } = {}): Promise<Order> {
    const wallet = this.wallet(householdId);
    const parts = planPayment(totalCents, category, wallet);
    const direct = parts.find((p) => p.source === "direct");
    let externalRef: string | undefined;
    if (direct) {
      const charge = await this.adapters.payments.charge({ amountCents: direct.amountCents, description, householdId });
      if (!charge.ok) throw new Error("Makse ebaõnnestus");
      externalRef = charge.ref;
    }
    const next = applyPayment(wallet, parts, category);
    for (const a of next.allowances) {
      const row = this.db.allowances.find((x) => x.id === a.id);
      if (row) row.remainingCents = a.remainingCents;
    }
    this.db.personalReserves[householdId] = next.personalReserveCents;
    const order: Order = {
      id: uid("o"), householdId, ...refs, category, description, totalCents, parts, status: "placed", createdAt: now(), externalRef,
    };
    this.db.orders.push(order);
    log("order.placed", { orderId: order.id, category, amountCents: totalCents });
    return order;
  }

  async topUpReserve(user: User, amountCents: number) {
    requireRole(user, "user");
    if (!taipConfig.wallet.reserveTopUpOptionsCents.includes(amountCents)) throw new Error("Vigane summa");
    const h = this.householdOf(user);
    const charge = await this.adapters.payments.charge({ amountCents, description: "Isikliku reservi täiendus", householdId: h.id });
    if (!charge.ok) throw new Error("Makse ebaõnnestus");
    this.db.personalReserves[h.id] = (this.db.personalReserves[h.id] ?? 0) + amountCents;
    this.audit(user.id, "wallet.topup", { amountCents });
    return this.db.personalReserves[h.id];
  }

  ordersOf(user: User) {
    const h = this.householdOf(user);
    return this.db.orders.filter((o) => o.householdId === h.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  // ───────── 3.2 kriisirežiim ja reservfond ─────────

  requestCrisis(admin: User, input: { regionId: string; title: string; officialSource: string }): Crisis {
    requireRole(admin, "admin");
    if (!getRegion(input.regionId)) throw new CrisisError("Tundmatu piirkond");
    if (input.officialSource.trim().length < 5) throw new CrisisError("Ametliku otsuse allikas on kohustuslik");
    if (this.db.crises.some((c) => c.regionId === input.regionId && c.status !== "ended"))
      throw new CrisisError("Sellel piirkonnal on juba avatud kriis");
    const crisis: Crisis = {
      id: uid("c"), regionId: input.regionId, title: input.title.trim(), officialSource: input.officialSource.trim(),
      status: "pending", requestedBy: admin.id, approvals: [admin.id], createdAt: now(),
    };
    this.db.crises.push(crisis);
    this.audit(admin.id, "crisis.requested", { crisisId: crisis.id, regionId: crisis.regionId });
    return crisis;
  }

  approveCrisis(admin: User, crisisId: string) {
    requireRole(admin, "admin");
    const idx = this.db.crises.findIndex((c) => c.id === crisisId);
    if (idx < 0) throw new CrisisError("Kriisi ei leitud");
    const { crisis, activatedNow } = addApproval(this.db.crises[idx], admin.id);
    this.db.crises[idx] = crisis;
    this.audit(admin.id, "crisis.approved", { crisisId, status: crisis.status });

    if (activatedNow) {
      const balance = fundBalance(this.db.fund);
      const { allowances, totalCents, scale } = computeAllowances(crisis, this.db.households, balance, taipConfig.crisis, () => uid("al"));
      this.db.allowances.push(...allowances);
      if (totalCents > 0) {
        this.db.fund.push({
          id: uid("f"), type: "allocation", amountCents: -totalCents, crisisId, at: now(), actorId: admin.id,
          note: `Kriisisaldod ${allowances.length} leibkonnale${scale < 1 ? ` (skaleeritud ${Math.round(scale * 100)}%)` : ""}`,
        });
      }
      // Piirkonna avatud päringute prioriteet tõuseb kriisi kaalu võrra.
      for (const n of this.db.needs) {
        if (isWithin(n.regionId, crisis.regionId) && n.status !== "resolved") n.priority += taipConfig.priority.crisisRegionBonus;
      }
      this.audit(admin.id, "crisis.activated", { crisisId, regionId: crisis.regionId, count: allowances.length, amountCents: totalCents });
    }
    return crisis;
  }

  endCrisis(admin: User, crisisId: string) {
    requireRole(admin, "admin");
    const crisis = this.db.crises.find((c) => c.id === crisisId);
    if (!crisis || crisis.status !== "active") throw new CrisisError("Aktiivset kriisi ei leitud");
    crisis.status = "ended";
    crisis.endedAt = now();
    const { allowances, returnedCents } = expireAllowances(this.db.allowances, crisisId);
    this.db.allowances = allowances;
    if (returnedCents > 0) {
      this.db.fund.push({ id: uid("f"), type: "return", amountCents: returnedCents, crisisId, at: now(), actorId: admin.id, note: "Kasutamata kriisisaldo jääk naasis fondi" });
    }
    for (const n of this.db.needs) {
      if (isWithin(n.regionId, crisis.regionId) && n.status !== "resolved")
        n.priority = Math.max(0, n.priority - taipConfig.priority.crisisRegionBonus);
    }
    this.audit(admin.id, "crisis.ended", { crisisId, amountCents: returnedCents });
    return { crisis, returnedCents };
  }

  fundDeposit(admin: User, type: Extract<FundEntryType, "donation" | "kov" | "state">, amountCents: number, note: string) {
    requireRole(admin, "admin");
    if (!Number.isInteger(amountCents) || amountCents <= 0) throw new Error("Summa peab olema positiivne");
    const entry = { id: uid("f"), type, amountCents, note: note.slice(0, 200), at: now(), actorId: admin.id };
    this.db.fund.push(entry);
    this.audit(admin.id, "fund.deposit", { amountCents });
    return entry;
  }

  fundLedger(admin: User) {
    requireRole(admin, "admin");
    return { entries: [...this.db.fund].sort((a, b) => b.at.localeCompare(a.at)), balanceCents: fundBalance(this.db.fund) };
  }

  // ───────── 3.3 vajaduste kaart, Punane Rist, partner ─────────

  needsMap(viewer: User, scopeRegionId?: string) {
    requireRole(viewer, "kov", "redcross", "admin");
    const scope = viewer.role === "kov" ? (scopeRegionId && isWithin(scopeRegionId, viewer.regionId) ? scopeRegionId : viewer.regionId) : (scopeRegionId ?? "");
    if (scope && !canSeeAggregatesFor(viewer, scope)) throw new AccessError("Puudub ligipääs sellele piirkonnale");
    const needs = this.db.needs;
    if (!scope) {
      // admin / Punane Rist ilma piiranguta.
      // Üle-eestiline vaade: agregeeri maakondade kaupa.
      const counties = [...new Set(needs.map((n) => getRegion(n.regionId)?.parentId ?? n.regionId))];
      const parts = counties.map((c) => aggregateNeeds(needs, c));
      return {
        scope: "EE",
        total: parts.reduce((s, p) => s + p.total, 0),
        cells: parts.flatMap((p) => p.cells),
        regions: parts.flatMap((p) => p.regions),
        daily: mergeDaily(parts.map((p) => p.daily)),
      };
    }
    return { scope, ...aggregateNeeds(needs, scope) };
  }

  redCrossQueue(op: User) {
    requireRole(op, "redcross");
    return sortByPriority(this.db.needs.filter((n) => n.routedTo?.kind === "redcross" && n.status !== "resolved"));
  }

  takeIntoWork(op: User, needId: string) {
    requireRole(op, "redcross");
    const need = this.db.needs.find((n) => n.id === needId);
    if (!need || !canSeeNeedPersonalData(op, need)) throw new AccessError("Päringut ei leitud");
    if (need.status === "in_progress" && need.assignedOperatorId !== op.id) throw new AccessError("Päring on juba teise operaatori töös");
    need.status = "in_progress";
    need.assignedOperatorId = op.id;
    this.audit(op.id, "need.taken", { needId });
    return need;
  }

  setNeedStatus(actor: User, needId: string, status: "in_progress" | "resolved" | "routed") {
    const need = this.db.needs.find((n) => n.id === needId);
    if (!need || !canSeeNeedPersonalData(actor, need) || actor.role === "user") throw new AccessError("Päringut ei leitud");
    need.status = status;
    this.audit(actor.id, "need.status", { needId, status });
    return need;
  }

  partnerInbox(p: User) {
    requireRole(p, "partner");
    return sortByPriority(this.db.needs.filter((n) => n.routedTo?.kind === "partner" && n.routedTo.id === p.partnerId))
      .map((n) => this.minimalForPartner(n));
  }

  // ───────── 3.4 varude haldus ─────────

  inventory(user: User, today = now().slice(0, 10)) {
    const h = this.householdOf(user);
    const items = this.db.inventory.filter((i) => i.householdId === h.id).sort((a, b) => (a.expiresAt ?? "9").localeCompare(b.expiresAt ?? "9"));
    return {
      household: h,
      items,
      expiring: expiringItems(items, today),
      template: templateFor(h.size),
      templateSource: taipConfig.inventory.templateSource,
      restock: buildRestockList(items, h.size, today),
    };
  }

  addInventoryItem(user: User, item: { name: string; quantity: number; unit: string; expiresAt?: string; templateKey?: string }) {
    const h = this.householdOf(user);
    if (!item.name.trim() || !(item.quantity > 0)) throw new Error("Nimi ja kogus on kohustuslikud");
    const row = { id: uid("i"), householdId: h.id, ...item, name: item.name.trim().slice(0, 80) };
    this.db.inventory.push(row);
    return row;
  }

  removeInventoryItem(user: User, id: string) {
    const h = this.householdOf(user);
    this.db.inventory = this.db.inventory.filter((i) => !(i.id === id && i.householdId === h.id));
  }

  /** Täiendustellimus e-Selveri adapterisse: (a) mock-tellimus või (b) sügavlingid. */
  async restock(user: User, mode: "order" | "links", today = now().slice(0, 10)) {
    const h = this.householdOf(user);
    const { restock } = this.inventory(user, today);
    if (restock.length === 0) return { mode, lines: [], links: [] };
    if (mode === "links") return { mode, lines: restock, links: this.adapters.food.shoppingLinks(restock) };
    const { externalRef, totalCents } = await this.adapters.food.placeOrder(restock, { regionId: h.regionId });
    const order = await this.pay(h.id, totalCents, "food", `Varude täiendus (${this.adapters.food.name})`);
    order.externalRef = externalRef;
    return { mode, lines: restock, order };
  }

  // ───────── 3.5–3.6 varjumine ─────────

  shelters(user: User, date = now().slice(0, 10)) {
    const h = user.householdId ? this.db.households.find((x) => x.id === user.householdId) : undefined;
    return this.db.shelters.map((s) => ({
      ...s,
      freePlaces: freePlaces(s, this.db.bookings, date, addDays(date, 1)),
      crisisActive: this.activeCrises(s.regionId).length > 0,
      isMyPlan: h?.shelterPlanId === s.id,
      inMyCounty: h ? isWithin(s.regionId, getRegion(h.regionId)?.parentId ?? h.regionId) : false,
    }));
  }

  setShelterPlan(user: User, shelterId: string | null) {
    const h = this.householdOf(user);
    if (shelterId && !this.db.shelters.some((s) => s.id === shelterId)) throw new BookingError("Varjumiskohta ei leitud");
    h.shelterPlanId = shelterId ?? undefined;
  }

  /** Kriisiaegne broneering: ainult siis, kui varjumiskoha piirkonnas on kriis. */
  async bookCrisisShelter(user: User, shelterId: string, people: number, accessibleNeeded = false): Promise<Booking> {
    const h = this.householdOf(user);
    const shelter = this.db.shelters.find((s) => s.id === shelterId);
    if (!shelter) throw new BookingError("Varjumiskohta ei leitud");
    if (this.activeCrises(shelter.regionId).length === 0) throw new BookingError("Varjumiskoht on broneeritav kriisi ajal");
    const from = now().slice(0, 10);
    assertCanBook(shelter, this.db.bookings, people, from);
    const booking: Booking = { id: uid("b"), shelterId, householdId: h.id, people, kind: "crisis", from, status: "confirmed", createdAt: now() };
    this.db.bookings.push(booking);
    await this.adapters.shelters.notifyBooking({ shelterId, people, from, accessibleNeeded });
    this.audit(user.id, "shelter.booked", { bookingId: booking.id, shelterId, count: people });
    return booking;
  }

  /** "2 ööd" pakett – müüdav ka tavaajal. Ootab partneri kinnitust. */
  async bookTwoNights(user: User, shelterId: string, from: string, people: number): Promise<Booking> {
    const h = this.householdOf(user);
    const shelter = this.db.shelters.find((s) => s.id === shelterId);
    if (!shelter?.twoNightsPriceCentsPerPerson) throw new BookingError("Sellel kohal pole 2 öö paketti");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || from < now().slice(0, 10)) throw new BookingError("Vigane kuupäev");
    const to = addDays(from, taipConfig.twoNights.nights);
    assertCanBook(shelter, this.db.bookings, people, from, to);
    const booking: Booking = { id: uid("b"), shelterId, householdId: h.id, people, kind: "two_nights", from, to, status: "pending_partner", createdAt: now() };
    this.db.bookings.push(booking); // broneering hõivab kohad kohe → ülebroneerimist ei teki
    try {
      const order = await this.pay(h.id, shelter.twoNightsPriceCentsPerPerson * people, "accommodation", `2 ööd: ${shelter.name}`);
      booking.orderId = order.id;
    } catch (e) {
      booking.status = "cancelled";
      throw e;
    }
    this.audit(user.id, "two_nights.booked", { bookingId: booking.id, shelterId, count: people });
    return booking;
  }

  partnerConfirmBooking(p: User, bookingId: string) {
    requireRole(p, "partner", "admin");
    const b = this.db.bookings.find((x) => x.id === bookingId);
    const shelter = b && this.db.shelters.find((s) => s.id === b.shelterId);
    if (!b || !shelter || (p.role === "partner" && shelter.partnerId !== p.partnerId)) throw new AccessError("Broneeringut ei leitud");
    if (b.status !== "pending_partner") throw new BookingError("Broneering ei oota kinnitust");
    b.status = "confirmed";
    this.audit(p.id, "booking.confirmed", { bookingId });
    return b;
  }

  cancelBooking(user: User, bookingId: string, today = now().slice(0, 10)) {
    const h = this.householdOf(user);
    const b = this.db.bookings.find((x) => x.id === bookingId && x.householdId === h.id);
    if (!b || b.status === "cancelled") throw new BookingError("Broneeringut ei leitud");
    b.status = "cancelled";
    let refundCents = 0;
    const order = b.orderId ? this.db.orders.find((o) => o.id === b.orderId) : undefined;
    const freeUntil = addDays(b.from, -taipConfig.twoNights.freeCancellationDays);
    if (order && today <= freeUntil) {
      order.status = "cancelled";
      refundCents = order.totalCents;
      // MVP: tagastus isiklikku reservi (päris maksed väljaspool ulatust).
      this.db.personalReserves[h.id] = (this.db.personalReserves[h.id] ?? 0) + order.totalCents;
    }
    this.audit(user.id, "booking.cancelled", { bookingId, amountCents: refundCents });
    return { booking: b, refundCents };
  }

  bookingsOf(user: User) {
    const h = this.householdOf(user);
    return this.db.bookings.filter((b) => b.householdId === h.id).map((b) => ({ ...b, shelter: this.db.shelters.find((s) => s.id === b.shelterId)! }));
  }

  partnerBookings(p: User) {
    requireRole(p, "partner");
    const mine = new Set(this.db.shelters.filter((s) => s.partnerId === p.partnerId).map((s) => s.id));
    return this.db.bookings.filter((b) => mine.has(b.shelterId)).map(({ householdId: _h, ...b }) => b);
  }

  // ───────── 3.7 varjendi upgrade ─────────

  async createUpgradeRequest(user: User, input: Omit<UpgradeRequest, "id" | "householdId" | "regionId" | "status" | "partnerId" | "createdAt">) {
    const h = this.householdOf(user);
    const county = getRegion(h.regionId)?.parentId ?? h.regionId;
    const partner = this.db.partners.find((p) => p.kind === "contractor" && p.regionIds.includes(county))
      ?? this.db.partners.find((p) => p.kind === "contractor");
    if (!partner) throw new Error("Sobivat partnerit ei leitud");
    const req: UpgradeRequest = {
      ...input, id: uid("up"), householdId: h.id, regionId: h.regionId, status: "sent", partnerId: partner.id, createdAt: now(),
    };
    this.db.upgradeRequests.push(req);
    const delivery = await this.adapters.contractor.sendRequest(req);
    this.audit(user.id, "upgrade.sent", { partnerId: partner.id });
    return { request: req, partner, delivery };
  }
}

function mergeDaily(lists: { date: string; count: number }[][]) {
  const m = new Map<string, number>();
  for (const l of lists) for (const p of l) m.set(p.date, (m.get(p.date) ?? 0) + p.count);
  return [...m.entries()].sort().map(([date, count]) => ({ date, count }));
}
