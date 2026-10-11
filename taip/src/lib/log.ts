/**
 * Logija, kuhu EI satu isikuandmeid. Lubatud on ainult valge nimekirja võtmed
 * ja primitiivsed väärtused; vabateksti ega nimesid ei logita kunagi.
 */
const ALLOWED_KEYS = new Set([
  "event", "needId", "crisisId", "orderId", "bookingId", "shelterId", "offerId", "partnerId",
  "regionId", "category", "urgency", "status", "count", "amountCents", "durationMs", "step", "mode", "error",
]);

type Primitive = string | number | boolean;

export function sanitize(fields: Record<string, unknown>): Record<string, Primitive> {
  const out: Record<string, Primitive> = {};
  for (const [k, v] of Object.entries(fields)) {
    if (!ALLOWED_KEYS.has(k)) continue;
    if (typeof v === "number" || typeof v === "boolean") out[k] = v;
    else if (typeof v === "string") out[k] = k === "error" ? v.slice(0, 80) : v.slice(0, 64);
  }
  return out;
}

export function log(event: string, fields: Record<string, unknown> = {}) {
  if (process.env.NODE_ENV === "test") return;
  console.info(JSON.stringify({ ts: new Date().toISOString(), ...sanitize({ ...fields, event }) }));
}
