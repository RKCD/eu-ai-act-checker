import { getRegion } from "@config/regions";
import { pageUser, type SP } from "@/lib/page";
import { service } from "@/lib/session";
import { getDb } from "@/data/db";
import { t } from "@/i18n/messages";
import Flash from "@/components/Flash";
import { confirmBooking, resolveNeed } from "../actions";

export default async function PartnerPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const user = await pageUser("partner");
  const svc = service();
  const inbox = svc.partnerInbox(user);
  const bookings = svc.partnerBookings(user);
  const partner = getDb().partners.find((p) => p.id === user.partnerId);
  const m = t("et");
  return (
    <>
      <h1>{partner?.name}</h1>
      <Flash sp={sp} />
      <p className="muted">Näed ainult sulle suunatud päringuid ja ainult teenuse osutamiseks vajalikku miinimumi.</p>
      <h2>Päringud</h2>
      {inbox.length === 0 && <p className="muted">Uusi päringuid pole.</p>}
      {inbox.map((n) => (
        <div key={n.id} className="card">
          <div className="spread">
            <strong>{n.categories.map((c) => m.categories[c]).join(", ")}</strong>
            <span className={`chip ${n.urgency}`}>{m.urgency[n.urgency]}</span>
          </div>
          <p>{n.summary}</p>
          <small>{getRegion(n.regionId)?.name} · {n.householdSize} inimest{n.accessibleNeeded ? " · vajab ligipääsetavat lahendust" : ""}</small>
          <form action={resolveNeed} style={{ marginTop: 8 }}><input type="hidden" name="needId" value={n.id} /><button className="btn small secondary" type="submit">Märgi täidetuks</button></form>
        </div>
      ))}
      <h2>Broneeringud</h2>
      {bookings.length === 0 && <p className="muted">Broneeringuid pole.</p>}
      {bookings.map((b) => (
        <div key={b.id} className="card spread">
          <span>{b.kind === "two_nights" ? "2 ööd" : "Kriis"} · {b.from}{b.to ? ` – ${b.to}` : ""} · {b.people} inimest · {b.status}</span>
          {b.status === "pending_partner" && (
            <form action={confirmBooking}><input type="hidden" name="bookingId" value={b.id} /><button className="btn small" type="submit">Kinnita</button></form>
          )}
        </div>
      ))}
    </>
  );
}
