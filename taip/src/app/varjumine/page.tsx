import { getRegion } from "@config/regions";
import { taipConfig } from "@config/taip.config";
import { addDays } from "@/domain/booking";
import { pageUser, type SP } from "@/lib/page";
import { service } from "@/lib/session";
import { formatEur } from "@/i18n/messages";
import Flash from "@/components/Flash";
import { bookCrisis, bookTwoNights, cancelBooking, setPlan } from "../actions";

const KIND = { public: "Avalik varjumiskoht", private: "Eravarjend", cottage: "Maamaja" };

export default async function SheltersPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const user = await pageUser("user");
  const svc = service();
  const h = svc.householdOf(user);
  const shelters = svc.shelters(user).sort((a, b) => Number(b.isMyPlan) - Number(a.isMyPlan) || Number(b.inMyCounty) - Number(a.inMyCounty));
  const bookings = svc.bookingsOf(user).filter((b) => b.status !== "cancelled");
  const minDate = addDays(new Date().toISOString().slice(0, 10), 1);

  return (
    <>
      <h1>Varjumine</h1>
      <Flash sp={sp} />

      {bookings.length > 0 && (
        <>
          <h2>Minu broneeringud</h2>
          {bookings.map((b) => (
            <div key={b.id} className="card spread">
              <div>
                <strong>{b.shelter.name}</strong><br />
                <small>{b.kind === "crisis" ? `Kriisibroneering alates ${b.from}` : `2 ööd: ${b.from} – ${b.to}`} · {b.people} inimest · {b.status === "pending_partner" ? "ootab partneri kinnitust" : "kinnitatud"}</small>
              </div>
              <form action={cancelBooking}><input type="hidden" name="bookingId" value={b.id} /><button className="btn secondary small" type="submit">Tühista</button></form>
            </div>
          ))}
          <p className="muted">Tasuta tühistamine kuni {taipConfig.twoNights.freeCancellationDays} päeva enne algust.</p>
        </>
      )}

      <h2>Varjumiskohad</h2>
      {shelters.map((s) => (
        <div key={s.id} className="card">
          <div className="spread">
            <h3>{s.isMyPlan ? "⭐ " : ""}{s.name}</h3>
            <span className={`chip ${s.freePlaces === 0 ? "critical" : "good"}`}>{s.freePlaces}/{s.capacity} vaba</span>
          </div>
          <p className="muted">{KIND[s.kind]} · {getRegion(s.regionId)?.name} · {s.address}</p>
          <p>
            {s.equipment.heating && <span className="chip">küte</span>}
            {s.equipment.water && <span className="chip">vesi</span>}
            {s.equipment.comms && <span className="chip">side</span>}
            {s.equipment.accessible && <span className="chip">ligipääsetav</span>}
            <span className="chip">kehtib {s.validUntil}</span>
          </p>
          <p><small>Kontakt: {s.contact}</small></p>
          <div className="row">
            <form action={setPlan}>
              <input type="hidden" name="shelterId" value={s.isMyPlan ? "" : s.id} />
              <button className="btn secondary small" type="submit">{s.isMyPlan ? "Eemalda plaanist" : "Minu varjumisplaan"}</button>
            </form>
            {s.crisisActive && (
              <form action={bookCrisis} className="row">
                <input type="hidden" name="shelterId" value={s.id} />
                <input type="number" name="people" min={1} max={s.freePlaces} defaultValue={Math.min(h.size, s.freePlaces || 1)} style={{ width: 90 }} aria-label="Inimeste arv" />
                <button className="btn help small" type="submit" disabled={s.freePlaces === 0}>Broneeri koht kohe</button>
              </form>
            )}
          </div>
          {s.twoNightsPriceCentsPerPerson && (
            <form action={bookTwoNights} className="card" style={{ background: "var(--surface-2)", marginTop: 12 }}>
              <strong>„2 ööd“ pakett – {formatEur(s.twoNightsPriceCentsPerPerson)} inimese kohta</strong>
              <p><small>Eelbroneeritud koht 2 ööks koos varude ja soojaga. Sobib ka valmisolekutreeninguks.</small></p>
              <input type="hidden" name="shelterId" value={s.id} />
              <div className="grid">
                <div><label htmlFor={`f-${s.id}`}>Saabumine</label><input id={`f-${s.id}`} type="date" name="from" min={minDate} defaultValue={addDays(minDate, 13)} required /></div>
                <div><label htmlFor={`p-${s.id}`}>Inimesi</label><input id={`p-${s.id}`} type="number" name="people" min={1} max={s.capacity} defaultValue={h.size} required /></div>
              </div>
              <button className="btn small" type="submit" style={{ marginTop: 12 }}>Broneeri 2 ööd</button>
            </form>
          )}
        </div>
      ))}
    </>
  );
}
