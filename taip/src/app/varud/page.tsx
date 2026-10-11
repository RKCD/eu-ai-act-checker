import { pageUser, type SP } from "@/lib/page";
import { service } from "@/lib/session";
import { adapters } from "@/adapters/mock";
import { formatEur } from "@/i18n/messages";
import Flash from "@/components/Flash";
import { addItem, removeItem, restockOrder } from "../actions";

export default async function StockPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const user = await pageUser("user");
  const inv = service().inventory(user);
  const links = adapters.food.shoppingLinks(inv.restock);
  const estimate = adapters.food.estimate(inv.restock);
  const have = (key: string) => inv.items.filter((i) => i.templateKey === key).reduce((s, i) => s + i.quantity, 0);

  return (
    <>
      <h1>Minu varud</h1>
      <Flash sp={sp} />
      <p className="muted">{inv.household.name} · {inv.household.size} inimest</p>

      {inv.expiring.length > 0 && (
        <div className="banner info" role="status">
          ⏰ Aegumas: {inv.expiring.map((i) => `${i.name} (${i.expiresAt})`).join(", ")}
        </div>
      )}

      <h2>Täiendusnimekiri</h2>
      {inv.restock.length === 0 ? <p className="ok">Kõik soovituslikud varud on olemas.</p> : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead><tr><th>Toode</th><th className="num">Kogus</th><th>Põhjus</th><th>e-Selver</th></tr></thead>
              <tbody>
                {inv.restock.map((l, i) => (
                  <tr key={i}>
                    <td>{l.name}</td>
                    <td className="num">{l.quantity} {l.unit}</td>
                    <td>{l.reason === "expiring" ? <span className="chip urgent">aegumas</span> : <span className="chip">puudu</span>}</td>
                    <td><a href={links[i].url} target="_blank" rel="noreferrer">otsi →</a></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <form action={restockOrder} className="row" style={{ marginTop: 12 }}>
            <button className="btn" type="submit">Telli e-Selverist (~{formatEur(estimate)})</button>
            <span className="muted">MVP: mock-tellimus. Või kasuta ülal sügavlinke.</span>
          </form>
        </div>
      )}

      <h2>Varud</h2>
      <div className="card table-wrap">
        <table>
          <thead><tr><th>Toode</th><th className="num">Kogus</th><th>Aegub</th><th></th></tr></thead>
          <tbody>
            {inv.items.map((i) => (
              <tr key={i.id}>
                <td>{i.name}</td>
                <td className="num">{i.quantity} {i.unit}</td>
                <td>{i.expiresAt ?? "—"}</td>
                <td>
                  <form action={removeItem}><input type="hidden" name="id" value={i.id} /><button className="btn secondary small" type="submit" aria-label={`Eemalda ${i.name}`}>✕</button></form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form action={addItem} className="card">
        <h3>Lisa toode</h3>
        <label htmlFor="tk">Tüüp (mall)</label>
        <select id="tk" name="templateKey" defaultValue="">
          <option value="">— muu —</option>
          {inv.template.map((t) => <option key={t.key} value={t.key}>{t.name}</option>)}
        </select>
        <label htmlFor="nm">Nimetus</label>
        <input id="nm" name="name" required />
        <div className="grid">
          <div><label htmlFor="q">Kogus</label><input id="q" name="quantity" type="number" min="0.1" step="0.1" required /></div>
          <div><label htmlFor="u">Ühik</label><input id="u" name="unit" defaultValue="tk" /></div>
          <div><label htmlFor="e">Aegub</label><input id="e" name="expiresAt" type="date" /></div>
        </div>
        <button className="btn" type="submit" style={{ marginTop: 12 }}>Lisa</button>
      </form>

      <h2>Soovituslik valmisolekuvaru</h2>
      <p className="muted">Allikas: {inv.templateSource}</p>
      <div className="card table-wrap">
        <table>
          <thead><tr><th>Toode</th><th className="num">Soovitus</th><th className="num">Olemas</th></tr></thead>
          <tbody>
            {inv.template.map((t) => (
              <tr key={t.key}>
                <td>{t.name}</td>
                <td className="num">{t.recommended} {t.unit}</td>
                <td className="num">{have(t.key) >= t.recommended ? <span className="ok">✓ {have(t.key)}</span> : have(t.key)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
