import { getRegion, REGIONS } from "@config/regions";
import { pageUser, type SP } from "@/lib/page";
import { service } from "@/lib/session";
import { getDb } from "@/data/db";
import { formatEur } from "@/i18n/messages";
import Flash from "@/components/Flash";
import { approveCrisis, deposit, endCrisis, requestCrisis } from "../actions";

const TYPE = { donation: "Annetus", kov: "KOV", state: "Riik", allocation: "Kriisisaldod (väljamakse)", return: "Jäägi tagastus" };

export default async function AdminPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const user = await pageUser("admin");
  const svc = service();
  const db = getDb();
  const ledger = svc.fundLedger(user);
  const crises = [...db.crises].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const name = (id: string) => db.users.find((u) => u.id === id)?.name ?? id;

  return (
    <>
      <h1>Kriisirežiim ja reservfond</h1>
      <Flash sp={sp} />
      <p className="muted">Taip! ei kuuluta kriisi ise välja – admin peegeldab riigi või KOV ametlikku otsust. Aktiveerimine nõuab kahe erineva admini kinnitust. Kõik sammud logitakse.</p>

      <h2>Kriisid</h2>
      {crises.length === 0 && <p className="muted">Kriise pole.</p>}
      {crises.map((c) => (
        <div key={c.id} className="card">
          <div className="spread">
            <strong>{c.title} – {getRegion(c.regionId)?.name}</strong>
            <span className={`chip ${c.status === "active" ? "critical" : c.status === "pending" ? "urgent" : ""}`}>
              {{ pending: "ootab kinnitust", active: "aktiivne", ended: "lõppenud" }[c.status]}
            </span>
          </div>
          <p><small>Allikas: {c.officialSource}</small><br /><small>Kinnitajad: {c.approvals.map(name).join(", ")}</small></p>
          {c.status === "pending" && !c.approvals.includes(user.id) && (
            <form action={approveCrisis}><input type="hidden" name="crisisId" value={c.id} /><button className="btn danger" type="submit">Kinnita ja aktiveeri</button></form>
          )}
          {c.status === "pending" && c.approvals.includes(user.id) && <p className="muted">Ootab teise admini kinnitust (logi sisse teise adminina).</p>}
          {c.status === "active" && (
            <form action={endCrisis}><input type="hidden" name="crisisId" value={c.id} /><button className="btn secondary" type="submit">Lõpeta kriis (jääk naaseb fondi)</button></form>
          )}
        </div>
      ))}

      <form action={requestCrisis} className="card">
        <h3>Algata kriisirežiim</h3>
        <label htmlFor="r">Piirkond (maakond või omavalitsus)</label>
        <select id="r" name="regionId" required>
          {REGIONS.map((r) => <option key={r.id} value={r.id}>{r.kind === "municipality" ? "— " : ""}{r.name}</option>)}
        </select>
        <label htmlFor="t">Pealkiri</label>
        <input id="t" name="title" required placeholder="nt Torm ja ulatuslik elektrikatkestus" />
        <label htmlFor="s">Ametliku otsuse allikas</label>
        <input id="s" name="officialSource" required placeholder="nt Vabariigi Valitsuse korraldus nr …, kuupäev, link" />
        <button className="btn" type="submit" style={{ marginTop: 12 }}>Esita (1/2 kinnitust)</button>
      </form>

      <h2>Reservfond</h2>
      <div className="card"><small>Saldo</small><div className="big-number">{formatEur(ledger.balanceCents)}</div></div>
      <form action={deposit} className="card">
        <h3>Sissemakse</h3>
        <div className="grid">
          <div><label htmlFor="ty">Allikas</label><select id="ty" name="type"><option value="donation">Annetus</option><option value="kov">KOV</option><option value="state">Riik</option></select></div>
          <div><label htmlFor="a">Summa (€)</label><input id="a" name="amountEur" type="number" min="1" step="0.01" required /></div>
        </div>
        <label htmlFor="n">Märkus</label>
        <input id="n" name="note" />
        <button className="btn" type="submit" style={{ marginTop: 12 }}>Lisa</button>
      </form>
      <div className="card table-wrap">
        <table>
          <thead><tr><th>Aeg</th><th>Tüüp</th><th>Märkus</th><th className="num">Summa</th></tr></thead>
          <tbody>
            {ledger.entries.map((e) => (
              <tr key={e.id}><td>{e.at.slice(0, 16).replace("T", " ")}</td><td>{TYPE[e.type]}</td><td>{e.note}</td><td className="num">{formatEur(e.amountCents)}</td></tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Auditilogi</h2>
      <div className="card table-wrap">
        <table>
          <thead><tr><th>Aeg</th><th>Tegija</th><th>Tegevus</th><th>Detailid</th></tr></thead>
          <tbody>
            {[...db.audit].reverse().slice(0, 50).map((a) => (
              <tr key={a.id}><td>{a.at.slice(11, 19)}</td><td>{name(a.actorId)}</td><td>{a.action}</td><td><small>{JSON.stringify(a.details)}</small></td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
