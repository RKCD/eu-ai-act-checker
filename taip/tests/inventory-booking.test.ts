import { describe, expect, it } from "vitest";
import { addDays, BookingError } from "@/domain/booking";
import { buildRestockList, expiringItems } from "@/domain/inventory";
import { activateCrisis, setup } from "./helpers";

const today = "2026-10-11";

describe("varude haldus → e-Selveri adapter", () => {
  it("aeguva varu meeldetuletus", () => {
    const { svc, u } = setup();
    const inv = svc.inventory(u("u-mari"), today);
    expect(inv.expiring.map((i) => i.name)).toEqual(["Joogivesi"]);
  });

  it("täiendusnimekiri sisaldab aeguvaid ja malli järgi puuduolevaid tooteid", () => {
    const { db } = setup();
    const items = db.inventory.filter((i) => i.householdId === "h-mari");
    const list = buildRestockList(items, 4, today);
    const water = list.find((l) => l.templateKey === "water")!;
    expect(water.reason).toBe("expiring");
    expect(water.quantity).toBeGreaterThanOrEqual(84); // 21 l × 4 inimest
    expect(list.find((l) => l.templateKey === "firstaid")?.reason).toBe("missing");
    expect(list.find((l) => l.templateKey === "batteries")!.quantity).toBe(8); // 16 vaja, 8 olemas
    expect(expiringItems(items, today)).toHaveLength(1);
  });

  it("täiendustellimus läheb e-Selveri adapterisse (mock) või sügavlinkidena", async () => {
    const { svc, u, db } = setup();
    const links = await svc.restock(u("u-mari"), "links", today);
    expect(links.links!.every((l) => l.url.startsWith("https://www.selver.ee/search?q="))).toBe(true);

    const res = await svc.restock(u("u-mari"), "order", today);
    expect(res.order!.externalRef).toMatch(/^SELVER-MOCK-/);
    expect(res.order!.category).toBe("food");
    expect(db.orders).toHaveLength(1);
  });
});

describe("varjumiskohtade broneerimine", () => {
  it("tavaajal ei saa avalikku varjumiskohta kriisibroneerida", async () => {
    const { svc, u } = setup();
    await expect(svc.bookCrisisShelter(u("u-mari"), "s-kesklinn", 2)).rejects.toThrow(BookingError);
  });

  it("broneering vähendab vabu kohti; ülebroneerida ei saa", async () => {
    const { svc, u, db } = setup();
    activateCrisis(svc, u, "harju");
    const s = db.shelters.find((x) => x.id === "s-viimsi-kool")!;
    const free0 = svc.shelters(u("u-olga")).find((x) => x.id === s.id)!.freePlaces;
    expect(free0).toBe(60);
    await svc.bookCrisisShelter(u("u-olga"), s.id, 50);
    expect(svc.shelters(u("u-olga")).find((x) => x.id === s.id)!.freePlaces).toBe(10);
    await expect(svc.bookCrisisShelter(u("u-mari"), s.id, 11)).rejects.toThrow(/Vabu kohti/);
    await svc.bookCrisisShelter(u("u-mari"), s.id, 10);
    expect(svc.shelters(u("u-mari")).find((x) => x.id === s.id)!.freePlaces).toBe(0);
    await expect(svc.bookCrisisShelter(u("u-mari"), s.id, 1)).rejects.toThrow(BookingError);
  });

  it("'2 ööd' pakett: kalender, hind, partneri kinnitus, ülebroneerimise kaitse ja tühistus", async () => {
    const { svc, u, db } = setup();
    const from = addDays(new Date().toISOString().slice(0, 10), 10);
    const b = await svc.bookTwoNights(u("u-taavi"), "s-metsamaja", from, 3);
    expect(b.status).toBe("pending_partner");
    expect(b.to).toBe(addDays(from, 2));
    const order = db.orders.find((o) => o.id === b.orderId)!;
    expect(order.totalCents).toBe(3 * 4500);
    expect(order.parts.map((p) => p.source)).toEqual(["personal_reserve", "direct"]);

    // mahutavus 10: 3 + 7 mahub, +1 enam mitte; mittekattuval perioodil mahub
    await svc.bookTwoNights(u("u-mari"), "s-metsamaja", addDays(from, 1), 7);
    await expect(svc.bookTwoNights(u("u-olga"), "s-metsamaja", addDays(from, 1), 1)).rejects.toThrow(BookingError);
    await svc.bookTwoNights(u("u-olga"), "s-metsamaja", addDays(from, 3), 1);

    // partneri kinnitus – ainult kohta omav partner
    expect(() => svc.partnerConfirmBooking(u("u-p-toit"), b.id)).toThrow();
    expect(svc.partnerConfirmBooking(u("u-p-maamaja"), b.id).status).toBe("confirmed");

    // tühistus vabastab kohad ja tagastab raha (tasuta tühistusperioodis)
    const reserve0 = db.personalReserves["h-taavi"];
    const { refundCents } = svc.cancelBooking(u("u-taavi"), b.id);
    expect(refundCents).toBe(13500);
    expect(db.personalReserves["h-taavi"]).toBe(reserve0 + 13500);
    await svc.bookTwoNights(u("u-olga"), "s-metsamaja", addDays(from, 1), 1);
  });
});
