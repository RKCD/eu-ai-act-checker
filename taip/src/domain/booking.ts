import type { Booking, Shelter } from "./types";

export class BookingError extends Error {}

const FAR_FUTURE = "9999-12-31";

function overlaps(aFrom: string, aTo: string | undefined, bFrom: string, bTo: string | undefined) {
  return aFrom < (bTo ?? FAR_FUTURE) && bFrom < (aTo ?? FAR_FUTURE);
}

/** Vabad kohad perioodil [from, to): mahutavus miinus kattuvate aktiivsete broneeringute tipukoormus. */
export function freePlaces(shelter: Shelter, bookings: Booking[], from: string, to?: string): number {
  const active = bookings.filter(
    (b) => b.shelterId === shelter.id && b.status !== "cancelled" && overlaps(b.from, b.to, from, to),
  );
  // Tipukoormus: kontrolli iga perioodi sees algavat broneeringut + perioodi algust.
  const points = new Set<string>([from, ...active.map((b) => b.from).filter((d) => d >= from)]);
  let peak = 0;
  for (const day of points) {
    const load = active.filter((b) => b.from <= day && day < (b.to ?? FAR_FUTURE)).reduce((s, b) => s + b.people, 0);
    peak = Math.max(peak, load);
  }
  return Math.max(0, shelter.capacity - peak);
}

/** Kontrollib, et broneering mahub. Ülebroneerida ei saa. */
export function assertCanBook(shelter: Shelter, bookings: Booking[], people: number, from: string, to?: string) {
  if (!Number.isInteger(people) || people < 1) throw new BookingError("Inimeste arv peab olema vähemalt 1");
  if (to && to <= from) throw new BookingError("Lõppkuupäev peab olema pärast alguskuupäeva");
  if (shelter.validUntil < from) throw new BookingError("Varjumiskoha andmed ei kehti enam");
  const free = freePlaces(shelter, bookings, from, to);
  if (people > free) throw new BookingError(`Vabu kohti ei ole piisavalt (vabu: ${free})`);
}

export function addDays(isoDate: string, days: number): string {
  const d = new Date(isoDate + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
